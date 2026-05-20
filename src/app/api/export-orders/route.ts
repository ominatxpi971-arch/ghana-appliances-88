import { NextRequest } from "next/server"
import { validateAdminRequest } from "@/lib/auth"
import { getOrders } from "@/lib/db"

export async function GET(request: NextRequest) {
  if (!(await validateAdminRequest(request))) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    })
  }

  const { searchParams } = new URL(request.url)
  const format = searchParams.get("format") || "csv"
  const status = searchParams.get("status") || ""

  let orders = await getOrders()
  
  // Filter by status if provided
  if (status && status !== "all") {
    orders = orders.filter((o: any) => o.status === status)
  }

  if (format === "csv") {
    const header = [
      "Order ID", "Customer Name", "Phone", "Email", "City", "Region",
      "Address", "Status", "Subtotal (GHS)", "Discount (GHS)",
      "Delivery Fee (GHS)", "Total (GHS)", "Items", "IP Address", "Date"
    ].join(",")
    
    const rows = orders.map((o: any) => [
      o.id,
      `"${(o.customer_name || "").replace(/"/g, '""')}"`,
      `"${o.customer_phone || ""}"`,
      `"${o.customer_email || ""}"`,
      `"${o.customer_city || ""}"`,
      `"${o.customer_region || ""}"`,
      `"${(o.customer_address || "").replace(/"/g, '""').substring(0, 200)}"`,
      o.status,
      o.subtotal_ghs || 0,
      o.discount_ghs || 0,
      o.delivery_fee || 0,
      o.total_ghs,
      `"${(o.items || []).map((i: any) => `${i.product_name} x${i.quantity}`).join("; ")}"`,
      `"${o.customer_ip || ""}"`,
      `"${o.created_at || ""}"`,
    ].join(","))

    const bom = "\uFEFF" // UTF-8 BOM for Excel compatibility
    return new Response(bom + header + "\n" + rows.join("\n"), {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="orders-${new Date().toISOString().slice(0, 10)}.csv"`,
      },
    })
  }

  // JSON format for API consumption
  return new Response(JSON.stringify(orders), {
    headers: { "Content-Type": "application/json" },
  })
}