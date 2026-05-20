
import Link from "next/link"

import type { Metadata } from "next"
import { getSettings } from "@/lib/db"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: any
  try { settings = await getSettings() } catch { settings = null }
  const title = settings?.privacy_title || "Privacy Policy | Ghana Appliances"
  const description = settings?.privacy_description || "Privacy policy for Ghana Appliances. How we collect, use, and protect your personal information."
  const keywords = settings?.privacy_keywords || "privacy policy, data protection ghana"
  return {
    title,
    description,
    metadataBase: new URL(SITE_URL),
    alternates: { canonical: "/privacy" },
    openGraph: {
      title,
      description,
      url: `${SITE_URL}/privacy`,
      siteName: "Ghana Appliances",
      type: "website",
      locale: "en_GH",
    },
    robots: { index: false, follow: true },
    keywords: keywords.split(",").map((k: string) => k.trim()),
  }
}

export default function PrivacyPage() {
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl prose prose-gray">
      <h1>Privacy Policy</h1>
      <p>Last updated: 2026</p>
      <h2>Information We Collect</h2>
      <p>When you place an order, we collect your name, phone number, and delivery address solely for the purpose of processing and delivering your order.</p>
      <h2>How We Use Your Information</h2>
      <p>Your information is used exclusively to: process your order, contact you regarding delivery, and provide customer support. We do not sell or share your data with third parties.</p>
      <h2>Data Security</h2>
      <p>We implement appropriate security measures to protect your personal information. However, no method of transmission over the internet is 100% secure.</p>
      <h2>Contact</h2>
      <p>For privacy concerns, contact us at <Link href="/contact">our contact page</Link>.</p>
    </div>
  )
}
