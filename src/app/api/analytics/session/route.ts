import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAdminRequest } from "@/lib/auth"

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

function classifyDevice(userAgent: string): string {
  const ua = (userAgent || "").toLowerCase()
  if (ua.includes("tablet") || ua.includes("ipad")) return "Tablet"
  if (ua.includes("mobile") || ua.includes("android") || ua.includes("iphone")) return "Mobile"
  return "Desktop"
}

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const sessionId = searchParams.get("sessionId")
    const ip = searchParams.get("ip")

    if (!sessionId && !ip) {
      return NextResponse.json({ error: "sessionId or ip parameter required" }, { status: 400 })
    }

    let query = supabase.from("visitor_logs").select("*").order("created_at", { ascending: true })

    if (sessionId) {
      query = query.eq("session_id", sessionId)
    } else if (ip) {
      query = query.eq("ip", ip).order("created_at", { ascending: false }).limit(200)
    }

    const { data: events, error } = await query

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Enrich with browser/OS/device info
    const userAgent = events?.[0]?.user_agent || ""
    const enriched = {
      sessionId: sessionId || events?.[0]?.session_id || "",
      ip: ip || events?.[0]?.ip || "unknown",
      country: events?.[0]?.country || "",
      city: events?.[0]?.city || "",
      region: events?.[0]?.region || "",
      browser: extractBrowser(userAgent),
      os: extractOS(userAgent),
      device: classifyDevice(userAgent),
      userAgent,
      referrer: events?.[0]?.referrer || "",
      sourceCategory: events?.[0]?.source_category || "",
      firstSeen: events?.[0]?.created_at || "",
      lastSeen: events?.[events.length - 1]?.created_at || "",
      totalEvents: events?.length || 0,
      events: (events || []).map(e => ({
        id: e.id,
        path: e.path,
        eventType: e.event_type,
        eventLabel: e.event_label,
        referrer: e.referrer,
        createdAt: e.created_at,
      })),
    }

    return NextResponse.json(enriched)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}
