import type { Metadata } from "next"
import { getProductBySlug, getProducts } from "@/lib/db"
import { notFound } from "next/navigation"
import Breadcrumbs from "@/components/Breadcrumbs"
import { BreadcrumbSchema, ProductSchema } from '@/components/StructuredData'
import { formatPrice } from "@/lib/utils"
import ProductPageClient from "./ProductPageClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

interface Props {
  params: Promise<{ slug: string }>
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params
  const product = await getProductBySlug(slug)
  if (!product || !product.active) {
    return { title: "Product Not Found", robots: { index: false } }
  }

  const title = product.seo_title || `${product.name} - Buy Online in Ghana`
  const description = product.seo_description || (product.description.length > 160
    ? product.description.slice(0, 157) + "..."
    : product.description)
  const image = product.images?.[0] || `${SITE_URL}/og-default.jpg`
  const price = product.price_ghs

  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: `/products/${product.slug}` },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/products/${product.slug}`,
      siteName: "Ghana Appliances",
      type: "website",
      locale: "en_GH",
      images: [{ url: image, width: 1200, height: 630, alt: product.name }],

    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
    robots: { index: true, follow: true },
    keywords: product.seo_keywords ? product.seo_keywords.split(",").map((k: string) => k.trim()) : [product.name, product.category, "buy online Ghana", "COD", "Accra"],
    other: {
      'twitter:label1': 'Price',
      'twitter:data1': `GH\u20B5${formatPrice(price)}`,
      'twitter:label2': 'Category',
      'twitter:data2': product.category.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()),
    } as Record<string, string>,
  }
}

export async function generateStaticParams() {
  const products = await getProducts()
  return products.filter(p => p.active).map(p => ({ slug: p.slug }))
}

export const revalidate = 3600

export default async function ProductPage({ params }: Props) {
  const { slug } = await params
  const product = await getProductBySlug(slug)

  if (!product || !product.active) notFound()

  const allProducts = await getProducts()
  const related = allProducts
    .filter(p => p.category === product.category && p.id !== product.id && p.active)
    .slice(0, 4)

  const catLabel = product.category.replace(/-/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase())

  return (
    <>
      <Breadcrumbs items={[
        { label: "Home", href: "/" },
        { label: catLabel, href: `/products?category=${product.category}` },
        { label: product.name },
      ]} />
      <BreadcrumbSchema items={[
        { name: "Home", url: "/" },
        { name: catLabel, url: `/products?category=${product.category}` },
        { name: product.name, url: `/products/${product.slug}` },
      ]} />
      <ProductSchema product={product} />
      <ProductPageClient product={product} related={related} />
    </>
  )
}
