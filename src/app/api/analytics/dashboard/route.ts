import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAdminRequest } from "@/lib/auth"

function classifySource(referrer: string, utm?: { source?: string; medium?: string; fbclid?: string; gclid?: string }): string {
  const r = referrer.toLowerCase()

  // Paid social detection via UTM or click IDs
  if ((utm?.source && utm.source.toLowerCase().includes("facebook")) || utm?.fbclid) {
    return "social_paid"
  }
  if ((utm?.source && utm.source.toLowerCase().includes("instagram")) || r.includes("instagram.")) {
    if (utm?.medium?.toLowerCase().includes("paid") || utm?.medium?.toLowerCase().includes("cpc") || utm?.medium?.toLowerCase().includes("cpm")) {
      return "social_paid"
    }
  }
  if ((utm?.source && utm.source.toLowerCase().includes("twitter")) || r.includes("twitter.") || r.includes("x.com")) {
    if (utm?.medium?.toLowerCase().includes("paid") || utm?.medium?.toLowerCase().includes("cpc")) {
      return "social_paid"
    }
  }
  if ((utm?.source && utm.source.toLowerCase().includes("tiktok")) || r.includes("tiktok.")) {
    if (utm?.medium?.toLowerCase().includes("paid") || utm?.medium?.toLowerCase().includes("cpc") || utm?.medium?.toLowerCase().includes("cpm")) {
      return "social_paid"
    }
  }
  if ((utm?.source && utm.source.toLowerCase().includes("linkedin")) || r.includes("linkedin.")) {
    if (utm?.medium?.toLowerCase().includes("paid") || utm?.medium?.toLowerCase().includes("cpc")) {
      return "social_paid"
    }
  }

  // Paid search via UTM or gclid
  if (utm?.gclid || (utm?.source && utm.source.toLowerCase().includes("google") && utm?.medium?.includes("cpc"))) {
    return "search_paid"
  }

  if (!referrer) {
    if (utm?.source) return "referral"
    return "direct"
  }

  // Organic social
  if (r.includes("facebook.") || r.includes("instagram.") || r.includes("twitter.") || r.includes("x.com") || r.includes("tiktok.") || r.includes("linkedin.") || r.includes("pinterest.") || r.includes("reddit.") || r.includes("youtube.") || r.includes("whatsapp.") || r.includes("snapchat.")) {
    return "social_organic"
  }

  // Organic search
  if (r.includes("google.") || r.includes("bing.") || r.includes("yahoo.") || r.includes("duckduckgo.") || r.includes("baidu.") || r.includes("yandex.")) {
    return "search"
  }

  return "referral"
}

function classifyDevice(userAgent: string): string {
  const ua = (userAgent || "").toLowerCase()
  if (ua.includes("tablet") || ua.includes("ipad")) return "Tablet"
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "Mobile"
  return "Desktop"
}

// Simple IP-to-geo (uses existing visitor_logs data for demo; in production use a geo DB or service)
function extractBrowser(userAgent: string): string {
  const ua = (userAgent || "").toLowerCase()
  if (ua.includes("edg")) return "Edge"
  if (ua.includes("chrome")) return "Chrome"
  if (ua.includes("safari")) return "Safari"
  if (ua.includes("firefox")) return "Firefox"
  if (ua.includes("opera")) return "Opera"
  return "Other"
}

