"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Funnel, ExternalLink, Monitor, Smartphone } from "lucide-react"
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell
} from "recharts"

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#8b5cf6", "#ef4444", "#06b6d4"]
const DEVICE_COLORS: Record<string, string> = { Mobile: "#3b82f6", Desktop: "#f59e0b", Tablet: "#10b981", Other: "#8b5cf6" }

interface FunnelData {
  funnel: { stage: string; value: number; pct: number }[]
  topReferrers: { source: string; count: number }[]
  deviceBreakdown: { name: string; value: number }[]
}

const STAGE_COLORS: Record<string, string> = { 
  "Page Views": "#3b82f6", "Add to Cart": "#f59e0b", 
  "Checkout": "#8b5cf6", "Orders": "#10b981" 
}

export default function FunnelTab() {
  const [data, setData] = useState<FunnelData | null>(null)

  useEffect(() => {
    fetch("/api/analytics/funnel").then(r => r.json()).then(setData).catch(() => {})
  }, [])

  if (!data) return <div className="py-10 text-center text-gray-400">Loading funnel data...</div>

  const maxFunnel = Math.max(...data.funnel.map(f => f.value), 1)

  return (
    <div className="space-y-6">
      {/* Conversion Funnel */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-6 flex items-center gap-2">
            <Funnel className="h-5 w-5 text-amber-500" />
            Conversion Funnel
          </h3>
          
          <div className="space-y-4">
            {data.funnel.map((stage, i) => {
              const width = Math.max((stage.value / maxFunnel) * 100, 2)
              return (
                <div key={stage.stage} className="relative">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium text-gray-700">{stage.stage}</span>
                    <span className="text-sm text-gray-500">
                      {stage.value.toLocaleString()}
                      {i > 0 && <span className="text-xs ml-1">({stage.pct}% from previous)</span>}
                    </span>
                  </div>
                  <div className="w-full bg-gray-100 rounded-full h-8 overflow-hidden">
                    <div
                      className="h-full rounded-full flex items-center pl-3 text-xs font-bold text-white transition-all"
                      style={{ 
                        width: `${width}%`,
                        backgroundColor: STAGE_COLORS[stage.stage] || COLORS[i % COLORS.length],
                        marginLeft: i > 0 ? `${((1 - width / 100) * 40)}%` : '0',
                        marginRight: i > 0 ? `${((1 - width / 100) * 40)}%` : '0',
                      }}
                    >
                      {stage.value > 0 && stage.stage}
                    </div>
                  </div>
                  {i < data.funnel.length - 1 && (
                    <div className="flex justify-center my-1">
                      <span className="text-gray-300">↓</span>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
          
          {/* Summary stats */}
          {data.funnel.length >= 4 && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mt-6 pt-4 border-t">
              <div className="text-center">
                <p className="text-2xl font-bold text-blue-600">{data.funnel[0]?.value.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">Total Page Views</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-amber-600">{data.funnel[3]?.value.toLocaleString() || 0}</p>
                <p className="text-xs text-gray-500">Orders Placed</p>
              </div>
              <div className="text-center">
                <p className="text-2xl font-bold text-green-600">
                  {data.funnel[0]?.value > 0 ? ((data.funnel[3]?.value || 0) / data.funnel[0].value * 100).toFixed(1) : 0}%
                </p>
                <p className="text-xs text-gray-500">Overall Conversion Rate</p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Referrers */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <ExternalLink className="h-4 w-4 text-amber-500" />
              Top Referrers
            </h3>
            {data.topReferrers.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.topReferrers} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis type="number" tick={{ fontSize: 11 }} />
                  <YAxis type="category" dataKey="source" tick={{ fontSize: 11 }} width={120} />
                  <Tooltip />
                  <Bar dataKey="count" name="Visits" fill="#f59e0b" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No referral data yet</p>}
          </CardContent>
        </Card>

        {/* Device breakdown */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Monitor className="h-4 w-4 text-amber-500" />
              Device Breakdown
            </h3>
            {data.deviceBreakdown.length > 0 ? (
              <div className="flex items-center justify-center">
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie data={data.deviceBreakdown} cx="50%" cy="50%" outerRadius={100} dataKey="value" nameKey="name" label={({ name, value }) => `${name}: ${value}`}>
                      {data.deviceBreakdown.map((d, i) => (
                        <Cell key={i} fill={DEVICE_COLORS[d.name] || COLORS[i % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-gray-400 text-sm py-8 text-center">No device data yet</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
