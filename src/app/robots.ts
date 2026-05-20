import type { MetadataRoute } from "next"

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/cart", "/checkout", "/compare"],
        crawlDelay: 10,
      },
      {
        userAgent: "Googlebot",
        allow: "/",
        disallow: ["/admin/", "/api/", "/auth/", "/cart", "/checkout"],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
  }
}
