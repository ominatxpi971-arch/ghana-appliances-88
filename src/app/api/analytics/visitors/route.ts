import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAdminRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    const { searchParams } = new URL(request.url)

    // Date range filter (default: last 30 days)
    const dateFrom = searchParams.get("dateFrom") || new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10)
    const dateTo = searchParams.get("dateTo") || new Date().toISOString().slice(0, 10)
    const dateToEnd = dateTo + "T23:59:59.999Z"

    // Pagination
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
    const pageSize = Math.min(100, Math.max(10, parseInt(searchParams.get("pageSize") || "50")))

    // Base filter for all date-filtered queries
    const baseFilter = (query: any) => query.gte("created_at", dateFrom).lte("created_at", dateToEnd)

    // Totals
    const { count: totalVisitors } = await baseFilter(supabase.from("visitor_logs").select("*", { count: "exact", head: true }))
    const today = new Date().toISOString().slice(0, 10)
    const { count: todayVisitors } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).gte("created_at", today)

    // Recent visitors (paginated)
    const offset = (page - 1) * pageSize
    const { data: recentVisitors, count: totalRecent } = await baseFilter(
      supabase.from("visitor_logs").select("ip,path,city,country,event_type,created_at", { count: "exact" })
    ).order("created_at", { ascending: false }).range(offset, offset + pageSize - 1)

    const totalPages = Math.ceil((totalRecent || 0) / pageSize)

    // Top pages (filtered by date range)
    const { data: allLogs } = await baseFilter(supabase.from("visitor_logs").select("path"))
    const pageCounts: Record<string, number> = {}
    for (const log of allLogs || []) { pageCounts[log.path] = (pageCounts[log.path] || 0) + 1 }
    const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }))

    // Event types (filtered by date range)
    const { data: events } = await baseFilter(supabase.from("visitor_logs").select("event_type"))
    const eventCounts: Record<string, number> = {}
    for (const e of events || []) { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1 }
    const eventsBreakdown = Object.entries(eventCounts).map(([type, count]) => ({ type, count }))

    // Geo distribution by city (filtered by date range)
    const { data: geoData } = await baseFilter(supabase.from("visitor_logs").select("city,country"))
    const cityCounts: Record<string, number> = {}
    for (const g of geoData || []) {
      const loc = [g.city, g.country].filter(Boolean).join(", ") || "Unknown"
      cityCounts[loc] = (cityCounts[loc] || 0) + 1
    }
    const geoDistribution = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value]) => ({ name, value }))

    // Hourly distribution (date range)
    const { data: recentLogs } = await baseFilter(supabase.from("visitor_logs").select("created_at"))
    const hourlyData: Record<string, number> = {}
    for (const log of recentLogs || []) {
      const hour = new Date(log.created_at).getHours()
      const key = `${hour}:00`
      hourlyData[key] = (hourlyData[key] || 0) + 1
    }
    const hourlyDistribution = Object.entries(hourlyData)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([hour, visits]) => ({ hour, visits }))

    // Daily trend (date range)
    const { data: monthLogs } = await baseFilter(supabase.from("visitor_logs").select("created_at"))
    const dailyCounts: Record<string, number> = {}
    for (const log of monthLogs || []) {
      const day = log.created_at.slice(0, 10)
      dailyCounts[day] = (dailyCounts[day] || 0) + 1
    }
    const dailyTrend = Object.entries(dailyCounts)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .map(([date, visits]) => ({ date, visits }))

    return NextResponse.json({
      totalVisitors: totalVisitors || 0,
      pageViews: totalVisitors || 0,
      todayVisitors: todayVisitors || 0,
      recentVisitors: recentVisitors || [],
      topPages,
      events: eventsBreakdown,
      geoDistribution,
      hourlyDistribution,
      dailyTrend,
      pagination: { page, pageSize, totalPages, total: totalRecent || 0 },
      dateRange: { dateFrom, dateTo },
    })
  } catch (err: any) {
    return NextResponse.json({
      totalVisitors: 0, pageViews: 0, todayVisitors: 0,
      recentVisitors: [], topPages: [], events: [],
      geoDistribution: [], hourlyDistribution: [], dailyTrend: [],
      pagination: { page: 1, pageSize: 50, totalPages: 0, total: 0 },
      dateRange: { dateFrom: "", dateTo: "" },
    })
  }
}