import { sendCapiPurchase } from "@/lib/capi"
import { NextRequest, NextResponse } from "next/server"
import { getOrders, getProducts, createOrder, updateProduct, useCoupon, getSettings } from "@/lib/db"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { validateAdminRequest } from "@/lib/auth"

const DEFAULT_DELIVERY_FEES: Record<string, number> = {
  "Greater Accra":0,"Ashanti":50,"Western":80,"Central":70,"Eastern":60,"Volta":90,
  "Northern":120,"Upper East":150,"Upper West":150,"Bono":100,"Bono East":100,
  "Ahafo":100,"Western North":90,"Oti":100,"Savannah":120,"North East":130,
}

async function getDeliveryFees(): Promise<Record<string, number>> {
  try {
    const settings = await getSettings()
    if (settings?.shipping_fees) {
      const parsed = JSON.parse(settings.shipping_fees)
      if (typeof parsed === "object" && parsed !== null) return parsed
    }
  } catch {}
  return DEFAULT_DELIVERY_FEES
}

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    request.headers.get("cf-connecting-ip") ||
    "unknown"
}

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  // Require admin auth to view orders
  const isAdmin = await validateAdminRequest(request)
  if (!isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }
  const { searchParams } = new URL(request.url)
  const email = searchParams.get("email")
  let orders = await getOrders()
  if (email) { orders = orders.filter(o => o.customer_email === email) }
  return NextResponse.json(orders)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { customer, items, couponCode } = body
  const products = await getProducts()
  const clientIP = getClientIP(request)
  const DELIVERY_FEES = await getDeliveryFees()

  let subtotal = items.reduce((sum: number, item: any) => {
    const p = products.find(pp => pp.id === item.productId)
    return sum + (p ? p.price_ghs * item.quantity : 0)
  }, 0)

  let discount = 0; let appliedCoupon: string|null = null
  if (couponCode) {
    const coupon = await useCoupon(couponCode.toUpperCase())
    if (coupon && subtotal >= (coupon.min_order||0)) {
      discount = coupon.type === "percent" ? Math.round(subtotal * Number(coupon.discount) / 100) : Number(coupon.discount)
      appliedCoupon = coupon.code as string | null
    }
  }

  const region = customer.region || "Greater Accra"
  const deliveryFee = DELIVERY_FEES[region] ?? 50
  const total = subtotal - discount + deliveryFee

  const orderItems = items.map((item: any) => {
    const p = products.find(pp => pp.id === item.productId)
    return { id: Date.now().toString()+Math.random().toString(36).slice(2), product_id: item.productId, product_name: p?.name||"Unknown", quantity: item.quantity, unit_price: p?.price_ghs||0 }
  })

  for (const item of items) {
    const p = products.find(pp => pp.id === item.productId)
    if (p) await updateProduct(p.id, { stock: Math.max(0, (p.stock||0) - item.quantity) })
  }

  const newOrder = await createOrder({
    id: Date.now(), customer_name: customer.name, customer_phone: customer.phone,
    customer_email: customer.email||"", customer_city: customer.city||"",
    customer_address: customer.address, customer_region: customer.region||"",
    customer_deliverytime: customer.deliveryTime||"any",
    customer_ip: clientIP,
    status: "pending", subtotal_ghs: subtotal, discount_ghs: discount,
    delivery_fee: deliveryFee, total_ghs: total, coupon_code: appliedCoupon,
    notes: customer.notes||null, created_at: new Date().toISOString(),
    items: orderItems,
  })

  // Server-side CAPI Purchase event (fire-and-forget)
  getSettings().then(settings => {
    if (settings?.meta_pixel_id && settings?.meta_pixel_access_token && customer.email) {
      sendCapiPurchase({
        pixelId: settings.meta_pixel_id,
        accessToken: settings.meta_pixel_access_token,
        eventId: `purchase_${newOrder.id}`,
        eventSourceUrl: `${process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"}/checkout`,
        customerEmail: customer.email,
        customerPhone: customer.phone,
        clientIp: clientIP,
        clientUserAgent: request.headers.get("user-agent") || "",
        value: total,
        currency: "GHS",
        contentIds: items.map((i: any) => i.productId),
        contents: items.map((i: any) => {
          const p = products.find(pp => pp.id === i.productId)
          return { id: i.productId, quantity: i.quantity }
        }),
        numItems: items.reduce((sum: number, i: any) => sum + i.quantity, 0),
        orderId: String(newOrder.id),
      }).catch(e => console.error('[CAPI] Purchase event failed:', e))
    }
  })

  if (customer.email) { sendOrderConfirmation(newOrder).catch(e => console.error('[Order] Confirmation email failed:', e)) }
  sendAdminNotification(newOrder).catch(e => console.error('[Order] Admin notification failed:', e))
  return NextResponse.json(newOrder, { status: 201 })
}
