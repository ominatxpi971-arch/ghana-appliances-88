import { getProducts, getSettings } from "@/lib/db"
import { Product } from "@/lib/types"

const CATEGORY_MAP: Record<string, string> = {
  "air-conditioners": "Home & Garden > Climate Control > Air Conditioners",
  "refrigerators": "Home Appliances > Refrigerators",
  "washing-machines": "Home Appliances > Washing Machines",
  "televisions": "Electronics > Televisions",
  "small-appliances": "Home Appliances > Small Kitchen Appliances",
  "fans": "Home & Garden > Climate Control > Fans",
  "water-heaters": "Home Appliances > Water Heaters",
  "generators": "Home & Garden > Generators",
  "cookers": "Home Appliances > Ranges & Cooktops",
}

function extractBrand(product: Product): string {
  const known = ["Samsung", "LG", "Bosch", "Midea", "Philips", "Binatone", "Kenwood", "Nexus", "Hisense", "Panasonic", "Sony", "Toshiba", "Hitachi", "Whirlpool", "Electrolux", "Gree", "TCL", "Haier"]
  for (const brand of known) {
    if (product.name.toLowerCase().includes(brand.toLowerCase())) return brand
  }
  return "Ghana Appliances"
}

function googleCategory(category: string): string {
  return CATEGORY_MAP[category] || "Home Appliances"
}

function escapeXml(str: string): string {
  return str.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}

function imageUrl(raw: string | undefined, siteUrl: string): string {
  if (!raw) return ""
  if (raw.startsWith("http")) return raw
  return siteUrl + (raw.startsWith("/") ? raw : "/" + raw)
}

export async function GET() {
  const products = await getProducts()
  const active = products.filter(p => p.active)
  const settings = await getSettings().catch(() => null)
  const siteName = settings?.site_name || "Ghana Appliances"
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  const description = settings?.site_description || "Buy TVs, Air Conditioners, Refrigerators, Washing Machines in Ghana. Cash on Delivery available."

  const items = active.map(p => {
    const image = imageUrl(p.images?.[0], siteUrl)
    const brand = extractBrand(p)
    const category = googleCategory(p.category)

    return `    <item>
      <g:id>${escapeXml(p.id)}</g:id>
      <g:title>${escapeXml(p.name)}</g:title>
      <g:description>${escapeXml(p.description?.substring(0, 5000) || p.name)}</g:description>
      <g:link>${escapeXml(siteUrl)}/products/${escapeXml(p.slug)}</g:link>
      <g:image_link>${escapeXml(image)}</g:image_link>
      <g:price>${p.price_ghs.toFixed(2)} GHS</g:price>
      <g:availability>${p.stock > 0 ? "in_stock" : "out_of_stock"}</g:availability>
      <g:condition>new</g:condition>
      <g:brand>${escapeXml(brand)}</g:brand>
      <g:google_product_category>${escapeXml(category)}</g:google_product_category>
    </item>`
  }).join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">
  <channel>
    <title>${escapeXml(siteName)}</title>
    <link>${escapeXml(siteUrl)}</link>
    <description>${escapeXml(description)}</description>
${items}
  </channel>
</rss>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml; charset=utf-8",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}