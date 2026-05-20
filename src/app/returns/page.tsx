
import Link from "next/link"

import type { Metadata } from "next"
import { getSettings } from "@/lib/db"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.returns_title || "Returns & Refund Policy | Ghana Appliances"
  const description = settings?.returns_description || "Our 7-day return and refund policy for home appliances. Easy returns across Ghana."
  const keywords = settings?.returns_keywords || "returns policy ghana, appliance refund ghana, 7 day return accra"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/returns" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/returns`,
      siteName: "Ghana Appliances",
      type: "website",
      locale: "en_GH",
    },
    robots: { index: false, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default function ReturnsPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-gray">
      <h1>Returns & Refund Policy</h1>
      <h2>7-Day Return Policy</h2>
      <p>You may return most new, unopened items within 7 days of delivery for a full refund or exchange.</p>
      <h2>Conditions</h2>
      <ul><li>Item must be in original packaging</li><li>All accessories and manuals included</li><li>Proof of purchase required</li></ul>
      <h2>Defective Products</h2>
      <p>If you receive a defective product, contact us immediately. We will arrange a replacement or refund at no cost to you.</p>
      <h2>How to Return</h2>
      <p>Contact our customer service via <Link href="/contact">phone or WhatsApp</Link> to initiate a return.</p>
    </div>
  )
}
