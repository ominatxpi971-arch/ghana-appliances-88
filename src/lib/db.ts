import { createAdminClient } from "@/lib/supabase/admin"
import { Product, ProductVariant, Order, OrderStatus, Post, SiteSettings } from "@/lib/types"
import { products as seedProducts } from "@/lib/data"

function supabase() { return createAdminClient() }

function isSupabaseConfigured(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  return !!(url && key && url.length > 10 && key.length > 10)
}

// ==================== Products ====================

export async function getProducts(): Promise<Product[]> {
  if (!isSupabaseConfigured() && process.env.NODE_ENV === "development") return seedProducts
  const { data, error } = await supabase().from("products").select("*").order("created_at", { ascending: false })
  if (error) { return process.env.NODE_ENV === "development" ? seedProducts : [] }
  return (data || []).map(rowToProduct)
}

export async function getProductById(id: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return process.env.NODE_ENV === "development" ? (seedProducts.find(p => p.id === id) || null) : null
  const { data } = await supabase().from("products").select("*").eq("id", id).single()
  return data ? rowToProduct(data) : null
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  if (!isSupabaseConfigured()) return process.env.NODE_ENV === "development" ? (seedProducts.find(p => p.slug === slug) || null) : null
  const { data } = await supabase().from("products").select("*").eq("slug", slug).single()
  return data ? rowToProduct(data) : null
}

export async function createProduct(product: Partial<Product>): Promise<Product> {
  const { data, error } = await supabase().from("products").insert(productToRow(product)).select().single()
  if (error) throw error
  return rowToProduct(data)
}

export async function updateProduct(id: string, updates: Partial<Product>): Promise<Product> {
  // Fetch existing product to merge partial updates safely
  const { data: existing } = await supabase().from("products").select("*").eq("id", id).single()
  if (!existing) throw new Error("Product not found")
  // Merge: override fields that are explicitly provided, preserve unset fields
  const merged = { ...existing, ...productToRow(updates), updated_at: new Date().toISOString() }
  if (updates.images === undefined) merged.images = existing.images
  if (updates.specs === undefined) merged.specs = existing.specs
  const { data, error } = await supabase().from("products").update(merged).eq("id", id).select().single()
  if (error) throw error
  return rowToProduct(data)
}
export async function deleteProduct(id: string): Promise<void> {
  const { error } = await supabase().from("products").delete().eq("id", id)
  if (error) throw error
}

export async function saveProducts(products: Product[]): Promise<void> {}

// ==================== Orders ====================

export async function getOrders(): Promise<Order[]> {
  if (!isSupabaseConfigured()) return []
  const { data: orders, error } = await supabase().from("orders").select("*, order_items(*)").order("created_at", { ascending: false })
  if (error || !orders) return []
  return orders.map((o: any) => ({
    user_id: o.user_id || null,
    id: o.id,
    customer_name: o.customer_name || "",
    customer_phone: o.customer_phone || "",
    customer_email: o.customer_email || "",
    customer_city: o.customer_city || "",
    customer_address: o.customer_address || "",
    customer_region: o.customer_region || "",
    customer_deliverytime: o.customer_deliverytime || "",
    customer_ip: o.customer_ip || "",
    status: (o.status as OrderStatus) || "pending",
    subtotal_ghs: Number(o.subtotal_ghs) || 0,
    discount_ghs: Number(o.discount_ghs) || 0,
    delivery_fee: Number(o.delivery_fee) || 0,
    total_ghs: Number(o.total_ghs) || 0,
    coupon_code: o.coupon_code || null,
    notes: o.notes || null,
    tracking_number: o.tracking_number || null,
    tracking_url: o.tracking_url || null,
    created_at: o.created_at || "",
    items: (o.order_items || []).map((i: any) => ({
      id: i.id,
      order_id: i.order_id,
      product_id: i.product_id,
      product_name: i.product_name || "",
      variant_id: i.variant_id || undefined,
      variant_name: i.variant_name || undefined,
      variant_sku: i.variant_sku || undefined,
      quantity: Number(i.quantity) || 1,
      unit_price: Number(i.unit_price) || 0
    }))
  }))
}

