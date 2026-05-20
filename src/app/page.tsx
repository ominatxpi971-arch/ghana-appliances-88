import type { Metadata } from "next"
import { SiteSettings, Product } from "@/lib/types"
export const revalidate = 3600

import { getSettings, getProducts } from "@/lib/db"
import Breadcrumbs from "@/components/Breadcrumbs"
import { LocalBusinessSchema } from "@/components/StructuredData"
import HomePageClient from "./HomePageClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: SiteSettings | null
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.seo_title || "Buy TVs, ACs, Fridges & More | COD"
  const description = settings?.seo_description || "Shop quality electrical appliances in Ghana. TVs, air conditioners, refrigerators, washing machines. Cash on delivery available."
  const keywords = settings?.seo_keywords || "electrical appliances ghana, buy tv accra, ac ghana, fridge ghana, washing machine accra, cod ghana, home appliances ghana"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/" },
    openGraph: {
      title: settings?.seo_title || "Ghana Appliances - Quality Electrical Appliances | COD",
      description,
      url: SITE_URL,
      siteName: "Ghana Appliances",
      type: "website",
      locale: "en_GH",
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title: settings?.seo_title || "Ghana Appliances - Quality Electrical Appliances | COD",
      description,
      images: [`${SITE_URL}/og-default.jpg`],
    },
    robots: { index: true, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default async function Home() {
  let settings: SiteSettings | null
  let products: Product[]
  try {
    settings = await getSettings()
    products = (await getProducts()).filter(p => p.active)
  } catch {
    settings = null
    products = []
  }

  return (<><Breadcrumbs items={[{ label: "Ghana Appliances" }]} /><LocalBusinessSchema settings={settings as any} /><HomePageClient settings={settings} products={products} /></>)
}