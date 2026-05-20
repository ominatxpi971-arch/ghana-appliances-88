import type { Metadata } from "next"
import { getProducts } from "@/lib/db"
import ProductsPageClient from "./ProductsPageClient"
import { BreadcrumbSchema } from "@/components/StructuredData"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "All Products - Buy Electrical Appliances in Ghana | COD",
  description: "Browse our full range of TVs, air conditioners, refrigerators, washing machines and more. Cash on delivery available across Ghana.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/products" },
  openGraph: {
    title: "All Products - Buy Electrical Appliances in Ghana",
    description: "Browse our full range of TVs, air conditioners, refrigerators, washing machines and more. Cash on delivery available across Ghana.",
    url: `${SITE_URL}/products`,
    siteName: "Ghana Appliances",
    type: "website",
images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'All Products - Ghana Appliances' }],
    locale: "en_GH",
  },
  twitter: {
    card: "summary_large_image",
    title: "All Products - Ghana Appliances",
    description: "Quality electrical appliances with COD across Ghana.",
  },
  robots: { index: true, follow: true },
  keywords: ["electrical appliances Ghana", "buy TV Ghana", "AC Ghana", "fridge Ghana", "COD Ghana", "Accra appliances"],
}

export const revalidate = 3600

export default async function ProductsPage() {
  const products = await getProducts()
  const activeProducts = products.filter(p => p.active)

  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Products", url: "/products" }]} />
      <ProductsPageClient initialProducts={activeProducts} />
    </>
  )
}
