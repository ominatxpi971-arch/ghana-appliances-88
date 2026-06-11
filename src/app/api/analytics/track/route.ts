import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

interface UtmParams {
  source?: string
  medium?: string
  campaign?: string
  content?: string
  term?: string
  fbclid?: string
  gclid?: string
}

function classifySource(referrer: string, utm?: UtmParams): string {
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

function getClientIP(request: NextRequest): string {
  // Vercel passes real client IP via x-forwarded-for (comma-separated, first is client)
  // Also check x-vercel-forwarded-for and x-real-ip for robustness
  return request.headers.get("x-vercel-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
}

function getGeo(request: NextRequest): { country: string; region: string; city: string } {
  return {
    country: request.headers.get("x-vercel-ip-country") || "",
    region: request.headers.get("x-vercel-ip-country-region") || "",
    city: request.headers.get("x-vercel-ip-city") || "",
  }
}


async function insertLogSafe(supabase: ReturnType<typeof createAdminClient>, row: Record<string, unknown>) {
  const { error } = await supabase.from("visitor_logs").insert(row)
  if (!error) return { ok: true }

  // If column doesn't exist, fall back to utm_params JSON column
  const msg = error.message.toLowerCase()
  const utmFields = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]
  const missingUtmColumn = utmFields.some(f => msg.includes(f.toLowerCase()))

  if (missingUtmColumn) {
    const utmJson = {
      source: row.utm_source as string | undefined,
      medium: row.utm_medium as string | undefined,
      campaign: row.utm_campaign as string | undefined,
      content: row.utm_content as string | undefined,
      term: row.utm_term as string | undefined,
      fbclid: row.fbclid as string | undefined,
      gclid: row.gclid as string | undefined,
    }
    const safe = { ...row }
    for (const f of utmFields) delete (safe as any)[f]
    ;(safe as any).utm_params = JSON.stringify(utmJson)

    const retry = await supabase.from("visitor_logs").insert(safe)
    if (retry.error) {
      console.error("Analytics track fallback error:", retry.error)
      return { ok: false, error: retry.error.message }
    }
    return { ok: true }
  }

  console.error("Analytics track error:", error)
  return { ok: false, error: error.message }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const ip = body.ip || getClientIP(request)
    const geo = getGeo(request)
    const {
      path, referrer, userAgent, eventType, eventLabel, sessionId,
      country, region, city, searchQuery,
      utm_source, utm_medium, utm_campaign, utm_content, utm_term,
      fbclid, gclid,
    } = body

    const utm: UtmParams = { source: utm_source, medium: utm_medium, campaign: utm_campaign, content: utm_content, term: utm_term, fbclid, gclid }
    const sourceCategory = classifySource(referrer || "", utm)

    const supabase = createAdminClient()
    const result = await insertLogSafe(supabase, {
      ip,
      country: country || geo.country,
      region: region || geo.region,
      city: city || geo.city,
      path: path || "/",
      referrer: referrer || "",
      user_agent: userAgent || request.headers.get("user-agent") || "",
      event_type: eventType || "pageview",
      event_label: eventLabel || "",
      session_id: sessionId || "",
      source_category: sourceCategory,
      utm_source: utm_source || "",
      utm_medium: utm_medium || "",
      utm_campaign: utm_campaign || "",
      utm_content: utm_content || "",
      utm_term: utm_term || "",
      fbclid: fbclid || "",
      gclid: gclid || "",
    })

    if (!result.ok) {
      return NextResponse.json({ error: result.error }, { status: 500 })
    }

    // If this is a search event, also log to search_logs
    if (eventType === "search" && searchQuery) {
      const { error: searchErr } = await supabase.from("search_logs").insert({
          query: searchQuery,
          results_count: body.resultsCount || 0,
          session_id: sessionId || "",
          ip,
        })
        if (searchErr) console.error("Search log error:", searchErr)
    }

    return NextResponse.json({ ok: true, sourceCategory })
  } catch (err: any) {
    console.error("Analytics exception:", err)
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
