import { getProducts, getSettings, getPublishedPosts } from "@/lib/db"

export async function GET() {
  const products = await getProducts()
  const posts = await getPublishedPosts()
  const activeProducts = products.filter(p => p.active)
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

  let settings: any
  try { settings = await getSettings() } catch { settings = null }

  const today = new Date().toISOString().split("T")[0]

  const staticUrls = [
    { loc: baseUrl, priority: "1.0", changefreq: "daily" },
    { loc: `${baseUrl}/products`, priority: "0.9", changefreq: "daily" },
    { loc: `${baseUrl}/about`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/contact`, priority: "0.6", changefreq: "monthly" },
    { loc: `${baseUrl}/track`, priority: "0.7", changefreq: "weekly" },
    { loc: `${baseUrl}/faq`, priority: "0.5", changefreq: "monthly" },
    { loc: `${baseUrl}/compare`, priority: "0.4", changefreq: "weekly" },
    { loc: `${baseUrl}/blog`, priority: "0.8", changefreq: "weekly" },
  ]

  const categories = [...new Set(activeProducts.map(p => p.category))]
  const categoryUrls = categories.map(cat => ({
    loc: `${baseUrl}/products?category=${cat}`,
    lastmod: today,
  }))

  const productUrls = activeProducts.map((p: any) => {
    const lastmod = (p.updated_at || p.created_at)
      ? new Date(p.updated_at || p.created_at).toISOString().split("T")[0]
      : today
    const hasImages = p.images && p.images.length > 0

    let imageElements = ""
    if (hasImages) {
      imageElements = p.images
        .filter((img: string) => img && !img.startsWith("/placeholder"))
        .slice(0, 5)
        .map((img: string) => {
          const imageUrl = img.startsWith("http") ? img : `${baseUrl}${img.startsWith("/") ? "" : "/"}${img}`
          const caption = `${p.name} - GHS ${p.price_ghs || 0}`
          return `    <image:image>
      <image:loc>${imageUrl}</image:loc>
      <image:title><![CDATA[${p.name}]]></image:title>
      <image:caption><![CDATA[${caption}]]></image:caption>
    </image:image>`
        })
        .join("\n")
    }

    const imagesBlock = imageElements ? `\n${imageElements}` : ""
    const hreflangBlock = `    <xhtml:link rel="alternate" hreflang="en-GH" href="${baseUrl}/products/${p.slug}"/>`

    return {
      loc: `${baseUrl}/products/${p.slug}`,
      lastmod,
      imagesBlock,
      hreflangBlock,
    }
  })

  const postUrls = posts.map(p => ({
    loc: `${baseUrl}/blog/${p.slug}`,
    lastmod: p.updated_at ? new Date(p.updated_at).toISOString().split("T")[0] : today,
  }))

  const staticXml = staticUrls
    .map(u => `  <url>
    <loc>${u.loc}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
    <xhtml:link rel="alternate" hreflang="en-GH" href="${u.loc}"/>
  </url>`)
    .join("\n")

  const categoryXml = categoryUrls
    .map(c => `  <url>
    <loc>${c.loc}</loc>
    <lastmod>${c.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en-GH" href="${c.loc}"/>
  </url>`)
    .join("\n")

  const productXml = productUrls
    .map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
${p.hreflangBlock}${p.imagesBlock}
  </url>`)
    .join("\n")

  const postXml = postUrls
    .map(p => `  <url>
    <loc>${p.loc}</loc>
    <lastmod>${p.lastmod}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
    <xhtml:link rel="alternate" hreflang="en-GH" href="${p.loc}"/>
  </url>`)
    .join("\n")

  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1" xmlns:video="http://www.google.com/schemas/sitemap-video/1.1" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:news="http://www.google.com/schemas/sitemap-news/0.9">
${staticXml}
${categoryXml}
${productXml}
${postXml}
</urlset>`

  return new Response(xml, {
    headers: {
      "Content-Type": "application/xml",
      "Cache-Control": "public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400",
    },
  })
}
