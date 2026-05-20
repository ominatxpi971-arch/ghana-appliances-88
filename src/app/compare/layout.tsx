import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "Compare Products",
  description: "Compare home appliances side by side. TVs, air conditioners, refrigerators, washing machines. Find the best product for your needs.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/compare" },
  openGraph: {
    title: "Compare Products | Ghana Appliances",
    description: "Compare home appliances side by side. Find the best product for your needs.",
    url: `${SITE_URL}/compare`,
    siteName: "Ghana Appliances",
    type: "website",
    locale: "en_GH",
  },
  robots: { index: false, follow: true },
  keywords: ["compare appliances ghana", "product comparison", "TV comparison", "fridge comparison"],
}

export default function CompareLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}