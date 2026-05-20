import type { Metadata } from "next"

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export const metadata: Metadata = {
  title: "Track Your Order | Ghana Appliances",
  description: "Track your appliance order status with your order ID and phone number. Real-time delivery tracking across Ghana.",
  robots: { index: false, follow: true },
  alternates: { canonical: "/track" },
}

export default function TrackLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>
}