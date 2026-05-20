import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { revalidatePath } from "next/cache"

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { ids, mode, value } = body

  if (!Array.isArray(ids) || ids.length === 0) {
    return NextResponse.json({ error: "No product IDs provided" }, { status: 400 })
  }
  if (!mode || !["fixed", "percent"].includes(mode)) {
    return NextResponse.json({ error: "Mode must be 'fixed' or 'percent'" }, { status: 400 })
  }
  if (typeof value !== "number") {
    return NextResponse.json({ error: "Value must be a number" }, { status: 400 })
  }

  const supabase = createAdminClient()
  let updated = 0

  if (mode === "percent") {
    // For percentage: fetch current prices, calculate, update individually
    const { data: products } = await supabase.from("products").select("id,price_ghs,original_price").in("id", ids)
    if (products) {
      for (const p of products) {
        const newPrice = Math.round(Math.max(0, Number(p.price_ghs) * (1 + value / 100)))
        let newOriginal = p.original_price != null
          ? Math.round(Math.max(0, Number(p.original_price) * (1 + value / 100)))
          : null
        const { error } = await supabase.from("products")
          .update({ price_ghs: newPrice, original_price: newOriginal, updated_at: new Date().toISOString() })
          .eq("id", p.id)
        if (!error) updated++
      }
    }
  } else {
    // Fixed: use raw SQL increment... but supabase-js doesn't support that directly
    // Fetch, update individually
    const { data: products } = await supabase.from("products").select("id,price_ghs,original_price").in("id", ids)
    if (products) {
      for (const p of products) {
        const newPrice = Math.max(0, Math.round(Number(p.price_ghs) + value))
        let newOriginal = p.original_price != null
          ? Math.max(0, Math.round(Number(p.original_price) + value))
          : null
        const { error } = await supabase.from("products")
          .update({ price_ghs: newPrice, original_price: newOriginal, updated_at: new Date().toISOString() })
          .eq("id", p.id)
        if (!error) updated++
      }
    }
  }

  revalidatePath("/")
  revalidatePath("/products")
  return NextResponse.json({ updated, total: ids.length })
}
