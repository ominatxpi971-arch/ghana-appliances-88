import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order with cash on delivery. Fill in your delivery details and we will bring your appliances to your doorstep.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/checkout" },
  openGraph: {
    title: "Checkout | Ghana Appliances",
    description: "Complete your order with cash on delivery. Fill in your delivery details.",
    url: `${SITE_URL}/checkout`,
    siteName: "Ghana Appliances",
    type: "website",
    locale: "en_GH",
  },
  robots: { index: false, follow: false },
}

export default function CheckoutLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}