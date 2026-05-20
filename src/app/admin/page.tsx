
"use client"

import { formatPrice } from "@/lib/utils";
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import { Package, ShoppingBag, DollarSign, AlertCircle, TrendingUp, Clock } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import FunnelTab from '@/components/admin/funnel-tab'
import VisitorsTab from "@/components/admin/visitors-tab"
import CampaignTab from '@/components/admin/campaign-tab'
import GscTab from "@/components/admin/gsc-tab"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend
} from "recharts"

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#ec4899"]

interface Analytics {
  summary: { totalRevenue: number; totalOrders: number; deliveredRevenue: number; avgOrderValue: number; pendingCount: number }
  salesTrend: { date: string; revenue: number; orders: number }[]
  byCategory: { name: string; value: number }[]
  byStatus: { name: string; value: number }[]
  topProducts: { name: string; quantity: number; revenue: number }[]
  alerts: { lowStock: any[]; outOfStock: any[] }
}

export default function AdminDashboard() {
  const [data, setData] = useState<Analytics | null>(null)
  const [loading, setLoading] = useState(true)
  const [tab, setTab] = useState("overview")

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics")
      setData(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <div className="py-20 text-center text-gray-400">Loading analytics...</div>
  if (!data) return <div className="py-20 text-center text-gray-400">No data yet</div>

  const { summary, salesTrend, byCategory, byStatus, topProducts, alerts } = data

  const statCards = [
    { label: "Total Revenue", value: formatPrice(summary.totalRevenue), icon: DollarSign, color: "text-green-600", bg: "bg-green-100" },
    { label: "Total Orders", value: summary.totalOrders, icon: ShoppingBag, color: "text-blue-600", bg: "bg-blue-100" },
    { label: "Avg Order Value", value: formatPrice(summary.avgOrderValue), icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-100" },
    { label: "Pending", value: summary.pendingCount, icon: Clock, color: summary.pendingCount > 0 ? "text-red-600" : "text-gray-400", bg: summary.pendingCount > 0 ? "bg-red-100" : "bg-gray-100" },
  ]

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
        <button onClick={fetchData} className="text-sm text-amber-600 hover:underline">Refresh</button>
      </div>

      {/* Alerts */}
      {(alerts.outOfStock.length > 0 || alerts.lowStock.length > 0) && (
        <div className="mb-6 space-y-2">
          {alerts.outOfStock.map((p: any) => (
            <div key={p.id} className="bg-red-50 border border-red-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-red-500" />
              <span className="font-medium text-red-700">{p.name}</span> is out of stock!
              <Link href="/admin/products" className="text-red-600 underline ml-auto">Manage</Link>
            </div>
          ))}
          {alerts.lowStock.map((p: any) => (
            <div key={p.id} className="bg-orange-50 border border-orange-200 rounded-lg px-4 py-2 flex items-center gap-2 text-sm">
              <AlertCircle className="h-4 w-4 text-orange-500" />
              <span className="font-medium text-orange-700">{p.name}</span> only {p.stock} left!
              <Link href="/admin/products" className="text-orange-600 underline ml-auto">Manage</Link>
            </div>
          ))}
        </div>
      )}

      {/* Stat cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        {statCards.map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}><stat.icon className={`h-5 w-5 ${stat.color}`} /></div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={tab} onValueChange={setTab}>
                <TabsList className="mb-6">
          <TabsTrigger value="overview">Revenue Trend</TabsTrigger>
          <TabsTrigger value="categories">By Category</TabsTrigger>
          <TabsTrigger value="status">Order Status</TabsTrigger>
          <TabsTrigger value="top">Top Products</TabsTrigger>
          <TabsTrigger value="visitors">Visitors</TabsTrigger>
          <TabsTrigger value="gsc">GSC</TabsTrigger>
          <TabsTrigger value="funnel">Funnel</TabsTrigger>
          <TabsTrigger value="campaigns">?? Campaigns</TabsTrigger>
        </TabsList>

        <TabsContent value="overview">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Revenue Trend (Last 30 Days)</h3>
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={salesTrend}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="date" tick={{ fontSize: 11 }} tickFormatter={v => v.slice(5)} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(v: any) => formatPrice(Number(v))} />
                  <Legend />
                  <Line type="monotone" dataKey="revenue" stroke="#f59e0b" strokeWidth={2} name="Revenue" dot={false} />
                  <Line type="monotone" dataKey="orders" stroke="#3b82f6" strokeWidth={2} name="Orders" dot={false} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <div className="grid lg:grid-cols-2 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Revenue by Category</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={byCategory}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis dataKey="name" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(v: any) => formatPrice(Number(v))} />
                    <Bar dataKey="value" name="Revenue" radius={[4, 4, 0, 0]}>
                      {byCategory.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-4">Order Status</h3>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={byStatus} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {byStatus.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="status">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Order Status Distribution</h3>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {byStatus.map(s => (
                  <div key={s.name} className="text-center p-4 bg-gray-50 rounded-lg">
                    <p className="text-3xl font-bold" style={{ color: COLORS[byStatus.indexOf(s) % COLORS.length] }}>{s.value}</p>
                    <p className="text-sm text-gray-500 mt-1">{s.name}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="top">
          <Card>
            <CardContent className="p-6">
              <h3 className="font-semibold mb-4">Top Selling Products</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 border-b">
                    <tr>
                      <th className="text-left p-3 font-medium w-10">#</th>
                      <th className="text-left p-3 font-medium">Product</th>
                      <th className="text-right p-3 font-medium">Sold</th>
                      <th className="text-right p-3 font-medium">Revenue</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {topProducts.map((p, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="p-3 text-gray-400">{i + 1}</td>
                        <td className="p-3 font-medium truncate max-w-[300px]">{p.name}</td>
                        <td className="p-3 text-right">{p.quantity}</td>
                        <td className="p-3 text-right font-bold">{formatPrice(p.revenue)}</td>
                      </tr>
                    ))}
                    {topProducts.length === 0 && <tr><td colSpan={4} className="p-8 text-center text-gray-400">No sales data yet</td></tr>}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value='visitors'><VisitorsTab /></TabsContent>
        <TabsContent value='funnel'><FunnelTab /></TabsContent>
        <TabsContent value='campaigns'><CampaignTab /></TabsContent>
      </Tabs>
    </div>
  )
}