export async function getOrderById(id: string): Promise<Order | null> {
  if (!isSupabaseConfigured()) return null
  const { data: o } = await supabase().from("orders").select("*").eq("id", id).single()
  if (!o) return null
  const { data: items } = await supabase().from("order_items").select("*").eq("order_id", o.id)
  return {
    ...o,
    customer_city: o.customer_city || "",
    total_ghs: Number(o.total_ghs),
    items: (items || []).map((i: any) => ({ ...i, unit_price: Number(i.unit_price) })),
    status: o.status as OrderStatus
  }
}

export async function createOrder(order: any): Promise<Order> {
  const { items, ...orderData } = order
  const { data: newOrder, error } = await supabase().from("orders").insert(orderData).select().single()
  if (error) throw error
  if (items?.length) {
    const orderItems = items.map((i: any) => ({ ...i, order_id: newOrder.id }))
    await supabase().from("order_items").insert(orderItems)
  }
  return { ...newOrder, items: (items || []).map((i: any) => ({ ...i, unit_price: Number(i.unit_price) })) }
}

export async function updateOrderStatus(id: string, updates: any): Promise<void> {
  const { error } = await supabase().from("orders").update(updates).eq("id", id)
  if (error) throw error
}

export async function deleteOrder(id: string | number): Promise<void> { const { error } = await supabase().from("orders").delete().eq("id", id); if (error) throw error; await supabase().from("order_items").delete().eq("order_id", id) }
export async function saveOrders(orders: Order[]): Promise<void> {}

// ==================== Settings ====================

export async function getSettings(): Promise<Partial<SiteSettings> | null> {
  if (!isSupabaseConfigured()) return { site_name: "Ghana Appliances", phone: "+233501234567", email: "info@ghanaappliance.cc", address: "Accra, Ghana" }
  const { data } = await supabase().from("site_settings").select("*").eq("id", 1).single()
  return data || {}
}

export async function saveSettings(settings: Partial<SiteSettings>): Promise<void> {
  if (!isSupabaseConfigured()) return
  const { error } = await supabase().from("site_settings").upsert({ id: 1, ...settings })
  if (error) throw error
}

// ==================== Coupons ====================

export async function getCoupons(): Promise<Record<string, unknown>[]> {
  if (!isSupabaseConfigured()) return []
  const { data } = await supabase().from("coupons").select("*").order("created_at", { ascending: false })
  return data || []
}

export async function createCoupon(coupon: Record<string, unknown>): Promise<Record<string, unknown>> {
  const { data, error } = await supabase().from("coupons").insert(coupon).select().single()
  if (error) throw error
  return data
}

export async function useCoupon(code: string): Promise<Record<string, unknown> | null> {
  if (!isSupabaseConfigured()) return null
  const { data: coupon } = await supabase().from("coupons").select("*").eq("code", code).eq("active", true).single()
  if (!coupon) return null
  if (coupon.max_uses > 0 && coupon.used >= coupon.max_uses) return null
  await supabase().from("coupons").update({ used: coupon.used + 1 }).eq("code", code)
  return coupon
}

// ==================== Analytics ====================

export async function getAnalytics(): Promise<{ orders: any[]; products: any[] }> {
  if (!isSupabaseConfigured()) return { orders: [], products: [] }
  const { data: orders } = await supabase().from("orders").select("*, order_items(*)")
  const { data: products } = await supabase().from("products").select("*")
  return { orders: orders || [], products: products || [] }
}


// ==================== Blog Posts ====================

export async function getPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase().from("posts").select("*").order("created_at", { ascending: false })
  if (error) { return [] }
  return (data || []).map(rowToPost)
}

export async function getPublishedPosts(): Promise<Post[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase().from("posts").select("*").eq("published", true).order("created_at", { ascending: false })
  if (error) { return [] }
  return (data || []).map(rowToPost)
}

export async function getPostBySlug(slug: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await supabase().from("posts").select("*").eq("slug", slug).single()
  return data ? rowToPost(data) : null
}

export async function getPostById(id: string): Promise<Post | null> {
  if (!isSupabaseConfigured()) return null
  const { data } = await supabase().from("posts").select("*").eq("id", id).single()
  return data ? rowToPost(data) : null
}

export async function createPost(post: Partial<Post>): Promise<Post> {
  const { data, error } = await supabase().from("posts").insert(postToRow(post)).select().single()
  if (error) throw error
  return rowToPost(data)
}

