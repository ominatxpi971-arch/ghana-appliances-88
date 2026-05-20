"use client"

import { useState, useEffect } from "react"
import { formatPrice } from "@/lib/utils"
import Link from 'next/link'
import NextImage from 'next/image'
import { ShoppingCart, Menu, X, MapPin, User, Home, Package, Search, Phone } from "lucide-react"
import { useAuth } from "@/components/shop/auth-context"
import { Button } from "@/components/ui/button"
import { useCartContext } from "@/components/shop/cart-context"
import { Separator } from "@/components/ui/separator"
import type { SiteSettings } from "@/lib/types"

const NAV_LINKS = [
  { href: "/", label: "Home" },
  { href: "/products", label: "Products" },
  { href: "/track", label: "Track Order" },
  { href: "/about", label: "About" },
  { href: "/contact", label: "Contact" },
]

export default function Header() {
  const { user: authUser } = useAuth()
  const { items, itemCount, total, removeItem, updateQuantity } = useCartContext()
  const [mobileOpen, setMobileOpen] = useState(false)
  const [cartOpen, setCartOpen] = useState(false)
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const siteName = settings?.site_name || "Ghana Appliances"
  const phone = settings?.phone || "+233501234567"
  const codLabel = settings?.cod_label || "Cash on Delivery"

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-white/95 backdrop-blur" role="banner">
      <meta itemProp="name" content="Ghana Appliances" />

      {/* COD Announcement Bar */}
      <div className="bg-amber-500 text-white text-sm py-1.5 px-4 text-center">
        <span className="font-medium">{codLabel}</span> - Pay when you receive your order! | Call/WhatsApp: {phone}
      </div>

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 shrink-0" aria-label="Ghana Appliances Home">
          <span className="text-amber-500 text-2xl">⚡</span>
          <span className="hidden sm:inline">{siteName}</span>
          <span className="sm:hidden">GA</span>
        </Link>

        {/* Desktop Nav */}
        <nav className="hidden md:flex items-center gap-5" aria-label="Main navigation">
          {NAV_LINKS.map(link => (
            <Link key={link.href} href={link.href} className="text-sm font-medium text-gray-600 hover:text-amber-600 transition-colors">
              {link.label}
            </Link>
          ))}
          <Link href="/track" className="text-xs text-amber-600 border border-amber-300 rounded-full px-3 py-0.5 hover:bg-amber-50 font-medium flex items-center gap-1">
            <MapPin className="h-3 w-3" /> Track
          </Link>
        </nav>

        {/* Right side icons */}
        <div className="flex items-center gap-2">
          {/* Cart Dropdown */}
          <div className="relative">
            <Button variant="ghost" size="icon" className="relative" onClick={() => setCartOpen(!cartOpen)}>
              <ShoppingCart className="h-5 w-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-amber-500 text-white text-xs flex items-center justify-center font-bold">{itemCount}</span>
              )}
            </Button>
            {cartOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setCartOpen(false)} />
                <div className="absolute right-0 top-full mt-2 w-96 bg-white border rounded-xl shadow-2xl z-50 max-h-[80vh] flex flex-col">
                  <div className="p-4 border-b font-semibold flex items-center justify-between">
                    <span>Shopping Cart ({itemCount} items)</span>
                    <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600 text-lg">&times;</button>
                  </div>
                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 p-12">
                      <div className="text-center">
                        <ShoppingCart className="h-12 w-12 mx-auto mb-3 opacity-50" />
                        <p>Your cart is empty</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-auto py-4 px-4">
                        {items.map(item => (
                          <div key={item.product.id} className="flex gap-3 py-3 border-b last:border-b-0">
                            <div className="h-16 w-16 bg-gray-100 rounded flex-shrink-0 overflow-hidden relative">
                              {item.product.images?.[0]
                                ? <NextImage src={item.product.images[0]} alt={item.product.name} fill sizes="64px" className="object-cover" />
                                : <span className="h-full w-full flex items-center justify-center text-2xl">📦</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{item.product.name}</p>
                              <p className="text-sm text-amber-600 font-bold">{formatPrice(item.product.price_ghs ?? 0)}</p>
                              <div className="flex items-center gap-2 mt-1">
                                <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="h-6 w-6 rounded border text-xs hover:bg-gray-100">-</button>
                                <span className="text-sm w-6 text-center">{item.quantity}</span>
                                <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="h-6 w-6 rounded border text-xs hover:bg-gray-100">+</button>
                              </div>
                            </div>
                            <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                        ))}
                      </div>
                      <Separator />
                      <div className="p-4 space-y-3">
                        <div className="flex justify-between text-lg font-bold">
                          <span>Total</span>
                          <span className="text-amber-600">{formatPrice(total)}</span>
                        </div>
                        <Link href="/checkout" onClick={() => setCartOpen(false)}
                          className="inline-flex items-center justify-center w-full rounded-lg text-sm font-medium bg-amber-500 text-white hover:bg-amber-600 h-10 px-4 transition-colors">
                          Proceed to Checkout
                        </Link>
                      </div>
                    </>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Desktop Sign In */}
          <Link href={authUser ? "/auth/account" : "/auth/login"}
            className="hidden md:flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mr-2">
            <User className="h-4 w-4" />{authUser ? "Account" : "Sign In"}
          </Link>

          {/* Mobile Menu Toggle */}
          <Button variant="ghost" size="icon" className="md:hidden" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Mobile Hamburger Menu */}
      {mobileOpen && (
        <div className="md:hidden border-t bg-white">
          <div className="px-2 py-3">
            {NAV_LINKS.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
                className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium text-gray-700 hover:bg-amber-50 hover:text-amber-700 transition-all"
              >
                <span className="w-8 h-8 rounded-lg bg-gray-100 flex items-center justify-center text-base">
                  {link.label === "Home" && "🏠"}
                  {link.label === "Products" && "📦"}
                  {link.label === "Track Order" && "🗺️"}
                  {link.label === "About" && "ℹ️"}
                  {link.label === "Contact" && "📞"}
                </span>
                {link.label}
              </Link>
            ))}
            <div className="mx-4 my-2 border-t border-gray-100"></div>
            <Link
              href={authUser ? "/auth/account" : "/auth/login"}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-semibold bg-amber-50 text-amber-700 hover:bg-amber-100 transition-all"
            >
              <span className="w-8 h-8 rounded-lg bg-amber-100 flex items-center justify-center">
                <User className="h-4 w-4 text-amber-600" />
              </span>
              {authUser ? "My Account" : "Sign In / Register"}
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-gray-500 hover:text-amber-600 transition-all"
            >
              <span className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
                <Phone className="h-4 w-4 text-green-500" />
              </span>
              Call/WhatsApp: {phone}
            </Link>
          </div>
        </div>
      )}
    </header>
  )
}
