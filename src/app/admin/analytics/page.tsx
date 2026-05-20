'use client'

import { useEffect, useState, useCallback } from 'react'
import { BarChart3, TrendingUp, Search, Globe, Smartphone, Users, ArrowRight, AlertTriangle, Lightbulb } from 'lucide-react'

interface DashboardData {
  period: { days: number; since: string }
  summary: { totalVisitors: number; totalOrders: number; totalRevenue: number; totalSearches: number }
  sourceAnalysis: { channel: string; label: string; sessions: number; pageviews: number; orders: number; conversionRate: string; revenue: number }[]
  funnel: { stage: string; value: number; pct: number }[]
  dropoffs: { from: string; to: string; drop: number; dropPct: string }[]
  search: { topSearches: { query: string; count: number; zeroResults: number }[]; zeroResultSearches: any[]; totalSearches: number; avgResults: number }
  device: { deviceBreakdown: { name: string; visits: number; sessions: number }[]; browserBreakdown: { name: string; value: number }[]; osBreakdown: { name: string; value: number }[] }
  geo: { geoDistribution: { name: string; value: number }[]; cityDistribution: { name: string; value: number }[] }
}

function LoadingSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[1,2,3,4].map(i => <div key={i} className="h-24 bg-gray-200 rounded-xl" />)}
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="h-72 bg-gray-200 rounded-xl" />
        <div className="h-72 bg-gray-200 rounded-xl" />
      </div>
    </div>
  )
}

function SummaryCard({ title, value, icon: Icon, suffix }: { title: string; value: string | number; icon: any; suffix?: string }) {
  return (
    <div className="bg-white rounded-xl border p-4 flex items-start gap-3">
      <div className="p-2 bg-amber-50 rounded-lg">
        <Icon className="h-5 w-5 text-amber-600" />
      </div>
      <div>
        <div className="text-sm text-gray-500">{title}</div>
        <div className="text-2xl font-bold">{typeof value === 'number' ? value.toLocaleString() : value}{suffix || ''}</div>
      </div>
    </div>
  )
}

function SimpleBar({ value, max, label, color = 'bg-amber-500' }: { value: number; max: number; label: string; color?: string }) {
  const pct = max > 0 ? (value / max) * 100 : 0
  return (
    <div className="flex items-center gap-2">
      <div className="text-xs text-gray-600 w-24 truncate" title={label}>{label}</div>
      <div className="flex-1 bg-gray-100 rounded-full h-5 overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <div className="text-xs text-gray-500 w-12 text-right">{value}</div>
    </div>
  )
}

function FunnelBar({ stage, value, pct, isFirst }: { stage: string; value: number; pct: number; isFirst: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-sm text-gray-700 w-32">{stage}</div>
      <div className="flex-1 flex items-center gap-2">
        <div className="bg-amber-100 rounded-full h-8 flex items-center justify-center text-sm font-semibold text-amber-800" style={{ width: `${Math.max(pct, 2)}%`, minWidth: '40px' }}>
          {value}
        </div>
        {!isFirst && <span className="text-xs text-gray-400">{pct}%</span>}
      </div>
    </div>
  )
}