function extractOS(userAgent: string): string {
  const ua = (userAgent || "").toLowerCase()
  if (ua.includes("windows")) return "Windows"
  if (ua.includes("mac os") || ua.includes("macintosh")) return "macOS"
  if (ua.includes("android")) return "Android"
  if (ua.includes("ios") || ua.includes("iphone") || ua.includes("ipad")) return "iOS"
  if (ua.includes("linux")) return "Linux"
  return "Other"
}

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const url = new URL(request.url)
    const days = parseInt(url.searchParams.get("days") || "30")
    const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()

    // ==================== 1. Source Channel Analysis ====================
    // Fetch all visitor_logs with UTM data for campaign & source analysis
    const { data: sourceLogs } = await supabase
      .from("visitor_logs")
      .select("referrer, source_category, event_type, session_id, ip, utm_source, utm_medium, utm_campaign, utm_params")
      .gte("created_at", since)

    // Helper: extract UTM params from a log row (try columns first, then utm_params JSON)
    function extractUtm(log: any): { source?: string; medium?: string; campaign?: string; fbclid?: string; gclid?: string } | undefined {
      const src = log.utm_source
      const med = log.utm_medium
      const cam = log.utm_campaign
      const fbclid = log.fbclid
      const gclid = log.gclid
      if (src || med || cam || fbclid || gclid) return { source: src, medium: med, campaign: cam, fbclid, gclid }
      if (log.utm_params) {
        try {
          const p = typeof log.utm_params === "string" ? JSON.parse(log.utm_params) : log.utm_params
          if (p.source || p.medium || p.campaign || p.fbclid || p.gclid) return p
        } catch { /* ignore */ }
      }
      return undefined
    }

    const channelCounts: Record<string, { sessions: Set<string>; pageviews: number; orders: number }> = {
      direct: { sessions: new Set(), pageviews: 0, orders: 0 },
      search: { sessions: new Set(), pageviews: 0, orders: 0 },
      search_paid: { sessions: new Set(), pageviews: 0, orders: 0 },
      social_organic: { sessions: new Set(), pageviews: 0, orders: 0 },
      social_paid: { sessions: new Set(), pageviews: 0, orders: 0 },
      referral: { sessions: new Set(), pageviews: 0, orders: 0 },
    }

    for (const log of sourceLogs || []) {
      const utm = extractUtm(log)
      const cat = log.source_category || classifySource(log.referrer || "", utm)
      if (!channelCounts[cat]) {
        channelCounts[cat] = { sessions: new Set(), pageviews: 0, orders: 0 }
      }
      if (log.session_id) channelCounts[cat].sessions.add(log.session_id)
      if (log.event_type === "pageview") channelCounts[cat].pageviews++
      if (log.event_type === "order") channelCounts[cat].orders++
    }

    // Fetch total orders for conversion rate calculation
    const { data: allOrders } = await supabase
      .from("orders")
      .select("id, total_ghs, created_at, customer_ip")
      .gte("created_at", since)

    const totalOrders = allOrders?.length || 0
    const totalRevenue = (allOrders || []).reduce((sum, o) => sum + (Number(o.total_ghs) || 0), 0)

    const sourceAnalysis = Object.entries(channelCounts).map(([channel, data]) => ({
      channel,
      label: channel === "direct" ? "Direct" : channel === "search" ? "Search Engines" : channel === "search_paid" ? "Paid Search" : channel === "social_organic" ? "Organic Social" : channel === "social_paid" ? "Paid Social" : "Referral",
      sessions: data.sessions.size,
      pageviews: data.pageviews,
      orders: data.orders,
      conversionRate: data.sessions.size > 0 ? ((data.orders / data.sessions.size) * 100).toFixed(2) : "0",
      revenue: 0,
    }))

    // ==================== Campaign Performance ====================
    // Map session_id -> { campaign, source } from the first log in that session with UTM data
    const sessionCampaignMap: Record<string, { campaign: string; source: string }> = {}
    for (const log of sourceLogs || []) {
      if (!log.session_id || sessionCampaignMap[log.session_id]) continue
      const utm = extractUtm(log)
      const campaign = utm?.campaign
      const source = utm?.source || classifySource(log.referrer || "", utm)
      if (campaign) {
        sessionCampaignMap[log.session_id] = { campaign, source }
      }
    }

    // Build ip->session_id map from visitor_logs
    const ipSessionMap: Record<string, string> = {}
    for (const log of sourceLogs || []) {
      if (log.ip && log.session_id && !ipSessionMap[log.ip]) {
        ipSessionMap[log.ip] = log.session_id
      }
    }

    // Aggregate campaign stats from visitor_logs
    const campaignStats: Record<string, { campaign: string; source: string; sessions: Set<string>; pageviews: number; orders: number; revenue: number }> = {}
    for (const log of sourceLogs || []) {
      if (!log.session_id) continue
      const c = sessionCampaignMap[log.session_id]
      if (!c) continue
      const key = c.campaign
      if (!campaignStats[key]) {
        campaignStats[key] = { campaign: c.campaign, source: c.source, sessions: new Set(), pageviews: 0, orders: 0, revenue: 0 }
      }
      campaignStats[key].sessions.add(log.session_id)
      if (log.event_type === "pageview") campaignStats[key].pageviews++
      if (log.event_type === "order") campaignStats[key].orders++
    }

    // Link orders to campaigns via customer_ip -> session mapping
    for (const order of allOrders || []) {
      const sessionId = order.customer_ip ? ipSessionMap[order.customer_ip] : undefined
      if (sessionId) {
        const c = sessionCampaignMap[sessionId]
        if (c && campaignStats[c.campaign]) {
          campaignStats[c.campaign].revenue += Number(order.total_ghs) || 0
        }
      }
    }

    const campaignPerformance = Object.values(campaignStats).map(c => ({
      campaign: c.campaign,
      source: c.source,
      sessions: c.sessions.size,
      orders: c.orders,
      revenue: c.revenue,
      conversionRate: c.sessions.size > 0 ? ((c.orders / c.sessions.size) * 100).toFixed(2) : "0",
    }))

    // ==================== Ad Spend & ROAS ====================
    const { data: adSpendSetting } = await supabase
      .from("site_settings")
      .select("value")
      .eq("key", "ad_spend_data")
      .maybeSingle()

    let adSpendData: Record<string, number> = {}
    if (adSpendSetting?.value) {
      try {
        adSpendData = typeof adSpendSetting.value === "string" ? JSON.parse(adSpendSetting.value) : adSpendSetting.value
      } catch { /* ignore */ }
    }
    const totalAdSpend = Object.values(adSpendData).reduce((sum, v) => sum + (Number(v) || 0), 0)
    const roas = totalAdSpend > 0 ? Number((totalRevenue / totalAdSpend).toFixed(2)) : null

    // ==================== 2. Conversion Funnel Analysis ====================
    const funnelStages = [
      { event: "pageview", label: "Browse Products" },
      { event: "view_product", label: "View Product" },
      { event: "add_to_cart", label: "Add to Cart" },
      { event: "checkout", label: "Checkout" },
      { event: "order", label: "Complete Payment" },
    ]

    const funnelData: { stage: string; value: number; pct: number }[] = []
    let prevCount: number | null = null

    for (const stage of funnelStages) {
      const { count } = await supabase
        .from("visitor_logs")
        .select("*", { count: "exact", head: true })
        .eq("event_type", stage.event)
        .gte("created_at", since)
      const value = count || 0
      const pct = prevCount !== null && prevCount > 0 ? Math.round((value / prevCount) * 100) : 100
      funnelData.push({ stage: stage.label, value, pct })
      if (stage.event === "pageview") prevCount = value
      else if (prevCount !== null) prevCount = value
    }

    // Drop-off analysis
    const dropoffs = []
    for (let i = 1; i < funnelData.length; i++) {
      const drop = funnelData[i - 1].value - funnelData[i].value
      const dropPct = funnelData[i - 1].value > 0 ? ((drop / funnelData[i - 1].value) * 100).toFixed(1) : "0"
      dropoffs.push({
        from: funnelData[i - 1].stage,
        to: funnelData[i].stage,
        drop,
        dropPct: dropPct + "%",
      })
    }

    // ==================== 3. On-Site Search Analysis ====================
    const { data: searchLogs } = await supabase
      .from("search_logs")
      .select("query, results_count")
      .gte("created_at", since)

    const queryCounts: Record<string, { count: number; zeroResults: number }> = {}
    for (const s of searchLogs || []) {
      const q = s.query.trim().toLowerCase()
      if (!q) continue
      if (!queryCounts[q]) queryCounts[q] = { count: 0, zeroResults: 0 }
      queryCounts[q].count++
      if (s.results_count === 0) queryCounts[q].zeroResults++
    }

    const topSearches = Object.entries(queryCounts)
      .sort((a, b) => b[1].count - a[1].count)
      .slice(0, 20)
      .map(([query, data]) => ({ query, count: data.count, zeroResults: data.zeroResults }))

    const zeroResultSearches = topSearches.filter(s => s.zeroResults > 0)
    const totalSearches = searchLogs?.length || 0
    const avgResults = totalSearches > 0
      ? (searchLogs || []).reduce((sum, s) => sum + (s.results_count || 0), 0) / totalSearches
      : 0

    // ==================== 4. Device & Geo Analysis ====================
    const { data: geoLogs } = await supabase
      .from("visitor_logs")
      .select("country, city, user_agent, session_id")
      .gte("created_at", since)

    // Device breakdown
    const deviceCounts: Record<string, { sessions: Set<string>; count: number }> = {
      Mobile: { sessions: new Set(), count: 0 },
      Desktop: { sessions: new Set(), count: 0 },
      Tablet: { sessions: new Set(), count: 0 },
    }
    const browserCounts: Record<string, number> = {}
    const osCounts: Record<string, number> = {}

    for (const log of geoLogs || []) {
      const device = classifyDevice(log.user_agent)
      if (!deviceCounts[device]) deviceCounts[device] = { sessions: new Set(), count: 0 }
      deviceCounts[device].count++
      if (log.session_id) deviceCounts[device].sessions.add(log.session_id)

      const browser = extractBrowser(log.user_agent)
      browserCounts[browser] = (browserCounts[browser] || 0) + 1

      const os = extractOS(log.user_agent)
      osCounts[os] = (osCounts[os] || 0) + 1
    }

    const deviceBreakdown = Object.entries(deviceCounts).map(([name, data]) => ({
      name,
      visits: data.count,
      sessions: data.sessions.size,
    }))

    const browserBreakdown = Object.entries(browserCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const osBreakdown = Object.entries(osCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    // Geo distribution
    const countryCounts: Record<string, number> = {}
    const cityCounts: Record<string, number> = {}
    for (const log of geoLogs || []) {
      const country = log.country || "Unknown"
      countryCounts[country] = (countryCounts[country] || 0) + 1
      const loc = [log.city, log.country].filter(Boolean).join(", ") || "Unknown"
      cityCounts[loc] = (cityCounts[loc] || 0) + 1
    }

    const geoDistribution = Object.entries(countryCounts)
      .sort((a, b) => b[1] - a[1])
      .map(([name, value]) => ({ name, value }))

    const cityDistribution = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 20)
      .map(([name, value]) => ({ name, value }))

    // ==================== Summary Stats ====================
    const { count: totalVisitors } = await supabase
      .from("visitor_logs")
      .select("*", { count: "exact", head: true })
      .gte("created_at", since)

    return NextResponse.json({
      period: { days, since },
      summary: { totalVisitors: totalVisitors || 0, totalOrders, totalRevenue, totalSearches },
      sourceAnalysis,
      campaignPerformance,
      adSpend: adSpendData,
      totalAdSpend,
      roas,
      funnel: funnelData,
      dropoffs,
      search: { topSearches, zeroResultSearches, totalSearches, avgResults: Math.round(avgResults) },
      device: { deviceBreakdown, browserBreakdown, osBreakdown },
      geo: { geoDistribution, cityDistribution },
    })
  } catch (err: any) {
    console.error("Dashboard API error:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
