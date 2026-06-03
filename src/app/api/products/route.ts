import { NextRequest, NextResponse } from "next/server"
import { getProducts, createProduct, saveVariants, updateProduct } from "@/lib/db"
import { revalidatePath } from "next/cache"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const category = searchParams.get("category")
  const search = searchParams.get("search")
  let products = await getProducts()
  if (category && category !== "all") products = products.filter(p => p.category === category)
  if (search) { const q = search.toLowerCase(); products = products.filter(p => p.name.toLowerCase().includes(q)) }
  return NextResponse.json(products)
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const product = await createProduct(body)
  if (body.variants && Array.isArray(body.variants) && body.variants.length > 0) {
    await saveVariants(product.id, body.variants)
    // Sync product stock = sum of variant stocks
    const totalStock = body.variants.reduce((sum: number, v: any) => sum + (Number(v.stock) || 0), 0)
    await updateProduct(product.id, { stock: totalStock })
  }
  revalidatePath("/")
  revalidatePath("/products")
  return NextResponse.json(product, { status: 201 })
}