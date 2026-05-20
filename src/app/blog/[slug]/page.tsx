import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import Image from "next/image"
import { getPostBySlug, getPublishedPosts } from "@/lib/db"
import { Badge } from "@/components/ui/badge"
import Breadcrumbs from "@/components/Breadcrumbs"
import { BreadcrumbSchema, BlogPostingSchema } from "@/components/StructuredData"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const post = await getPostBySlug(slug)
  if (!post || !post.published) {
    return { title: "Post Not Found", robots: { index: false } }
  }

  const title = `${post.title} | Ghana Appliances Blog`
  const description = post.excerpt || post.content?.replace(/<[^>]*>/g, "").slice(0, 160) || post.title
  const image = post.featured_image || `${SITE_URL}/og-default.jpg`

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: `/blog/${post.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/blog/${post.slug}`,
      siteName: "Ghana Appliances",
      type: "article",
      locale: "en_GH",
      images: post.featured_image ? [{ url: post.featured_image, width: 1200, height: 630, alt: post.title }] : [],
      authors: [post.author],
      publishedTime: post.created_at,
      modifiedTime: post.updated_at,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: post.featured_image ? [post.featured_image] : [],
    },
    robots: { index: true, follow: true },
    keywords: post.tags || [],
  }
}

export async function generateStaticParams() {
  const posts = await getPublishedPosts()
  return posts.map(p => ({ slug: p.slug }))
}

export const revalidate = 3600

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params
  const post = await getPostBySlug(slug)

  if (!post || !post.published) notFound()

  const allPosts = await getPublishedPosts()
  const related = allPosts
    .filter(p => p.category === post.category && p.id !== post.id)
    .slice(0, 3)

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-3xl mx-auto">
        <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Blog", href: "/blog" }, { label: post.title }]} />

        {!post.published && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-6 text-sm text-amber-800">
            ⚠ This post is a draft and not publicly visible. <a href="/admin/blog" className="underline font-medium">Publish it in the admin panel</a>.
          </div>
        )}

        <article className="mt-6" itemScope itemType="https://schema.org/BlogPosting">
          <header className="mb-6">
            <Badge variant="secondary" className="mb-3" itemProp="articleSection">{post.category}</Badge>
            <h1 className="text-3xl md:text-4xl font-bold mb-4" itemProp="headline">{post.title}</h1>
            <div className="flex items-center gap-4 text-sm text-gray-500">
              <span itemProp="author" itemScope itemType="https://schema.org/Organization">
                <span itemProp="name">By {post.author}</span>
              </span>
              <span>·</span>
              <time dateTime={post.created_at} itemProp="datePublished">
                {new Date(post.created_at).toLocaleDateString("en-GH", { year: "numeric", month: "long", day: "numeric" })}
              </time>
            </div>
          </header>

          {post.featured_image && (
            <div className="aspect-video bg-gray-100 rounded-xl overflow-hidden mb-8 relative">
              <Image src={post.featured_image} alt={post.title} fill sizes="(max-width: 768px) 100vw, 768px" className="object-cover" priority itemProp="image" />
            </div>
          )}

          <section className="prose prose-lg max-w-none" itemProp="articleBody" dangerouslySetInnerHTML={{ __html: post.content }} />

          {post.tags && post.tags.length > 0 && (
            <div className="flex flex-wrap gap-2 mt-8 pt-6 border-t">
              {post.tags.map(tag => (
                <span key={tag} className="text-sm bg-gray-100 text-gray-600 px-3 py-1 rounded-full" itemProp="keywords">#{tag}</span>
              ))}
            </div>
          )}
        </article>

        {related.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-bold mb-6">Related Articles</h2>
            <div className="grid md:grid-cols-3 gap-6">
              {related.map(rp => (
                <Link key={rp.id} href={`/blog/${rp.slug}`} className="group border rounded-xl overflow-hidden hover:shadow-lg transition-shadow">
                  <div className="aspect-video bg-gray-100 relative overflow-hidden">
                    {rp.featured_image ? (
                      <Image src={rp.featured_image} alt={rp.title} fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover group-hover:scale-105 transition-transform" />
                    ) : (
                      <div className="h-full w-full flex items-center justify-center text-4xl">📝</div>
                    )}
                  </div>
                  <div className="p-4">
                    <Badge variant="secondary" className="text-xs mb-2">{rp.category}</Badge>
                    <h3 className="font-semibold text-sm group-hover:text-amber-600 transition-colors line-clamp-2">{rp.title}</h3>
                  </div>
                </Link>
              ))}
            </div>
          </section>
        )}

        <BreadcrumbSchema items={[
          { name: "Home", url: "/" },
          { name: "Blog", url: "/blog" },
          { name: post.title, url: `/blog/${post.slug}` },
        ]} />
        <BlogPostingSchema post={post} />
      </div>
    </div>
  )
}
