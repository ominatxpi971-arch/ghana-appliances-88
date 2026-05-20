import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const productId = searchParams.get("productId")
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"))
  const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get("pageSize") || "50")))
  const rating = searchParams.get("rating")
  const approved = searchParams.get("approved")

  try {
    const supabase = createAdminClient()

    let query = supabase.from("reviews").select("*", { count: "exact" })

    if (productId) query = query.eq("product_id", productId)
    if (rating) query = query.eq("rating", parseInt(rating))
    if (approved === "true") query = query.eq("approved", true)
    if (approved === "false") query = query.eq("approved", false)

    const from = (page - 1) * pageSize
    query = query.order("created_at", { ascending: false }).range(from, from + pageSize - 1)

    const { data, error, count } = await query

    // If approved column doesn't exist, retry without it
    if (error && approved !== null) {
      const errMsg = error.message.toLowerCase()
      if (errMsg.includes("column") && errMsg.includes("approved")) {
        let retryQuery = supabase.from("reviews").select("*", { count: "exact" })
        if (productId) retryQuery = retryQuery.eq("product_id", productId)
        if (rating) retryQuery = retryQuery.eq("rating", parseInt(rating))
        retryQuery = retryQuery.order("created_at", { ascending: false }).range(from, from + pageSize - 1)
        const { data: retryData, error: retryErr, count: retryCount } = await retryQuery
        if (retryErr) return NextResponse.json({ error: retryErr.message }, { status: 500 })

        const reviews = await enrichWithProductNames(supabase, retryData || [])
        const avg = computeAverage(retryData)
        return NextResponse.json({ reviews, average: avg, count: retryCount || 0, page, pageSize })
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })

    const reviews = await enrichWithProductNames(supabase, data || [])
    const avg = computeAverage(data)

    return NextResponse.json({ reviews, average: avg, count: count || 0, page, pageSize })
  } catch (err: any) {
    return NextResponse.json({ reviews: [], average: 0, count: 0, page, pageSize })
  }
}

async function enrichWithProductNames(supabase: any, reviews: any[]) {
  if (!reviews.length) return reviews
  const productIds = [...new Set(reviews.map((r: any) => r.product_id).filter(Boolean))]
  let productMap: Record<string, string> = {}
  if (productIds.length) {
    const { data: products } = await supabase.from("products").select("id, name").in("id", productIds)
    if (products) {
      for (const p of products) productMap[p.id] = p.name
    }
  }
  return reviews.map((r: any) => ({
    ...r,
    approved: r.approved !== undefined ? r.approved : false,
    product_name: productMap[r.product_id] || "Unknown",
  }))
}

function computeAverage(data: any[] | null) {
  return data?.length
    ? Math.round((data.reduce((s: number, r: any) => s + r.rating, 0) / data.length) * 10) / 10
    : 0
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { product_id, customer_name, rating, comment } = body

    if (!product_id || !customer_name || !rating) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    const supabase = createAdminClient()
    const { data, error } = await supabase.from("reviews").insert({
      product_id,
      customer_name,
      rating: Math.max(1, Math.min(5, Number(rating))),
      comment: comment || "",
    }).select().single()

    if (error) return NextResponse.json({ error: error.message }, { status: 500 })
    return NextResponse.json(data, { status: 201 })
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json()
    const { id, approved, ...rest } = body

    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })

    const supabase = createAdminClient()
    const updates: Record<string, any> = { ...rest }
    if (approved !== undefined) updates.approved = approved

    const { data, error } = await supabase
      .from("reviews")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      const errMsg = error.message.toLowerCase()
      if (errMsg.includes("approved") && errMsg.includes("column")) {
        return NextResponse.json(
          { error: "approved column not available; add it to the reviews table first" },
          { status: 400 }
        )
      }
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json(data)
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const id = searchParams.get("id")
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 })
  const supabase = createAdminClient()
  const { error } = await supabase.from("reviews").delete().eq("id", id)
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json({ success: true })
}