export default function AnalyticsPage() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [days, setDays] = useState(30)

  const fetchData = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/analytics/dashboard?days=${days}`)
      if (!res.ok) throw new Error('Failed to fetch')
      const json = await res.json()
      setData(json)
    } catch (e: any) {
      setError(e.message || 'Failed to load analytics')
    } finally {
      setLoading(false)
    }
  }, [days])

  useEffect(() => { fetchData() }, [fetchData])

  if (loading) return <LoadingSkeleton />
  if (error) return <div className="text-red-500 p-8 text-center">{error} <button onClick={fetchData} className="underline ml-2">Retry</button></div>
  if (!data) return null

  const { summary, sourceAnalysis, funnel, dropoffs, search, device, geo } = data
  const maxSourceSession = Math.max(...sourceAnalysis.map(s => s.sessions), 1)
  const maxGeo = Math.max(...geo.geoDistribution.map(g => g.value), 1)
  const maxDevice = Math.max(...device.deviceBreakdown.map(d => d.visits), 1)
  const maxSearch = Math.max(...search.topSearches.map(s => s.count), 1)

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Analytics Dashboard</h1>
          <p className="text-sm text-gray-500">Comprehensive traffic and conversion insights</p>
        </div>
        <select
          value={days}
          onChange={e => setDays(Number(e.target.value))}
          className="border rounded-lg px-3 py-2 text-sm bg-white"
        >
          <option value={7}>Last 7 days</option>
          <option value={30}>Last 30 days</option>
          <option value={90}>Last 90 days</option>
        </select>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard title="Total Visitors" value={summary.totalVisitors} icon={Users} />
        <SummaryCard title="Total Orders" value={summary.totalOrders} icon={TrendingUp} />
        <SummaryCard title="Total Revenue" value={`GHS ${summary.totalRevenue.toLocaleString()}`} icon={BarChart3} suffix="" />
        <SummaryCard title="On-Site Searches" value={summary.totalSearches} icon={Search} />
      </div>

      {/* Row 1: Source Channel + Funnel */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Traffic Source Analysis */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-1">Traffic Source Channels</h2>
          <p className="text-xs text-gray-500 mb-4">Session distribution by channel type</p>
          <div className="space-y-3">
            {sourceAnalysis.map(s => (
              <div key={s.channel}>
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium">{s.label}</span>
                  <span className="text-xs text-gray-500">{s.sessions} sessions | {s.conversionRate}% conv.</span>
                </div>
                <SimpleBar value={s.sessions} max={maxSourceSession} label="" color={
                  s.channel === 'direct' ? 'bg-blue-500' :
                  s.channel === 'search' ? 'bg-green-500' :
                  s.channel === 'social' ? 'bg-purple-500' : 'bg-gray-400'
                } />
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t grid grid-cols-4 gap-2 text-center text-xs">
            {sourceAnalysis.map(s => (
              <div key={s.channel}>
                <div className="font-semibold text-gray-800">{s.sessions}</div>
                <div className="text-gray-400">{s.label}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Conversion Funnel */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-1">Conversion Funnel</h2>
          <p className="text-xs text-gray-500 mb-4">Browse → Add to Cart → Payment</p>
          <div className="space-y-4">
            {funnel.map((f, i) => (
              <FunnelBar key={f.stage} stage={f.stage} value={f.value} pct={f.pct} isFirst={i === 0} />
            ))}
          </div>
        </div>
      </div>

      {/* Drop-off Analysis */}
      {dropoffs.length > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-xl p-5">
          <h2 className="text-lg font-semibold mb-3 flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-orange-500" />
            Critical Drop-off Points
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {dropoffs.map((d, i) => {
              const dropNum = parseFloat(d.dropPct)
              const isHigh = dropNum > 50
              return (
                <div key={i} className={`rounded-lg p-3 ${isHigh ? 'bg-red-50 border border-red-200' : 'bg-white border'}`}>
                  <div className="text-xs text-gray-500 mb-1">{d.from} → {d.to}</div>
                  <div className={`text-lg font-bold ${isHigh ? 'text-red-600' : 'text-orange-600'}`}>
                    {d.dropPct}
                  </div>
                  <div className="text-xs text-gray-400">drop-off ({d.drop} lost)</div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Row 2: Search + Device/Geo */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* On-Site Search */}
        <div className="bg-white rounded-xl border p-5">
          <h2 className="text-lg font-semibold mb-1">On-Site Search</h2>
          <p className="text-xs text-gray-500 mb-4">Top search queries ({search.totalSearches} total, avg {search.avgResults} results)</p>
          {search.topSearches.length > 0 ? (
            <div className="space-y-2">
              {search.topSearches.slice(0, 12).map(s => (
                <div key={s.query} className="flex items-center gap-2">
                  <span className="text-sm flex-1 truncate">{s.query}</span>
                  <span className="text-xs text-gray-400">{s.count}x</span>
                  {s.zeroResults > 0 && (
                    <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full">0 results</span>
                  )}
                  <SimpleBar value={s.count} max={maxSearch} label="" color="bg-amber-400" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center text-gray-400 py-8">No search data yet</div>
          )}
          {search.zeroResultSearches.length > 0 && (
            <div className="mt-4 pt-4 border-t">
              <h3 className="text-sm font-semibold text-red-600 flex items-center gap-1 mb-2">
                <Lightbulb className="h-4 w-4" /> Zero-Result Searches (Opportunities)
              </h3>
              <div className="flex flex-wrap gap-1">
                {search.zeroResultSearches.map(s => (
                  <span key={s.query} className="text-xs bg-red-50 text-red-700 px-2 py-1 rounded">
                    {s.query} ({s.count}x)
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Device & Geo */}
        <div className="space-y-6">
          {/* Device Breakdown */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Smartphone className="h-5 w-5 text-gray-400" />
              Device Breakdown
            </h2>
            <p className="text-xs text-gray-500 mb-4">Mobile vs Desktop vs Tablet</p>
            <div className="space-y-3">
              {device.deviceBreakdown.map(d => (
                <div key={d.name}>
                  <div className="flex justify-between text-sm mb-1">
                    <span>{d.name}</span>
                    <span className="text-gray-500">{d.visits} visits ({d.sessions} sessions)</span>
                  </div>
                  <SimpleBar value={d.visits} max={maxDevice} label="" color={
                    d.name === 'Mobile' ? 'bg-indigo-500' :
                    d.name === 'Desktop' ? 'bg-teal-500' : 'bg-pink-400'
                  } />
                </div>
              ))}
            </div>
            <div className="mt-4 pt-4 border-t grid grid-cols-2 gap-4">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Browser</h3>
                {device.browserBreakdown.slice(0, 5).map(b => (
                  <div key={b.name} className="flex justify-between text-xs py-1">
                    <span>{b.name}</span>
                    <span className="text-gray-500">{b.value}</span>
                  </div>
                ))}
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 mb-2">OS</h3>
                {device.osBreakdown.slice(0, 5).map(o => (
                  <div key={o.name} className="flex justify-between text-xs py-1">
                    <span>{o.name}</span>
                    <span className="text-gray-500">{o.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Geo Distribution */}
          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-lg font-semibold mb-1 flex items-center gap-2">
              <Globe className="h-5 w-5 text-gray-400" />
              Geographic Distribution
            </h2>
            <p className="text-xs text-gray-500 mb-4">Visitor locations by country</p>
            <div className="space-y-2">
              {geo.geoDistribution.slice(0, 8).map(g => (
                <SimpleBar key={g.name} value={g.value} max={maxGeo} label={g.name} color="bg-cyan-500" />
              ))}
            </div>
            {geo.cityDistribution.length > 0 && (
              <div className="mt-4 pt-4 border-t">
                <h3 className="text-xs font-semibold text-gray-500 mb-2">Top Cities</h3>
                <div className="flex flex-wrap gap-1">
                  {geo.cityDistribution.slice(0, 10).map(c => (
                    <span key={c.name} className="text-xs bg-gray-100 text-gray-700 px-2 py-1 rounded">
                      {c.name} ({c.value})
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
