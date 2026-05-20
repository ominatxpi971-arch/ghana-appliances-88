"use client"

import { useState, useEffect, useCallback } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { DollarSign, TrendingUp, Target, ShoppingBag, Plus, RotateCcw } from "lucide-react"

const PLATFORM_OPTIONS = ["Facebook", "Google", "TikTok"]

interface CampaignRow {
  campaign: string
  source: string
  sessions: number
  orders: number
  revenue: number
  conversionRate: string
}

interface DashboardCampaignData {
  campaignPerformance: CampaignRow[]
  adSpend: Record<string, number>
  totalAdSpend: number
  roas: number | null
  summary: { totalOrders: number; totalRevenue: number }
}

export default function CampaignTab() {
  const [data, setData] = useState<DashboardCampaignData | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  // Ad spend entry form
  const [platform, setPlatform] = useState("Facebook")
  const [amount, setAmount] = useState("")
  const [spendDate, setSpendDate] = useState(new Date().toISOString().slice(0, 10))

  const fetchData = useCallback(async () => {
    try {
      const res = await fetch("/api/analytics/dashboard")
      setData(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchData() }, [fetchData])

  const handleAddSpend = async () => {
    const amt = parseFloat(amount)
    if (!amt || amt <= 0) {
      toast.error("Please enter a valid amount")
      return
    }
    setSaving(true)
    try {
      // Calculate new spend data
      const currentSpend = data?.adSpend || {}
      const platformKey = platform
      const newSpend = {
        ...currentSpend,
        [platformKey]: (Number(currentSpend[platformKey]) || 0) + amt,
      }

      const res = await fetch("/api/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ad_spend_data: JSON.stringify(newSpend) }),
      })

      if (!res.ok) throw new Error("Failed to save")
      toast.success(`Added GHS ${amt} to ${platform} spend`)
      setAmount("")
      fetchData()
    } catch {
      toast.error("Failed to save ad spend")
    }
    finally { setSaving(false) }
  }

  // Compute ad-attributed orders/revenue from campaignPerformance
  const adOrders = (data?.campaignPerformance || []).reduce((sum, c) => sum + c.orders, 0)
  const adRevenue = (data?.campaignPerformance || []).reduce((sum, c) => sum + c.revenue, 0)

  if (loading) return <div className="py-10 text-center text-gray-400">Loading campaign data...</div>
  if (!data) return <div className="py-10 text-center text-gray-400">No data yet</div>

  const formatPrice = (v: number) =>
    `GHS ${v.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`

  return (
    <div className="space-y-6">
      {/* ROAS & Stats Cards */}
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          {
            label: "ROAS",
            value: data.roas !== null ? `${data.roas}x` : "N/A",
            sub: data.roas !== null ? `For every GHS 1 spent, you get GHS ${data.roas} back` : "No ad spend recorded",
            icon: Target,
            color: "text-green-600",
            bg: "bg-green-100",
          },
          {
            label: "Total Ad Spend",
            value: formatPrice(data.totalAdSpend),
            sub: Object.entries(data.adSpend || {})
              .filter(([, v]) => Number(v) > 0)
              .map(([k, v]) => `${k}: ${formatPrice(Number(v))}`)
              .join(" · ") || "No spend recorded",
            icon: DollarSign,
            color: "text-amber-600",
            bg: "bg-amber-100",
          },
          {
            label: "Ad Orders",
            value: adOrders,
            sub: `${((adOrders / Math.max(data.summary.totalOrders, 1)) * 100).toFixed(1)}% of all orders`,
            icon: ShoppingBag,
            color: "text-blue-600",
            bg: "bg-blue-100",
          },
          {
            label: "Ad Revenue",
            value: formatPrice(adRevenue),
            sub: `${((adRevenue / Math.max(data.summary.totalRevenue, 1)) * 100).toFixed(1)}% of total revenue`,
            icon: TrendingUp,
            color: "text-purple-600",
            bg: "bg-purple-100",
          },
        ].map(stat => (
          <Card key={stat.label}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm text-gray-500">{stat.label}</span>
                <div className={`h-10 w-10 rounded-lg ${stat.bg} flex items-center justify-center`}>
                  <stat.icon className={`h-5 w-5 ${stat.color}`} />
                </div>
              </div>
              <p className="text-2xl font-bold">{stat.value}</p>
              <p className="text-xs text-gray-400 mt-1">{stat.sub}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Campaign Performance Table */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4">Campaign Performance</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="text-left p-3 font-medium">Campaign</th>
                  <th className="text-left p-3 font-medium">Source</th>
                  <th className="text-right p-3 font-medium">Sessions</th>
                  <th className="text-right p-3 font-medium">Orders</th>
                  <th className="text-right p-3 font-medium">Revenue</th>
                  <th className="text-right p-3 font-medium">Conv. Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.campaignPerformance.length > 0 ? (
                  data.campaignPerformance.map((c, i) => (
                    <tr key={i} className="hover:bg-gray-50">
                      <td className="p-3 font-medium">{c.campaign}</td>
                      <td className="p-3">
                        <Badge variant="secondary" className="text-xs">{c.source}</Badge>
                      </td>
                      <td className="p-3 text-right">{c.sessions.toLocaleString()}</td>
                      <td className="p-3 text-right">{c.orders}</td>
                      <td className="p-3 text-right font-medium">{formatPrice(c.revenue)}</td>
                      <td className="p-3 text-right">{c.conversionRate}%</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="p-8 text-center text-gray-400">
                      No campaign data yet. Add UTM parameters to your ad links to track campaigns.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Ad Spend Input Form */}
      <Card>
        <CardContent className="p-6">
          <h3 className="font-semibold mb-4 flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Ad Spend
          </h3>
          <div className="flex flex-wrap items-end gap-4">
            <div className="space-y-1.5">
              <Label>Platform</Label>
              <select
                value={platform}
                onChange={e => setPlatform(e.target.value)}
                className="border rounded-lg px-3 py-2 text-sm bg-white"
              >
                {PLATFORM_OPTIONS.map(p => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
            </div>
            <div className="space-y-1.5">
              <Label>Amount (GHS)</Label>
              <Input
                type="number"
                min="0"
                step="0.01"
                value={amount}
                onChange={e => setAmount(e.target.value)}
                placeholder="e.g. 500"
                className="w-32"
              />
            </div>
            <div className="space-y-1.5">
              <Label>Date</Label>
              <Input
                type="date"
                value={spendDate}
                onChange={e => setSpendDate(e.target.value)}
                className="w-40"
              />
            </div>
            <Button
              onClick={handleAddSpend}
              disabled={saving || !amount}
              className="bg-amber-600 hover:bg-amber-700"
            >
              {saving ? "Saving..." : "Add Spend"}
            </Button>
          </div>
          <p className="text-xs text-gray-400 mt-3">
            Adds to the cumulative total for the selected platform. Current totals are shown in the Ad Spend card above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
