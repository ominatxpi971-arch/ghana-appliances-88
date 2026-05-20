"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import { Phone, Mail, MapPin } from "lucide-react"
import type { SiteSettings } from "@/lib/types"

const SOCIAL_ICONS: Record<string, string> = {
  facebook_url: "📘",
  instagram_url: "📷",
  twitter_url: "🐦",
  youtube_url: "▶️",
}

const SOCIAL_LABELS: Record<string, string> = {
  facebook_url: "Facebook",
  instagram_url: "Instagram",
  twitter_url: "Twitter / X",
  youtube_url: "YouTube",
}

export default function Footer() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})
  useEffect(() => { fetch("/api/settings").then(r => r.json()).then(setSettings).catch(() => {}) }, [])

  const siteName = settings?.site_name || "Ghana Appliances"
  const phone = settings?.phone || "+233501234567"
  const email = settings?.email || "info@ghanaappliance.cc"
  const address = settings?.address || "Accra, Ghana"

  const socials = (["facebook_url", "instagram_url", "twitter_url", "youtube_url"] as const)
    .filter(key => settings?.[key])
    .map(key => ({ key, url: settings[key]! }))

  return (
    <footer className="bg-gray-900 text-gray-300 mt-auto" itemScope itemType="https://schema.org/Organization">
      <meta itemProp="name" content={siteName} />
      <meta itemProp="url" content="https://ghanaappliance.cc" />

      <div className="container mx-auto px-4 py-12 grid grid-cols-2 lg:grid-cols-5 gap-8">
        <div className="col-span-2 lg:col-span-1">
          <div className="text-white font-bold text-lg mb-3">{siteName}</div>
          <p className="text-sm">{settings?.footer_about || "Quality electrical appliances delivered to your doorstep."}</p>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Shop</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/products" className="hover:text-amber-400">All Products</Link></li>
            <li><Link href="/products?category=televisions" className="hover:text-amber-400">Televisions</Link></li>
            <li><Link href="/products?category=air-conditioners" className="hover:text-amber-400">Air Conditioners</Link></li>
            <li><Link href="/products?category=refrigerators" className="hover:text-amber-400">Refrigerators</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Support</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/track" className="hover:text-amber-400">Track Order</Link></li>
            <li><Link href="/contact" className="hover:text-amber-400">Contact Us</Link></li>
            <li><Link href="/faq" className="hover:text-amber-400">FAQ</Link></li>
            <li><Link href="/about" className="hover:text-amber-400">About Us</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Policies</h4>
          <ul className="space-y-2 text-sm">
            <li><Link href="/returns" className="hover:text-amber-400">Returns Policy</Link></li>
            <li><Link href="/privacy" className="hover:text-amber-400">Privacy Policy</Link></li>
            <li><Link href="/terms" className="hover:text-amber-400">Terms & Conditions</Link></li>
          </ul>
        </div>
        <div>
          <h4 className="text-white font-semibold mb-3">Contact</h4>
          <ul className="space-y-2 text-sm">
            <li className="flex items-center gap-2">
              <Phone className="h-4 w-4" />
              <a href={`tel:${phone.replace(/\s/g, "")}`} className="hover:text-amber-400" itemProp="telephone">{phone}</a>
            </li>
            <li className="flex items-center gap-2">
              <Mail className="h-4 w-4" />
              <a href={`mailto:${email}`} className="hover:text-amber-400" itemProp="email">{email}</a>
            </li>
            <li className="flex items-center gap-2">
              <MapPin className="h-4 w-4 flex-shrink-0" />
              <address className="not-italic" itemProp="address">{address}</address>
            </li>
          </ul>

          {socials.length > 0 && (
            <>
              <h4 className="text-white font-semibold mt-5 mb-3">Follow Us</h4>
              <div className="flex gap-3">
                {socials.map(({ key, url }) => (
                  <a
                    key={key}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="h-9 w-9 rounded-full bg-gray-800 flex items-center justify-center hover:bg-amber-500 hover:text-white transition-colors text-lg"
                    aria-label={SOCIAL_LABELS[key]}
                  >
                    {SOCIAL_ICONS[key]}
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </div>
      <div className="border-t border-gray-800 text-center py-4 text-sm text-gray-500">
        &copy; {new Date().getFullYear()} {siteName}. {settings?.footer_cod_text || "COD available nationwide."}
      </div>
    </footer>
  )
}
