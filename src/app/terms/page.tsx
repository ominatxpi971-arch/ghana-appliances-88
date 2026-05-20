
import Link from "next/link"

import type { Metadata } from "next"
import { getSettings } from "@/lib/db"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.terms_title || "Terms & Conditions | Ghana Appliances"
  const description = settings?.terms_description || "Terms and conditions for using Ghana Appliances website and purchasing products."
  const keywords = settings?.terms_keywords || "terms and conditions, ghana appliances terms, cod terms ghana"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/terms" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/terms`,
      siteName: "Ghana Appliances",
      type: "website",
      locale: "en_GH",
    },
    robots: { index: false, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default function TermsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-gray">
      <h1>Terms & Conditions</h1>
      <p>By placing an order with Ghana Appliances, you agree to the following terms.</p>
      <h2>Orders & Payment</h2>
      <p>All orders are Cash on Delivery. You agree to pay the full amount upon delivery. We reserve the right to cancel orders at our discretion.</p>
      <h2>Delivery</h2>
      <p>Delivery times are estimates. We are not liable for delays beyond our control. Please ensure someone is available to receive and pay for the delivery.</p>
      <h2>Returns</h2>
      <p>See our <Link href="/returns">Returns Policy</Link> for details on returns and exchanges.</p>
    </div>
  )
}
