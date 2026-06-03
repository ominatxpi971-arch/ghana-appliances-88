import { NextRequest, NextResponse } from "next/server"
import { getProductById, updateProduct, deleteProduct, saveVariants, getVariants } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const p = await getProductById(id)
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  const variants = await getVariants(id)
  return NextResponse.json({ ...p, variants })
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json()
  const p = await updateProduct(id, body)
  if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
    await saveVariants(id, body.variants)
    // Sync product stock = sum of variant stocks
    const totalStock = body.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
    await updateProduct(id, { stock: totalStock })
  }
  revalidatePath("/")
  revalidatePath("/products")
  if (p.slug) revalidatePath(/products/ + p.slug)
  return NextResponse.json(p)
}

export async function DELETE(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params
  const p = await getProductById(id)
  await deleteProduct(id)
  revalidatePath("/")
  revalidatePath("/products")
  if (p?.slug) revalidatePath(/products/ + p.slug)
  return NextResponse.json({ success: true })
}