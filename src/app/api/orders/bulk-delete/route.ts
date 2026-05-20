import { NextRequest, NextResponse } from "next/server"
import { deleteOrder } from "@/lib/db"

export async function POST(request: NextRequest) {
  const { ids } = await request.json()
  if (!Array.isArray(ids) || ids.length === 0) return NextResponse.json({ error: "No IDs" }, { status: 400 })
  let deleted = 0
  for (const id of ids) {
    try { await deleteOrder(id); deleted++ } catch (e) { console.error(`Failed to delete order ${id}:`, e) }
  }
  return NextResponse.json({ deleted })
}