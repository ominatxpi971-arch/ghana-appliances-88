import type { Metadata } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { CompareProvider } from "@/hooks/use-compare"
import { CartProvider } from "@/components/shop/cart-context";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import WhatsAppFloat from "@/components/WhatsAppFloat";
import MobileNav from "@/components/MobileNav"
import { AuthProvider } from "@/components/shop/auth-context"
import AnalyticsProvider from "@/components/shop/analytics-provider"
import CookieConsent from "@/components/CookieConsent";
import TrackingScripts from "@/components/TrackingScripts";
import { OrganizationSchema, WebSiteSchema, LocalBusinessSchema } from "@/components/StructuredData";
import { Suspense } from "react"
import { MetaPixelRouter, TikTokPixelRouter } from "@/lib/pixel";
import { SiteSettings } from "@/lib/types";
import { getSettings } from "@/lib/db";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"], display: "swap", fallback: ["system-ui", "-apple-system", "BlinkMacSystemFont", "Segoe UI", "Roboto", "sans-serif"] });

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://ghanaappliance.cc"

export async function generateMetadata(): Promise<Metadata> {
  let settings: SiteSettings | null;
  try { settings = await getSettings(); } catch { settings = null }
  const title = settings?.seo_title || "Ghana Appliances - Quality Electrical Appliances | COD"
  const description = settings?.seo_description || "Buy TVs, ACs, fridges, washers and more in Ghana. COD available."
  const keywords = settings?.seo_keywords || "electrical appliances ghana, cod, tv, ac, fridge"
  
  return {
    title: { default: title, template: `%s | ${settings?.site_name || "Ghana Appliances"}` },
    description,
    keywords,
    metadataBase: new URL(SITE_URL),
    alternates: { languages: { 'en-GH': SITE_URL, 'x-default': SITE_URL } },
    applicationName: settings?.site_name || 'Ghana Appliances',
    category: 'shopping',
    manifest: '/manifest.json',
    authors: [{ name: 'Ghana Appliances' }],
    creator: 'Ghana Appliances',
    publisher: 'Ghana Appliances',
    openGraph: {
      title,
      description,
      url: SITE_URL,
      siteName: settings?.site_name || "Ghana Appliances",
      type: "website",
      locale: "en_GH",
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [{ url: `${SITE_URL}/og-default.jpg`, width: 1200, height: 630, alt: title }],
    },
    robots: { index: true, follow: true },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION || '',
    },
    other: {
      'geo.region': 'GH-AA',
      'geo.placename': 'Accra',
      'geo.position': '5.6037;-0.1870',
      'ICBM': '5.6037, -0.1870',
    },
  };
}

export const viewport = { width: 'device-width' as const, initialScale: 1, maximumScale: 5, viewportFit: 'cover' as const, themeColor: '#f59e0b' }

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  let settings: SiteSettings | null;
  try { settings = await getSettings(); } catch { settings = null }
  
  return (
    <html lang="en" className={`${geistSans.variable} h-full antialiased max-w-full overflow-x-hidden`}>
      <head>
        <TrackingScripts />
        <OrganizationSchema settings={settings as any} />
        <WebSiteSchema settings={settings as any} />
        <LocalBusinessSchema settings={settings as any} />

        <link rel="preconnect" href="https://henhsucxsfijzxzcbzrh.supabase.co" />
        <link rel="dns-prefetch" href="https://henhsucxsfijzxzcbzrh.supabase.co" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link rel="manifest" href="/manifest.json" />
        <meta name="geo.region" content="GH-AA" />
        <meta name="geo.placename" content="Accra" />
        <meta name="geo.position" content="5.6037;-0.1870" />
        <meta name="ICBM" content="5.6037, -0.1870" />
        <meta name="theme-color" content="#f59e0b" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-title" content="Ghana Appliances" />
      </head>
      <body className="min-h-full flex flex-col max-w-full overflow-x-hidden">
        <AuthProvider><CompareProvider><CartProvider>
          <Header />
          <main className="flex-1 pt-[calc(2rem+4rem)] pb-16 md:pb-0 safe-area-top safe-area-bottom">{children}</main>
          <Footer />
          <WhatsAppFloat />
          <MobileNav />
          <Toaster position="top-center" richColors /><AnalyticsProvider /><Suspense fallback={null}><MetaPixelRouter /><TikTokPixelRouter /></Suspense><CookieConsent /></CartProvider></CompareProvider></AuthProvider>
      </body>
    </html>
  );
}
