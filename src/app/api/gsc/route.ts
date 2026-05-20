import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

// POST: Ingest GSC search data (from external script or manual upload)
// Body format: { rows: [{ query, clicks, impressions, ctr, position, date?, country?, device? }] }
export async function POST(request: NextRequest) {
  try {
    const { rows } = await request.json()
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      return NextResponse.json({ error: "Missing rows array" }, { status: 400 })
    }

    const supabase = createAdminClient()
    
    // Upsert: delete existing data for same date range, then insert
    const dates = [...new Set(rows.map((r: any) => r.date || new Date().toISOString().split("T")[0]))]
    if (dates.length > 0) {
      await supabase.from("gsc_data").delete().in("date", dates)
    }

    const { error } = await supabase.from("gsc_data").insert(
      rows.map((r: any) => ({
        query: r.query,
        clicks: r.clicks || 0,
        impressions: r.impressions || 0,
        ctr: r.ctr || 0,
        position: r.position || 0,
        date: r.date || new Date().toISOString().split("T")[0],
        country: r.country || "GHA",
        device: r.device || "ALL",
      }))
    )

    if (error) throw error
    return NextResponse.json({ success: true, count: rows.length })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}

// GET: Retrieve GSC summary data for dashboard
export async function GET(request: NextRequest) {
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)
    const days = parseInt(searchParams.get("days") || "30")
    const dateFrom = new Date()
    dateFrom.setDate(dateFrom.getDate() - days)
    const dateStr = dateFrom.toISOString().split("T")[0]

    const { data, error } = await supabase
      .from("gsc_data")
      .select("*")
      .gte("date", dateStr)
      .order("clicks", { ascending: false })

    if (error) throw error

    // Aggregate to summary
    const totalClicks = (data || []).reduce((s, r) => s + (r.clicks || 0), 0)
    const totalImpressions = (data || []).reduce((s, r) => s + (r.impressions || 0), 0)
    const avgCtr = totalImpressions > 0 ? ((totalClicks / totalImpressions) * 100).toFixed(1) : "0"
    const avgPosition = (data || []).length > 0
      ? ((data || []).reduce((s, r) => s + (r.position || 0), 0) / data.length).toFixed(1)
      : "0"

    // Top queries by clicks
    // Aggregate same queries across dates
    const queryMap: Record<string, { clicks: number; impressions: number; position: number; count: number }> = {}
    for (const r of data || []) {
      if (!queryMap[r.query]) queryMap[r.query] = { clicks: 0, impressions: 0, position: 0, count: 0 }
      queryMap[r.query].clicks += r.clicks || 0
      queryMap[r.query].impressions += r.impressions || 0
      queryMap[r.query].position += r.position || 0
      queryMap[r.query].count++
    }
    const topQueries = Object.entries(queryMap)
      .map(([query, stats]) => ({
        query,
        clicks: stats.clicks,
        impressions: stats.impressions,
        ctr: stats.impressions > 0 ? ((stats.clicks / stats.impressions) * 100).toFixed(1) : "0",
        position: (stats.position / stats.count).toFixed(1),
      }))
      .sort((a, b) => b.clicks - a.clicks)
      .slice(0, 50)

    // Daily trend
    const dailyMap: Record<string, { clicks: number; impressions: number }> = {}
    for (const r of data || []) {
      if (!dailyMap[r.date]) dailyMap[r.date] = { clicks: 0, impressions: 0 }
      dailyMap[r.date].clicks += r.clicks || 0
      dailyMap[r.date].impressions += r.impressions || 0
    }
    const dailyTrend = Object.entries(dailyMap)
      .map(([date, stats]) => ({ date, ...stats }))
      .sort((a, b) => a.date.localeCompare(b.date))

    return NextResponse.json({
      summary: { totalClicks, totalImpressions, avgCtr, avgPosition },
      topQueries,
      dailyTrend,
    })
  } catch (e: any) {
    return NextResponse.json({ error: e.message }, { status: 500 })
  }
}
