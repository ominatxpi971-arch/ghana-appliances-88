import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAdminRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    
    // Conversion funnel: pageview → add_to_cart → checkout → order
    const { count: pageviews } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).eq("event_type", "pageview")
    const { count: addToCarts } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).eq("event_type", "add_to_cart")
    const { count: checkouts } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).eq("event_type", "checkout")
    const { count: orders } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).eq("event_type", "order")
    
    const funnel = [
      { stage: "Page Views", value: pageviews || 0, pct: 100 },
      { stage: "Add to Cart", value: addToCarts || 0, pct: pageviews ? Math.round((addToCarts || 0) / (pageviews || 1) * 100) : 0 },
      { stage: "Checkout", value: checkouts || 0, pct: addToCarts ? Math.round((checkouts || 0) / (addToCarts || 1) * 100) : 0 },
      { stage: "Orders", value: orders || 0, pct: checkouts ? Math.round((orders || 0) / (checkouts || 1) * 100) : 0 },
    ]
    
    // Top referrers
    const { data: referrers } = await supabase.from("visitor_logs").select("referrer").not("referrer", "eq", "").order("created_at", { ascending: false }).limit(500)
    const refCounts: Record<string, number> = {}
    for (const r of referrers || []) {
      try {
        const host = new URL(r.referrer).hostname.replace("www.", "")
        refCounts[host] = (refCounts[host] || 0) + 1
      } catch {}
    }
    const topReferrers = Object.entries(refCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([source, count]) => ({ source, count }))
    
    // Device breakdown (from user agent)
    const { data: agents } = await supabase.from("visitor_logs").select("user_agent").not("user_agent", "eq", "").limit(500)
    const devices = { Mobile: 0, Desktop: 0, Tablet: 0, Other: 0 }
    for (const a of agents || []) {
      const ua = (a.user_agent || "").toLowerCase()
      if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) devices.Mobile++
      else if (ua.includes("tablet") || ua.includes("ipad")) devices.Tablet++
      else if (ua.includes("windows") || ua.includes("mac") || ua.includes("linux")) devices.Desktop++
      else devices.Other++
    }
    const deviceBreakdown = Object.entries(devices).map(([name, value]) => ({ name, value }))
    
    return NextResponse.json({ funnel, topReferrers, deviceBreakdown })
  } catch (err: any) {
    return NextResponse.json({ funnel: [], topReferrers: [], deviceBreakdown: [] })
  }
}
