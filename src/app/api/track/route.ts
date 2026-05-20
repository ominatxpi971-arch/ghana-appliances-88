import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function POST(request: NextRequest) {
  try {
    const { orderId, phone } = await request.json()
    if (!orderId || !phone) {
      return NextResponse.json({ error: "Order ID and phone required" }, { status: 400 })
    }
    
    const supabase = createAdminClient()
    
    // Find order by ID prefix match and phone match
    const cleanPhone = phone.replace(/[^0-9]/g, "")
    const { data: orders } = await supabase
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false })
      .limit(50) // limit to recent orders for performance
    
    if (!orders) {
      return NextResponse.json({ order: null })
    }
    
    const found = orders.find((o: any) =>
      String(o.id).startsWith(orderId.trim()) &&
      (o.customer_phone || "").replace(/[^0-9]/g, "").includes(cleanPhone)
    )
    
    if (!found) {
      return NextResponse.json({ order: null })
    }
    
    // Return minimal safe fields
    return NextResponse.json({
      order: {
        id: found.id,
        customer_name: found.customer_name,
        status: found.status,
        total_ghs: found.total_ghs,
        customer_city: found.customer_city,
        customer_address: found.customer_address,
        tracking_number: found.tracking_number || null,
        tracking_url: found.tracking_url || null,
        created_at: found.created_at,
        items: (found.order_items || []).map((i: any) => ({
          product_name: i.product_name,
          quantity: i.quantity,
        })),
      }
    })
  } catch {
    return NextResponse.json({ error: "Failed to look up order" }, { status: 500 })
  }
}
