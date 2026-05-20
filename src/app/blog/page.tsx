import type { Metadata } from "next"
import Link from "next/link"
import NextImage from "next/image"
import { getPublishedPosts } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import Breadcrumbs from "@/components/Breadcrumbs"
import { BreadcrumbSchema } from "@/components/StructuredData"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "Blog - Home Appliance Tips, Guides & Reviews | Ghana Appliances",
  description: "Expert guides on buying TVs, air conditioners, refrigerators, washing machines in Ghana. Energy saving tips, product comparisons, and maintenance advice.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/blog" },
  openGraph: {
    title: "Blog - Home Appliance Tips, Guides & Reviews | Ghana Appliances",
    description: "Expert guides on buying TVs, air conditioners, refrigerators, washing machines in Ghana.",
    url: `${SITE_URL}/blog`,
    siteName: "Ghana Appliances",
    type: "website",
    images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Ghana Appliances Blog' }],
    locale: "en_GH",
  },
  robots: { index: true, follow: true },
  keywords: ["appliance blog ghana", "buying guide", "TV tips", "AC maintenance", "fridge reviews", "energy saving ghana"],
}

export const revalidate = 3600

export default async function BlogPage() {
  const posts = await getPublishedPosts()

  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog" }]} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Blog", url: "/blog" }]} />
    <div className="container mx-auto px-4 py-12">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-4">Ghana Appliances Blog</h1>
        <p className="text-lg text-gray-500 mb-10">
          Expert tips, buying guides, and home appliance advice for Ghanaian households.
        </p>

        {posts.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-6xl mb-4">📝</p>
            <p className="text-lg">No articles yet. Check back soon for expert appliance guides!</p>
          </div>
        ) : (
          <div className="grid gap-8">
            {posts.map(post => (
              <article key={post.id}>
                <Link href={`/blog/${post.slug}`} className="group grid md:grid-cols-3 gap-6 bg-white border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                <div className="aspect-video md:aspect-square bg-gray-100 relative overflow-hidden">
                  {post.featured_image ? (
                    <NextImage src={post.featured_image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
                  ) : (
                    <div className="h-full w-full flex items-center justify-center text-5xl">📝</div>
                  )}
                </div>
                <div className="md:col-span-2 p-6 md:py-6 md:pr-6 md:pl-0">
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="secondary" className="text-xs">{post.category}</Badge>
                    <span className="text-xs text-gray-400">{new Date(post.created_at).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}</span>
                  </div>
                  <h2 className="text-xl font-bold group-hover:text-amber-600 transition-colors mb-2">{post.title}</h2>
                  <p className="text-gray-500 text-sm line-clamp-2">{post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160)}</p>
                  {post.tags && post.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-3">
                      {post.tags.slice(0, 4).map(tag => (
                        <span key={tag} className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">{tag}</span>
                      ))}
                    </div>
                  )}
                </div>
              </Link>
              </article>
            ))}
          </div>
        )}
      </div>
    </div>
    </>
  )
}
