import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { validateAdminRequest } from "@/lib/auth"

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  try {
    const supabase = createAdminClient()
    
    // Totals
    const { count: totalVisitors } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true })
    const today = new Date().toISOString().slice(0, 10)
    const { count: todayVisitors } = await supabase.from("visitor_logs").select("*", { count: "exact", head: true }).gte("created_at", today)
    
    // Recent visitors
    const { data: recentVisitors } = await supabase.from("visitor_logs").select("ip,path,city,country,event_type,created_at").order("created_at", { ascending: false }).limit(100)
    
    // Top pages
    const { data: allLogs } = await supabase.from("visitor_logs").select("path")
    const pageCounts: Record<string, number> = {}
    for (const log of allLogs || []) { pageCounts[log.path] = (pageCounts[log.path] || 0) + 1 }
    const topPages = Object.entries(pageCounts).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([path, count]) => ({ path, count }))
    
    // Event types
    const { data: events } = await supabase.from("visitor_logs").select("event_type")
    const eventCounts: Record<string, number> = {}
    for (const e of events || []) { eventCounts[e.event_type] = (eventCounts[e.event_type] || 0) + 1 }
    const eventsBreakdown = Object.entries(eventCounts).map(([type, count]) => ({ type, count }))
    
    // Geo distribution by city
    const { data: geoData } = await supabase.from("visitor_logs").select("city,country")
    const cityCounts: Record<string, number> = {}
    for (const g of geoData || []) {
      const loc = [g.city, g.country].filter(Boolean).join(", ") || "Unknown"
      cityCounts[loc] = (cityCounts[loc] || 0) + 1
    }
    const geoDistribution = Object.entries(cityCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 15)
      .map(([name, value]) => ({ name, value }))
    
    // Hourly distribution (last 7 days)
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString()
    const { data: recentLogs } = await supabase.from("visitor_logs").select("created_at").gte("created_at", sevenDaysAgo)
    const hourlyData: Record<string, number> = {}
    for (const log of recentLogs || []) {
      const hour = new Date(log.created_at).getHours()
      const key = `${hour}:00`
      hourlyData[key] = (hourlyData[key] || 0) + 1
    }
    const hourlyDistribution = Object.entries(hourlyData)
      .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
      .map(([hour, visits]) => ({ hour, visits }))
    
    // Daily trend (last 30 days)
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()
    const { data: monthLogs } = await supabase.from("visitor_logs").select("created_at").gte("created_at", thirtyDaysAgo)
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
    })
  } catch (err: any) {
    return NextResponse.json({
      totalVisitors: 0, pageViews: 0, todayVisitors: 0,
      recentVisitors: [], topPages: [], events: [],
      geoDistribution: [], hourlyDistribution: [], dailyTrend: [],
    })
  }
}
