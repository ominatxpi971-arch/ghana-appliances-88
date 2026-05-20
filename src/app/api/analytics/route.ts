
import { NextRequest, NextResponse } from "next/server"
import { getAnalytics, getSettings } from "@/lib/db"
import { validateAdminRequest } from "@/lib/auth"
import { getStatusLabel } from "@/lib/status-labels"

export async function GET(request: NextRequest) {
  const isAdmin = await validateAdminRequest(request)
  if (!isAdmin) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  const settings = await getSettings();
  const lowStockThreshold = Number(settings?.low_stock_threshold) || 5;
  const { orders, products } = await getAnalytics();
  
  const days: Record<string, any> = {}; const now = new Date()
  for (let i = 29; i >= 0; i--) { const d = new Date(now); d.setDate(d.getDate()-i); days[d.toISOString().slice(0,10)] = { revenue: 0, orders: 0 } }
  orders.forEach((o: any) => { const day = o.created_at?.slice(0,10); if (day && days[day]) { days[day].revenue += Number(o.total_ghs); days[day].orders += 1 } })
  const salesTrend = Object.entries(days).map(([date, data]) => ({ date, ...data }))

  const catRevenue: Record<string,number> = {}
  orders.forEach((o: any) => { (o.items||o.order_items||[]).forEach((i: any) => { const p = products.find((pp:any)=>pp.id===i.product_id); const cat = p?.category||"unknown"; catRevenue[cat]=(catRevenue[cat]||0)+(Number(i.unit_price)*i.quantity) }) })
  const byCategory = Object.entries(catRevenue).map(([n,v])=>({name:n.replace(/-/g," ").replace(/\b\w/g,(c:string)=>c.toUpperCase()),value:Math.round(v)})).sort((a,b)=>b.value-a.value)

  const statusCounts: Record<string,number> = {}; orders.forEach((o: any) => { statusCounts[o.status]=(statusCounts[o.status]||0)+1 })
  const byStatus = Object.entries(statusCounts).map(([n,v])=>({name:getStatusLabel(n),value:v}))

  const ps: Record<string,any> = {}
  orders.forEach((o: any) => { (o.items||o.order_items||[]).forEach((i: any) => { if(!ps[i.product_id]) ps[i.product_id]={name:i.product_name,quantity:0,revenue:0}; ps[i.product_id].quantity+=i.quantity; ps[i.product_id].revenue+=Number(i.unit_price)*i.quantity }) })
  const topProducts = Object.values(ps).sort((a:any,b:any)=>b.revenue-a.revenue).slice(0,10)

  const totalRevenue=orders.filter((o:any)=>o.status!=="cancelled").reduce((s:number,o:any)=>s+Number(o.total_ghs),0)
  const totalOrders=orders.length; const deliveredRevenue=orders.filter((o:any)=>o.status==="delivered").reduce((s:number,o:any)=>s+Number(o.total_ghs),0)
  const avgOrderValue=totalOrders>0?Math.round(totalRevenue/totalOrders):0
  const pendingCount=orders.filter((o:any)=>o.status==="pending").length
  const lowStock=products.filter((p:any)=>p.active&&p.stock<=lowStockThreshold&&p.stock>0); const outOfStock=products.filter((p:any)=>p.active&&p.stock<=0)

  return NextResponse.json({ summary: { totalRevenue, totalOrders, deliveredRevenue, avgOrderValue, pendingCount }, salesTrend, byCategory, byStatus, topProducts, alerts: { lowStock, outOfStock } })
}
