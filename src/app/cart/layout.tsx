import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "Shopping Cart",
  description: "Review your cart and proceed to checkout. Cash on delivery available across Ghana.",
  metadataBase: new URL(SITE_URL),
  alternates: { canonical: "/cart" },
  openGraph: {
    title: "Shopping Cart | Ghana Appliances",
    description: "Review your cart and proceed to checkout. Cash on delivery available across Ghana.",
    url: `${SITE_URL}/cart`,
    siteName: "Ghana Appliances",
    type: "website",
    locale: "en_GH",
  },
  robots: { index: false, follow: true },
}

export default function CartLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}