import { sendCapiPurchase } from "@/lib/capi"
import { NextRequest, NextResponse } from "next/server"
import { getOrders, getProducts, createOrder, updateProduct, useCoupon, getSettings, getVariants } from "@/lib/db"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendOrderConfirmation, sendAdminNotification } from "@/lib/email"
import { validateAdminRequest } from "@/lib/auth"

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

  // Build order items, resolving variant prices upfront
  const orderItems = await Promise.all(items.map(async (item: any) => {
    const p = products.find(pp => pp.id === item.productId)
    let unitPrice = p?.price_ghs || 0
    // If variant price override, fetch variant
    if (item.variantId) {
      try {
        const variantList = await getVariants(item.productId)
        const v = variantList.find((vv: any) => vv.id === item.variantId)
        if (v?.price_ghs && v.price_ghs > 0) unitPrice = v.price_ghs
      } catch {}
    }
    return { id: Date.now().toString()+Math.random().toString(36).slice(2), product_id: item.productId, product_name: p?.name||"Unknown", variant_id: item.variantId || null, variant_name: item.variantName || null, variant_sku: item.variantSku || null, quantity: item.quantity, unit_price: unitPrice }
  }))

  // Compute subtotal from resolved order items (variant-aware)
  let subtotal = orderItems.reduce((sum: number, oi: any) => sum + (oi.unit_price * oi.quantity), 0)

  let discount = 0; let appliedCoupon: string|null = null
  if (couponCode) {
    const coupon = await useCoupon(couponCode.toUpperCase())
    if (coupon && subtotal >= (Number(coupon.min_order)||0)) {
      discount = coupon.type === "percent" ? Math.round(subtotal * Number(coupon.discount) / 100) : Number(coupon.discount)
      appliedCoupon = coupon.code as string | null
    }
  }

  const deliveryFee = 0
  const total = subtotal - discount + deliveryFee

  for (const item of items) {
    const p = products.find(pp => pp.id === item.productId)
    if (!p) continue
    if (item.variantId) {
      // Decrement variant stock
      try {
        const variantList = await getVariants(item.productId)
        const v = variantList.find((vv: any) => vv.id === item.variantId)
        if (v) {
          await createAdminClient().from("product_variants").update({ stock: Math.max(0, (v.stock||0) - item.quantity) }).eq("id", v.id)
        }
      } catch {}
    } else {
      await updateProduct(p.id, { stock: Math.max(0, (p.stock||0) - item.quantity) })
    }
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
    if (settings?.meta_pixel_id && settings?.meta_pixel_access_token) {
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
      }).catch(e => console.error("[CAPI] Purchase event failed:", e))
    }
  })

  if (customer.email) { sendOrderConfirmation(newOrder).catch(e => console.error("[Order] Confirmation email failed:", e)) }
  sendAdminNotification(newOrder).catch(e => console.error("[Order] Admin notification failed:", e))
  return NextResponse.json(newOrder, { status: 201 })
}
