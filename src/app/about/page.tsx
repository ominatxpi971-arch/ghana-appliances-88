import { ShieldCheck, Truck, Users, Award } from 'lucide-react'

import type { Metadata } from "next"
import { getSettings } from "@/lib/db"
import Breadcrumbs from "@/components/Breadcrumbs"
import { BreadcrumbSchema, AboutPageSchema } from "@/components/StructuredData"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.about_title || "About Ghana Appliances - Quality Home Appliances in Accra"
  const description = settings?.about_description || "Learn about Ghana Appliances. We deliver quality TVs, ACs, fridges, washers across Ghana with COD."
  const keywords = settings?.about_keywords || "about ghana appliances, appliance store accra, electrical shop ghana"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/about" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/about`,
      siteName: "Ghana Appliances",
      type: "website",
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'About Ghana Appliances' }],
      locale: "en_GH",
    },
    robots: { index: true, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default function AboutPage() {
  return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "About Us" }]} />
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "About", url: "/about" }]} />
      <AboutPageSchema settings={{}} />
      <article className="container mx-auto px-4 py-12 max-w-4xl">
        <h1 className="text-3xl font-bold mb-6">About Ghana Appliances</h1>

        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-lg text-gray-600">
            Ghana Appliances is your trusted source for quality electrical appliances in Ghana. We bring the best brands directly to your doorstep with our hassle-free cash-on-delivery service.
          </p>

          <div className="grid sm:grid-cols-2 gap-6 mt-10">
            <div className="bg-white border rounded-xl p-6">
              <Truck className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-semibold mb-2">Nationwide Delivery</h3>
              <p className="text-sm text-gray-500">We deliver to all major cities and towns across Ghana. Fast and reliable shipping.</p>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <ShieldCheck className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-semibold mb-2">Cash on Delivery</h3>
              <p className="text-sm text-gray-500">Pay only when you receive your product. No upfront payment needed.</p>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <Award className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-semibold mb-2">Genuine Products</h3>
              <p className="text-sm text-gray-500">All our products are 100% authentic with manufacturer warranty. No counterfeits.</p>
            </div>
            <div className="bg-white border rounded-xl p-6">
              <Users className="h-8 w-8 text-amber-500 mb-3" />
              <h3 className="font-semibold mb-2">Customer First</h3>
              <p className="text-sm text-gray-500">Our team is dedicated to providing excellent service before and after your purchase.</p>
            </div>
          </div>

          <h2 className="text-2xl font-bold mt-10">Our Mission</h2>
          <p className="text-gray-600">
            To make quality home appliances accessible and affordable to every Ghanaian household. We believe everyone deserves reliable appliances without the hassle of upfront payments.
          </p>
        </div>
      </article>
    </>
  )
}
