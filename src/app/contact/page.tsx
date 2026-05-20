import type { Metadata } from "next"
import { getSettings } from "@/lib/db"
import ContactPageClient from "./ContactPageClient"
import { BreadcrumbSchema } from "@/components/StructuredData"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.contact_title || "Contact Ghana Appliances - WhatsApp, Phone, Email"
  const description = settings?.contact_description || "Contact Ghana Appliances for inquiries, support, or orders."
  const keywords = settings?.contact_keywords || "contact ghana appliances, appliance store accra phone"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/contact" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/contact`,
      siteName: "Ghana Appliances",
      type: "website",
images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'Contact Ghana Appliances' }],
      locale: "en_GH",
    },
    robots: { index: true, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default function ContactPage() {
  return (
    <>
      <BreadcrumbSchema items={[{ name: "Home", url: "/" }, { name: "Contact", url: "/contact" }]} />
      <ContactPageClient />
    </>
  )
}
