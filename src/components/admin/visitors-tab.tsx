"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { VisitorLog } from "@/lib/types"
import { Users, Globe, Eye, TrendingUp, MapPin, Clock, ChevronLeft, ChevronRight, Calendar, Monitor, Smartphone, Search, MousePointer, ArrowRight, X, ExternalLink } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, LineChart, Line, Legend
} from "recharts"

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#ec4899", "#84cc16", "#6366f1", "#14b8a6", "#f43f5e", "#a855f7", "#0ea5e9", "#eab308"]

const EVENT_COLORS: Record<string, string> = {
  pageview: "bg-blue-100 text-blue-700", click: "bg-green-100 text-green-700",
  add_to_cart: "bg-amber-100 text-amber-700", checkout: "bg-purple-100 text-purple-700",
  order: "bg-emerald-100 text-emerald-700", search: "bg-gray-100 text-gray-700", other: "bg-pink-100 text-pink-700"
}

const EVENT_ICONS: Record<string, any> = {
  pageview: Eye,
  click: MousePointer,
  add_to_cart: TrendingUp,
  checkout: ExternalLink,
  order: TrendingUp,
  search: Search,
}

interface SessionDetail {
  sessionId: string
  ip: string
  country: string
  city: string
  region: string
  browser: string
  os: string
  device: string
  userAgent: string
  referrer: string
  sourceCategory: string
  firstSeen: string
  lastSeen: string
  totalEvents: number
  events: { id: number; path: string; eventType: string; eventLabel: string; referrer: string; createdAt: string }[]
}

interface VisitorStats {
  totalVisitors: number; pageViews: number; todayVisitors: number
  recentVisitors: VisitorLog[]; topPages: { path: string; count: number }[]
  events: { type: string; count: number }[]
  geoDistribution: { name: string; value: number }[]
  hourlyDistribution: { hour: string; visits: number }[]
  dailyTrend: { date: string; visits: number }[]
  pagination: { page: number; pageSize: number; totalPages: number; total: number }
  dateRange: { dateFrom: string; dateTo: string }
}

interface SessionGroup {
  sessionId: string
  ip: string
  country: string
  city: string
  events: VisitorLog[]
  firstSeen: string
  lastSeen: string
  eventCount: number
}

function getDefaultDateRange() {
  const to = new Date()
  const from = new Date()
  from.setDate(from.getDate() - 30)
  return {
    from: from.toISOString().slice(0, 10),
    to: to.toISOString().slice(0, 10),
  }
}

