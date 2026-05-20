import { NextRequest, NextResponse } from "next/server"
import { getProductById, updateProduct, deleteProduct } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const p = await getProductById(id)
  if (!p) return NextResponse.json({ error: "Not found" }, { status: 404 })
  return NextResponse.json(p)
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; const body = await request.json()
  const p = await updateProduct(id, body)
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