export async function updatePost(id: string, updates: Partial<Post>): Promise<Post> {
  const { data, error } = await supabase().from("posts").update({ ...postToRow(updates), updated_at: new Date().toISOString() }).eq("id", id).select().single()
  if (error) throw error
  return rowToPost(data)
}

export async function deletePost(id: string): Promise<void> {
  const { error } = await supabase().from("posts").delete().eq("id", id)
  if (error) throw error
}

function rowToPost(row: any): Post {
  return {
    id: row.id,
    title: row.title,
    slug: row.slug,
    excerpt: row.excerpt || "",
    content: row.content || "",
    featured_image: row.featured_image || null,
    category: row.category || "General",
    tags: row.tags || [],
    author: row.author || "Ghana Appliances",
    published: row.published || false,
    created_at: row.created_at,
    updated_at: row.updated_at,
  }
}

function postToRow(p: any): Record<string, unknown> {
  return {
    title: p.title,
    slug: p.slug || p.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, ""),
    excerpt: p.excerpt,
    content: p.content,
    featured_image: p.featured_image,
    category: p.category,
    tags: p.tags,
    author: p.author,
    published: p.published ?? false,
  }
}


// ==================== Product Variants ====================

export async function getVariants(productId: string): Promise<ProductVariant[]> {
  if (!isSupabaseConfigured()) return []
  const { data, error } = await supabase().from("product_variants").select("*").eq("product_id", productId).order("sort_order", { ascending: true })
  if (error) return []
  return (data || []).map(rowToVariant)
}

export async function saveVariants(productId: string, variants: Partial<ProductVariant>[]): Promise<void> {
  if (!isSupabaseConfigured()) return
  // Delete existing variants for this product
  await supabase().from("product_variants").delete().eq("product_id", productId)
  // Insert new ones
  for (const v of variants) {
    const row = variantToRow({ ...v, product_id: productId })
    await supabase().from("product_variants").insert(row)
  }
}

function rowToVariant(row: any): ProductVariant {
  return {
    id: row.id,
    product_id: row.product_id,
    sku: row.sku || undefined,
    name: row.name || "",
    option1_name: row.option1_name || undefined,
    option1_value: row.option1_value || undefined,
    option2_name: row.option2_name || undefined,
    option2_value: row.option2_value || undefined,
    price_ghs: Number(row.price_ghs) || 0,
    stock: Number(row.stock) || 0,
    image: row.image || undefined,
    sort_order: row.sort_order || 0,
    active: row.active ?? true,
    created_at: row.created_at,
  }
}

function variantToRow(v: any): Record<string, unknown> {
  return {
    product_id: v.product_id,
    sku: v.sku || null,
    name: v.name || "",
    option1_name: v.option1_name || null,
    option1_value: v.option1_value || null,
    option2_name: v.option2_name || null,
    option2_value: v.option2_value || null,
    price_ghs: v.price_ghs ?? 0,
    stock: v.stock ?? 0,
    image: v.image || null,
    sort_order: v.sort_order ?? 0,
    active: v.active ?? true,
  }
}

// ==================== Helpers ====================

function rowToProduct(row: any): Product {
  return {
    id: row.id,
    name: row.name,
    slug: row.slug,
    description: row.description || "",
    category: row.category,
    price_ghs: Number(row.price_ghs),
    original_price: row.original_price ? Number(row.original_price) : null,
    images: row.images || [],
    specs: row.specs || {},
    stock: row.stock || 0,
    featured: row.featured || false,
    active: row.active ?? true,
    created_at: row.created_at,
    seo_title: row.seo_title || null,
    seo_description: row.seo_description || null,
    seo_keywords: row.seo_keywords || null
  }
}

function productToRow(p: any): Record<string, unknown> {
  return {
    name: p.name,
    slug: p.slug || p.name?.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
    description: p.description,
    category: p.category,
    price_ghs: p.price_ghs,
    original_price: p.original_price || null,
    images: p.images || [],
    specs: p.specs || {},
    stock: p.stock || 0,
    featured: p.featured || false,
    active: p.active ?? true,
    seo_title: p.seo_title || null,
    seo_description: p.seo_description || null,
    seo_keywords: p.seo_keywords || null
  }
}

export function readJSON<T>(file: string, fallback: T): T { return fallback }
export function writeJSON(file: string, data: unknown): void {}

