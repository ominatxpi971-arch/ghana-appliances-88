"use client"

import { useState, useEffect } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { TrendingUp, MousePointerClick, Eye, BarChart3, Upload } from "lucide-react"
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from "recharts"
import { toast } from "sonner"

interface GscSummary {
  totalClicks: number; totalImpressions: number; avgCtr: string; avgPosition: string
}

interface GscData {
  summary: GscSummary
  topQueries: { query: string; clicks: number; impressions: number; ctr: string; position: string }[]
  dailyTrend: { date: string; clicks: number; impressions: number }[]
}

export default function GscTab() {
  const [data, setData] = useState<GscData | null>(null)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    fetch("/api/gsc").then(r => r.json()).then(setData).catch(() => {})
  }, [])

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const text = await file.text()
      const rows = JSON.parse(text)
      const res = await fetch("/api/gsc", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rows }) })
      if (res.ok) {
        toast.success(`Imported ${rows.length} rows`)
        const refresh = await fetch("/api/gsc")
        setData(await refresh.json())
      } else {
        toast.error("Import failed")
      }
    } catch {
      toast.error("Invalid JSON file")
    }
    finally { setUploading(false); if (e.target) e.target.value = "" }
  }

  if (!data) return <div className="py-10 text-center text-gray-400">Loading GSC data...</div>

  if (data.topQueries.length === 0) return (
    <div className="py-16 text-center">
      <BarChart3 className="h-16 w-16 mx-auto text-gray-300 mb-4" />
      <h3 className="text-lg font-semibold text-gray-600 mb-2">No GSC Data Yet</h3>
      <p className="text-gray-400 text-sm mb-4 max-w-md mx-auto">
        Connect Google Search Console to automatically pull search analytics, or upload a GSC export JSON file.
      </p>
      <label className="inline-block cursor-pointer">
        <Button variant="outline" disabled={uploading}>
          <Upload className="h-4 w-4 mr-2" />
          {uploading ? "Importing..." : "Upload GSC JSON Export"}
        </Button>
        <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={uploading} />
      </label>
    </div>
  )

  const { summary, topQueries, dailyTrend } = data

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">Google Search Console</h2>
        <label className="cursor-pointer">
          <Button variant="outline" size="sm" disabled={uploading}>
            <Upload className="h-3.5 w-3.5 mr-1" />
            {uploading ? "Importing..." : "Upload Data"}
          </Button>
          <input type="file" accept=".json" className="hidden" onChange={handleFileUpload} disabled={uploading} />
        </label>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Total Clicks", value: summary.totalClicks.toLocaleString(), icon: MousePointerClick, color: "text-blue-600", bg: "bg-blue-100" },
          { label: "Impressions", value: summary.totalImpressions.toLocaleString(), icon: Eye, color: "text-purple-600", bg: "bg-purple-100" },
          { label: "Avg CTR", value: `${summary.avgCtr}%`, icon: TrendingUp, color: "text-green-600", bg: "bg-green-100" },
          { label: "Avg Position", value: summary.avgPosition, icon: BarChart3, color: "text-amber-600", bg: "bg-amber-100" },
        ].map(s => (
          <Card key={s.label}><CardContent className="p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm text-gray-500">{s.label}</span>
              <div className={`h-9 w-9 rounded-lg ${s.bg} flex items-center justify-center`}><s.icon className={`h-4 w-4 ${s.color}`} /></div>
            </div>
            <p className="text-2xl font-bold">{s.value}</p>
          </CardContent></Card>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* Trend */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Daily Clicks & Impressions</h3>
            <ResponsiveContainer width="100%" height={280}>
              <LineChart data={dailyTrend}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="date" tick={{ fontSize: 10 }} tickFormatter={v => v.slice(5)} />
                <YAxis tick={{ fontSize: 10 }} />
                <Tooltip />
                <Line type="monotone" dataKey="clicks" stroke="#3b82f6" strokeWidth={2} name="Clicks" dot={false} />
                <Line type="monotone" dataKey="impressions" stroke="#a855f7" strokeWidth={2} name="Impressions" dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Queries */}
        <Card>
          <CardContent className="p-6">
            <h3 className="font-semibold mb-4">Top Search Queries</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="text-left p-2 font-medium w-8">#</th>
                    <th className="text-left p-2 font-medium">Query</th>
                    <th className="text-right p-2 font-medium">Clicks</th>
                    <th className="text-right p-2 font-medium">Impr.</th>
                    <th className="text-right p-2 font-medium">CTR</th>
                    <th className="text-right p-2 font-medium">Pos.</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {topQueries.slice(0, 15).map((q, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-2 text-gray-400">{i + 1}</td>
                      <td className="p-2 truncate max-w-[200px] font-medium">{q.query}</td>
                      <td className="p-2 text-right font-bold text-blue-600">{q.clicks}</td>
                      <td className="p-2 text-right">{q.impressions.toLocaleString()}</td>
                      <td className="p-2 text-right">{q.ctr}%</td>
                      <td className="p-2 text-right">
                        <Badge variant={parseFloat(q.position) < 10 ? "default" : "secondary"}>{q.position}</Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
