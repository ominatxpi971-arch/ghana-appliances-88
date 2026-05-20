import type { Metadata } from "next"
import Breadcrumbs from "@/components/Breadcrumbs"
import { FAQSchema } from "@/components/StructuredData"
import { getSettings } from "@/lib/db"
import FAQPageClient from "./FAQPageClient"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.faq_title || "FAQ - Frequently Asked Questions | Ghana Appliances"
  const description = settings?.faq_description || "Frequently asked questions about ordering, delivery, payment, returns, and warranty."
  const keywords = settings?.faq_keywords || "ghana appliances faq, cod questions, delivery ghana, appliance warranty ghana"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/faq" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/faq`,
      siteName: "Ghana Appliances",
      type: "website",
images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: 'FAQ - Ghana Appliances' }],
      locale: "en_GH",
    },
    robots: { index: true, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}


const FAQS = [
  { question: "How does Cash on Delivery work?", answer: "You place your order online, we confirm it via phone/WhatsApp, deliver the product to your address, and you pay in cash when you receive it. No online payment required." },
  { question: "Which areas do you deliver to?", answer: "We deliver to all major cities and towns across Ghana including Accra, Kumasi, Tema, Takoradi, Tamale, and more. Contact us to confirm delivery to your specific location." },
  { question: "How long does delivery take?", answer: "Typical delivery time is 1-3 business days within Accra, and 3-7 business days for other regions. We will confirm the exact timeline when we call to verify your order." },
  { question: "Are your products genuine?", answer: "Yes! All our products are 100% authentic, sourced directly from authorized distributors. Every product comes with a manufacturer warranty." },
]
export default function FAQPage() {
    return (
    <>
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "FAQ" }]} /><FAQSchema faqs={FAQS} />
      <FAQPageClient />
    </>
  )
}