export default function VisitorsTab() {
  const [data, setData] = useState<VisitorStats | null>(null)
  const [subtab, setSubtab] = useState("map")
  const [dateFrom, setDateFrom] = useState(getDefaultDateRange().from)
  const [dateTo, setDateTo] = useState(getDefaultDateRange().to)
  const [page, setPage] = useState(1)
  const [viewMode, setViewMode] = useState<"flat" | "sessions">("sessions")
  const [sessionDetail, setSessionDetail] = useState<SessionDetail | null>(null)
  const [sessionLoading, setSessionLoading] = useState(false)

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ dateFrom, dateTo, page: String(page), pageSize: "50" })
    const res = await fetch(`/api/analytics/visitors?${params}`)
    if (res.ok) setData(await res.json())
  }, [dateFrom, dateTo, page])

  useEffect(() => { fetchData() }, [fetchData])
  useEffect(() => { setPage(1) }, [dateFrom, dateTo])

  const openSession = async (sessionId: string) => {
    setSessionLoading(true)
    try {
      const res = await fetch(`/api/analytics/session?sessionId=${sessionId}`)
      if (res.ok) setSessionDetail(await res.json())
    } catch { /* ignore */ }
    setSessionLoading(false)
  }

  // Group recent visitors by session_id
  const sessionGroups: SessionGroup[] = (() => {
    const map = new Map<string, SessionGroup>()
    for (const v of data?.recentVisitors || []) {
      const sid = v.session_id || v.ip || `anon-${v.id}`
      if (!map.has(sid)) {
        map.set(sid, {
          sessionId: sid,
          ip: v.ip,
          country: v.country,
          city: v.city,
          events: [],
          firstSeen: v.created_at,
          lastSeen: v.created_at,
          eventCount: 0,
        })
      }
      const g = map.get(sid)!
      g.events.push(v)
      g.eventCount++
      if (v.created_at < g.firstSeen) g.firstSeen = v.created_at
      if (v.created_at > g.lastSeen) g.lastSeen = v.created_at
    }
    return Array.from(map.values()).sort((a, b) => b.lastSeen.localeCompare(a.lastSeen))
  })()

  if (!data) return <div className="py-10 text-center text-gray-400">Loading visitor analytics...</div>
  const { pagination } = data

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-4">
        <Calendar className="h-4 w-4 text-gray-400" />
        <label className="text-sm text-gray-500">From</label>
        <input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
        <label className="text-sm text-gray-500">To</label>
        <input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="border rounded-lg px-3 py-1.5 text-sm" />
        <span className="text-xs text-gray-400 ml-auto">{pagination.total.toLocaleString()} records</span>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Page Views", value: data.pageViews, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Today's Visitors", value: data.todayVisitors, icon: Users, color: "text-green-600", bg: "bg-green-100" },
          { label: "Total Events", value: data.totalVisitors, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Unique Pages", value: data.topPages.length, icon: Globe, color: "text-amber-600", bg: "bg-amber-100" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`h-10 w-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                <s.icon className={`h-5 w-5 ${s.color}`} />
              </div>
            </div>
            <p className="text-2xl font-bold">{s.value.toLocaleString()}</p>
          </CardContent></Card>
        ))}
      </div>

      {/* Charts tabs */}
      <Tabs value={subtab} onValueChange={setSubtab}>
        <TabsList>
          <TabsTrigger value="map"><MapPin className="h-4 w-4 mr-1" /> Geo</TabsTrigger>
          <TabsTrigger value="hourly"><Clock className="h-4 w-4 mr-1" /> Hourly</TabsTrigger>
          <TabsTrigger value="trend"><TrendingUp className="h-4 w-4 mr-1" /> Daily</TabsTrigger>
        </TabsList>
        <TabsContent value="map">
          <Card><CardContent className="p-6">
            <h3 className="font-semibold mb-4">Visitor Locations</h3>
            {data.geoDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart><Pie data={data.geoDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name} (${value})`}>
                  {data.geoDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                </Pie><Tooltip /><Legend /></PieChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No geo data yet</p>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="hourly">
          <Card><CardContent className="p-6">
            <h3 className="font-semibold mb-4">Hourly Distribution</h3>
            {data.hourlyDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.hourlyDistribution}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="hour" /><YAxis /><Tooltip /><Bar dataKey="visits" fill="#f59e0b" radius={[4, 4, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No hourly data yet</p>}
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="trend">
          <Card><CardContent className="p-6">
            <h3 className="font-semibold mb-4">Daily Trend</h3>
            {data.dailyTrend.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={data.dailyTrend}><CartesianGrid strokeDasharray="3 3" /><XAxis dataKey="date" tick={{ fontSize: 12 }} /><YAxis /><Tooltip /><Line type="monotone" dataKey="visits" stroke="#f59e0b" strokeWidth={2} dot={false} /></LineChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No daily data yet</p>}
          </CardContent></Card>
        </TabsContent>
      </Tabs>

      {/* Top Pages + Events */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Top Pages</h3>
          <div className="space-y-2">
            {data.topPages.map((p, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <span className="truncate max-w-[300px] text-gray-700">{p.path}</span>
                <Badge variant="secondary">{p.count}</Badge>
              </div>
            ))}
            {data.topPages.length === 0 && <p className="text-gray-400">No data yet</p>}
          </div>
        </CardContent></Card>
        <Card><CardContent className="p-6">
          <h3 className="font-semibold mb-4">Event Types</h3>
          <div className="space-y-2">
            {data.events.map((e, i) => (
              <div key={i} className="flex justify-between items-center text-sm">
                <Badge className={EVENT_COLORS[e.type] || "bg-gray-100 text-gray-700"}>{e.type}</Badge>
                <span className="font-medium">{e.count}</span>
              </div>
            ))}
            {data.events.length === 0 && <p className="text-gray-400">No data yet</p>}
          </div>
        </CardContent></Card>
      </div>

      {/* Visitors Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold">Visitors</h3>
              <div className="flex bg-gray-100 rounded-lg p-0.5">
                <button onClick={() => setViewMode("sessions")} className={`px-3 py-1 text-xs rounded-md transition ${viewMode === "sessions" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                  Sessions
                </button>
                <button onClick={() => setViewMode("flat")} className={`px-3 py-1 text-xs rounded-md transition ${viewMode === "flat" ? "bg-white shadow text-gray-900" : "text-gray-500"}`}>
                  List
                </button>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-gray-500 px-2">Page {pagination.page} / {pagination.totalPages || 1}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="overflow-x-auto">
            {viewMode === "flat" ? (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-2 font-medium">IP</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-left p-2 font-medium">Page</th>
                    <th className="text-left p-2 font-medium">Event</th>
                    <th className="text-right p-2 font-medium">Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {data.recentVisitors.map((v, i) => (
                    <tr key={i} className="hover:bg-gray-50 group cursor-pointer" onClick={() => openSession(v.session_id)}>
                      <td className="p-2 font-mono text-xs text-blue-600 group-hover:underline">{v.ip}</td>
                      <td className="p-2 text-xs">{[v.city, v.country].filter(Boolean).join(", ") || "\u2014"}</td>
                      <td className="p-2 text-xs truncate max-w-[200px]">{v.path}</td>
                      <td className="p-2"><Badge className={EVENT_COLORS[v.event_type] || ""}>{v.event_type}</Badge></td>
                      <td className="p-2 text-right text-xs text-gray-400">{new Date(v.created_at).toLocaleString()}</td>
                    </tr>
                  ))}
                  {data.recentVisitors.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No visitors yet</td></tr>}
                </tbody>
              </table>
            ) : (
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-2 font-medium">IP</th>
                    <th className="text-left p-2 font-medium">Location</th>
                    <th className="text-left p-2 font-medium">Events</th>
                    <th className="text-left p-2 font-medium">Click Trail</th>
                    <th className="text-right p-2 font-medium">Last Seen</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {sessionGroups.map((g, i) => (
                    <tr key={i} className="hover:bg-gray-50 group cursor-pointer" onClick={() => openSession(g.sessionId)}>
                      <td className="p-2 font-mono text-xs text-blue-600 group-hover:underline">{g.ip}</td>
                      <td className="p-2 text-xs">{[g.city, g.country].filter(Boolean).join(", ") || "\u2014"}</td>
                      <td className="p-2">
                        <div className="flex flex-wrap gap-0.5">
                          {[...new Set(g.events.map(e => e.event_type))].map(et => (
                            <Badge key={et} className={`text-[10px] px-1.5 py-0 ${EVENT_COLORS[et] || ""}`}>{et}</Badge>
                          ))}
                          <span className="text-[10px] text-gray-400 ml-1">({g.eventCount})</span>
                        </div>
                      </td>
                      <td className="p-2">
                        <div className="flex items-center gap-1 flex-wrap">
                          {g.events.slice(0, 5).map((e, j) => (
                            <span key={j} className="text-[10px] text-gray-500 truncate max-w-[100px]" title={e.path}>
                              {e.path === "/" ? "Home" : e.path.replace(/^\//, "").split("/")[0] || "/"}
                            </span>
                          )).reduce((acc: React.ReactNode[], el, j) => {
                            if (j > 0) acc.push(<ArrowRight key={`arr-${j}`} className="h-2 w-2 text-gray-300 flex-shrink-0" />)
                            acc.push(el)
                            return acc
                          }, [] as React.ReactNode[])}
                          {g.events.length > 5 && <span className="text-[10px] text-gray-400">+{g.events.length - 5}</span>}
                        </div>
                      </td>
                      <td className="p-2 text-right text-xs text-gray-400">{new Date(g.lastSeen).toLocaleString()}</td>
                    </tr>
                  ))}
                  {sessionGroups.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No sessions yet</td></tr>}
                </tbody>
              </table>
            )}
          </div>

          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-gray-500 px-3">{pagination.page} / {pagination.totalPages}</span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Session Detail Dialog */}
      <Dialog open={!!sessionDetail} onOpenChange={(open) => { if (!open) setSessionDetail(null) }}>
        <DialogContent className="max-w-3xl max-h-[85vh] overflow-y-auto">
          {sessionLoading ? (
            <div className="py-10 text-center text-gray-400">Loading session details...</div>
          ) : sessionDetail ? (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-lg">
                  <Users className="h-5 w-5 text-amber-600" />
                  Session Detail
                </DialogTitle>
              </DialogHeader>

              {/* Session Info Cards */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-2">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">IP Address</div>
                  <div className="text-sm font-mono font-medium mt-0.5">{sessionDetail.ip}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Location</div>
                  <div className="text-sm font-medium mt-0.5">{[sessionDetail.city, sessionDetail.region, sessionDetail.country].filter(Boolean).join(", ") || "\u2014"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Device</div>
                  <div className="flex items-center gap-1 mt-0.5">
                    {sessionDetail.device === "Mobile" ? <Smartphone className="h-3 w-3" /> : <Monitor className="h-3 w-3" />}
                    <span className="text-sm font-medium">{sessionDetail.device} · {sessionDetail.browser}</span>
                  </div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Duration</div>
                  <div className="text-sm font-medium mt-0.5">
                    {(() => {
                      const diff = new Date(sessionDetail.lastSeen).getTime() - new Date(sessionDetail.firstSeen).getTime()
                      const mins = Math.floor(diff / 60000)
                      const secs = Math.floor((diff % 60000) / 1000)
                      return mins > 0 ? `${mins}m ${secs}s` : `${secs}s`
                    })()}
                    {" · "}{sessionDetail.totalEvents} events
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">OS</div>
                  <div className="text-sm font-medium mt-0.5">{sessionDetail.os}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Source</div>
                  <div className="text-sm font-medium mt-0.5">{sessionDetail.sourceCategory || "direct"}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">First Seen</div>
                  <div className="text-xs font-medium mt-0.5">{new Date(sessionDetail.firstSeen).toLocaleString()}</div>
                </div>
                <div className="bg-gray-50 rounded-lg p-3">
                  <div className="text-[10px] text-gray-400 uppercase tracking-wide">Last Seen</div>
                  <div className="text-xs font-medium mt-0.5">{new Date(sessionDetail.lastSeen).toLocaleString()}</div>
                </div>
              </div>

              {sessionDetail.referrer && (
                <div className="bg-blue-50 rounded-lg p-3 text-sm">
                  <span className="text-blue-500 font-medium">Referrer: </span>
                  <span className="text-blue-700 truncate">{sessionDetail.referrer}</span>
                </div>
              )}

              {/* Click Trail / Event Timeline */}
              <div>
                <h4 className="font-semibold text-sm mb-3 flex items-center gap-2">
                  <MousePointer className="h-4 w-4 text-gray-400" />
                  Click Trail ({sessionDetail.events.length} events)
                </h4>
                <div className="relative pl-6 border-l-2 border-gray-200 space-y-0">
                  {sessionDetail.events.map((event, idx) => {
                    const IconComponent = EVENT_ICONS[event.eventType] || Eye
                    return (
                      <div key={event.id} className="relative pb-4 last:pb-0">
                        <div className="absolute -left-[29px] top-1 w-4 h-4 rounded-full bg-white border-2 border-gray-300 flex items-center justify-center">
                          <div className={`w-2 h-2 rounded-full ${
                            event.eventType === "pageview" ? "bg-blue-400" :
                            event.eventType === "click" ? "bg-green-400" :
                            event.eventType === "add_to_cart" ? "bg-amber-400" :
                            event.eventType === "order" ? "bg-emerald-400" :
                            event.eventType === "search" ? "bg-gray-400" :
                            event.eventType === "checkout" ? "bg-purple-400" : "bg-pink-400"
                          }`} />
                        </div>
                        <div className="flex items-start gap-2">
                          <IconComponent className="h-3.5 w-3.5 text-gray-400 mt-0.5 flex-shrink-0" />
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 flex-wrap">
                              <Badge className={`text-[10px] px-1.5 py-0 ${EVENT_COLORS[event.eventType] || ""}`}>{event.eventType}</Badge>
                              {event.eventLabel && <span className="text-xs text-gray-500">{event.eventLabel}</span>}
                            </div>
                            <div className="text-xs text-gray-700 mt-0.5 truncate">{event.path}</div>
                            <div className="text-[10px] text-gray-400 mt-0.5">{new Date(event.createdAt).toLocaleTimeString()}</div>
                          </div>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  )
}
