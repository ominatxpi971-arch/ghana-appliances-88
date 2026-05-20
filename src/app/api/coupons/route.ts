import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { getCoupons, createCoupon } from "@/lib/db"

export async function GET() {
  return NextResponse.json(await getCoupons())
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const coupon = await createCoupon(body)
  return NextResponse.json(coupon, { status: 201 })
}

async function updateCouponSafe(id: string, updates: Record<string, unknown>) {
  const supabase = createAdminClient()
  const { data, error } = await supabase.from("coupons").update(updates).eq("id", id).select().single()
  // If the update failed because expires_at column doesn't exist, retry without it
  if (error && error.message.toLowerCase().includes("expires_at")) {
    const { expires_at, ...rest } = updates
    const retry = await supabase.from("coupons").update(rest).eq("id", id).select().single()
    if (retry.error) return { error: retry.error.message }
    return { data: retry.data }
  }
  if (error) return { error: error.message }
  return { data }
}

export async function PUT(request: NextRequest) {
  const body = await request.json()
  const { id, ...updates } = body
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const result = await updateCouponSafe(id, updates as Record<string, unknown>)
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 500 })
  return NextResponse.json(result.data)
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase.from("coupons").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
