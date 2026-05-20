import { NextRequest, NextResponse } from "next/server"
import { updateOrderStatus, getOrderById } from "@/lib/db"
import { sendShipmentEmail } from "@/lib/email"

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const body = await request.json()
  const numId = Number(id) || id
  await updateOrderStatus(numId as any, body)
  const order = await getOrderById(String(numId))
  // If status changed to shipping, send tracking email
  if (body.status === "shipping" && body.tracking_number) {
    try {
      if (order) await sendShipmentEmail(order, body.tracking_number, body.tracking_url)
    } catch (_) { /* non-critical */ }
  }

  return NextResponse.json(order)
}