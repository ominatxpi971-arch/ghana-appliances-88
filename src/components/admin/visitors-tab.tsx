"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { VisitorLog } from "@/lib/types"
import { Users, Globe, Eye, TrendingUp, MapPin, Clock, ChevronLeft, ChevronRight, Calendar } from "lucide-react"
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

  const fetchData = useCallback(async () => {
    const params = new URLSearchParams({ dateFrom, dateTo, page: String(page), pageSize: "50" })
    const res = await fetch(`/api/analytics/visitors?${params}`)
    if (res.ok) setData(await res.json())
  }, [dateFrom, dateTo, page])

  useEffect(() => { fetchData() }, [fetchData])

  // Reset page when date range changes
  useEffect(() => { setPage(1) }, [dateFrom, dateTo])

  if (!data) return <div className="py-10 text-center text-gray-400">Loading visitor analytics...</div>

  const { pagination } = data

  return (
    <div className="space-y-6">
      {/* Date range picker */}
      <div className="flex flex-wrap items-center gap-3 bg-white rounded-xl border p-4">
        <Calendar className="h-4 w-4 text-gray-400" />
        <label className="text-sm text-gray-500">From</label>
        <input
          type="date"
          value={dateFrom}
          onChange={e => setDateFrom(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <label className="text-sm text-gray-500">To</label>
        <input
          type="date"
          value={dateTo}
          onChange={e => setDateTo(e.target.value)}
          className="border rounded-lg px-3 py-1.5 text-sm"
        />
        <span className="text-xs text-gray-400 ml-auto">
          {pagination.total.toLocaleString()} records
        </span>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Page Views", value: data.pageViews, icon: Eye, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Today''s Visitors", value: data.todayVisitors, icon: Users, color: "text-green-600", bg: "bg-green-100" },
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
          <TabsTrigger value="map"><MapPin className="h-3.5 w-3.5 mr-1" /> Geography</TabsTrigger>
          <TabsTrigger value="trend"><TrendingUp className="h-3.5 w-3.5 mr-1" /> Trend</TabsTrigger>
          <TabsTrigger value="hours"><Clock className="h-3.5 w-3.5 mr-1" /> Peak Hours</TabsTrigger>
        </TabsList>

        <TabsContent value="map">
          <div className="grid lg:grid-cols-2 gap-6 mt-0">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><MapPin className="h-4 w-4 text-amber-500" /> Visitor Locations</h3>
                {data.geoDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie data={data.geoDistribution} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${(name||"").split(",")[0]}: ${value}`}>
                        {data.geoDistribution.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-sm py-8 text-center">No geo data yet</p>}
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4 flex items-center gap-2"><Globe className="h-4 w-4 text-amber-500" /> Cities Breakdown</h3>
                {data.geoDistribution.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={data.geoDistribution.slice(0, 10)} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis type="number" tick={{ fontSize: 11 }} />
                      <YAxis type="category" dataKey="name" tick={{ fontSize: 10 }} width={100} />
                      <Tooltip />
                      <Bar dataKey="value" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                ) : <p className="text-gray-400 text-sm py-8 text-center">No cities data yet</p>}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="trend">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Daily Visitors</h3>
              {data.dailyTrend.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={data.dailyTrend}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="visits" stroke="#f59e0b" strokeWidth={2} name="Visitors" dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-sm py-8 text-center">No trend data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="hours">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Peak Visit Hours</h3>
              {data.hourlyDistribution.length > 0 ? (
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={data.hourlyDistribution}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="hour" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="visits" name="Visits" fill="#3b82f6" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : <p className="text-gray-400 text-sm py-8 text-center">No hourly data yet</p>}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Top Pages + Events */}
      <div className="grid lg:grid-cols-2 gap-6">
        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
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
          </CardContent>
        </Card>
      </div>

      {/* Recent Visitors Table */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold">Recent Visitors</h3>
            {/* Pagination controls */}
            <div className="flex items-center gap-2 text-sm">
              <Button
                variant="outline"
                size="sm"
                disabled={page <= 1}
                onClick={() => setPage(p => p - 1)}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="text-gray-500 px-2">
                Page {pagination.page} / {pagination.totalPages || 1}
              </span>
              <Button
                variant="outline"
                size="sm"
                disabled={page >= pagination.totalPages}
                onClick={() => setPage(p => p + 1)}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="overflow-x-auto">
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
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="p-2 font-mono text-xs">{v.ip}</td>
                    <td className="p-2 text-xs">{[v.city, v.country].filter(Boolean).join(", ") || "\u2014"}</td>
                    <td className="p-2 text-xs truncate max-w-[200px]">{v.path}</td>
                    <td className="p-2"><Badge className={EVENT_COLORS[v.event_type] || ""}>{v.event_type}</Badge></td>
                    <td className="p-2 text-right text-xs text-gray-400">{new Date(v.created_at).toLocaleString()}</td>
                  </tr>
                ))}
                {data.recentVisitors.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-gray-400">No visitors yet</td></tr>}
              </tbody>
            </table>
          </div>
          {/* Bottom pagination */}
          {pagination.totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-4 text-sm">
              <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-4 w-4 mr-1" /> Previous
              </Button>
              <span className="text-gray-500 px-3">
                {pagination.page} / {pagination.totalPages}
              </span>
              <Button variant="outline" size="sm" disabled={page >= pagination.totalPages} onClick={() => setPage(p => p + 1)}>
                Next <ChevronRight className="h-4 w-4 ml-1" />
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}