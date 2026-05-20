
import { NextRequest, NextResponse } from "next/server"
import { getOrderById, getSettings } from "@/lib/db"
import { sendManualEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const { orderId, to } = await request.json()
  const order = await getOrderById(orderId)
  if (!order) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const settings: any = await getSettings()
  const storeName = settings?.site_name||"Ghana Appliances"
  const storePhone = settings?.phone||""

  const itemsHtml = (order.items||[]).map((i: any) => `<tr><td style="padding:8px;border-bottom:1px solid #eee">${i.product_name} ×${i.quantity}</td><td style="padding:8px;text-align:right">GH? ${(Number(i.unit_price)*i.quantity).toLocaleString()}</td></tr>`).join("")

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><div style="background:#f59e0b;color:#000;padding:16px;text-align:center;border-radius:8px 8px 0 0"><h1 style="margin:0;font-size:20px">\u26A1 ${storeName}</h1><p>Order #${String(order.id).slice(0,8)}</p></div><div style="background:#fff;border:1px solid #eee;border-top:0;padding:20px;border-radius:0 0 8px 8px"><p>Dear <strong>${order.customer_name}</strong>, your order is: <strong>${order.status}</strong></p><div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0"><p style="margin:0;font-weight:bold">Order ID: ${order.id}</p><p>Total: GH? ${Number(order.total_ghs).toLocaleString()}</p></div><table style="width:100%;border-collapse:collapse">${itemsHtml}<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold;font-size:18px;color:#f59e0b">GH? ${Number(order.total_ghs).toLocaleString()}</td></tr></table><p style="margin:16px 0 0;font-size:14px;color:#666">Questions? ${storePhone}</p></div></body></html>`

  const sent = await sendManualEmail(to, `Order #${String(order.id).slice(0,8)}`, html)
  if (!sent) return NextResponse.json({ error: "Failed" }, { status: 500 })
  return NextResponse.json({ success: true })
}
