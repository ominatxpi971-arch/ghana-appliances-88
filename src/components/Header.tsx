"use client"

import { useState, useEffect } from "react"
import { formatPrice } from "@/lib/utils"
import Link from "next/link"
import NextImage from "next/image"
import { ShoppingCart, Menu, X, MapPin, User, Home, Package, Search, Zap, Info, Phone } from "lucide-react"
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

function itemUnitPrice(item: ReturnType<typeof useCartContext>["items"][number]): number {
  if (item.variant?.price_ghs && item.variant.price_ghs > 0) return item.variant.price_ghs
  return item.product.price_ghs
}

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
  const codLabel = settings?.cod_label || "Cash on Delivery"

  return (
    <header className="fixed top-0 left-0 right-0 z-[100] w-full max-w-full border-b bg-white/95 backdrop-blur overflow-x-hidden" role="banner">
      <meta itemProp="name" content="Ghana Appliances" />

      {/* COD Announcement Bar */}
      <div className="bg-amber-500 text-white text-sm py-1.5 px-4 text-center overflow-x-hidden whitespace-normal break-words">
        <span className="font-medium">{codLabel}</span> - Pay when you receive your order!
      </div>

      <div className="container mx-auto flex h-16 items-center justify-between px-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 font-bold text-xl text-gray-900 shrink-0" aria-label="Ghana Appliances Home">
          <Zap className="h-6 w-6 text-amber-500 flex-shrink-0" />
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
                <div className="fixed right-4 top-[7.5rem] w-[360px] md:w-[420px] bg-white border rounded-xl shadow-2xl z-[200] max-h-[70vh] flex flex-col">
                  <div className="p-4 border-b font-semibold text-base flex items-center justify-between shrink-0">
                    <span>Shopping Cart ({itemCount} items)</span>
                    <button onClick={() => setCartOpen(false)} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
                  </div>
                  {items.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center text-gray-400 p-12">
                      <div className="text-center">
                        <ShoppingCart className="h-14 w-14 mx-auto mb-3 opacity-50" />
                        <p className="text-base">Your cart is empty</p>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex-1 overflow-y-auto py-3 px-4">
                        {items.map(item => {
                          const price = itemUnitPrice(item)
                          return (
                          <div key={item.product.id + "-" + (item.variant_id || "no-variant")} className="flex gap-4 py-4 border-b last:border-b-0">
                            <div className="h-20 w-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden relative">
                              {item.product.images?.[0]
                                ? <NextImage src={item.product.images[0]} alt={item.product.name} fill sizes="80px" className="object-cover" />
                                : <span className="h-full w-full flex items-center justify-center text-3xl">📦</span>
                              }
                            </div>
                            <div className="flex-1 min-w-0 flex flex-col justify-between">
                              <div>
                                <p className="text-sm font-medium leading-snug line-clamp-2">{item.product.name}</p>
                                {item.variant && (
                                  <p className="text-xs text-gray-400 mt-0.5">{item.variant.name}{item.variant.sku ? ` (${item.variant.sku})` : ""}</p>
                                )}
                              </div>
                              <div className="flex items-center justify-between mt-1">
                                <p className="text-sm text-amber-600 font-bold">{formatPrice(price)}</p>
                                <div className="flex items-center gap-2">
                                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1, item.variant_id)} className="h-7 w-7 rounded border text-sm hover:bg-gray-100 flex items-center justify-center">−</button>
                                  <span className="text-sm w-5 text-center font-medium">{item.quantity}</span>
                                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1, item.variant_id)} className="h-7 w-7 rounded border text-sm hover:bg-gray-100 flex items-center justify-center">+</button>
                                </div>
                              </div>
                            </div>
                            <button onClick={() => removeItem(item.product.id, item.variant_id)} className="text-gray-400 hover:text-red-500 self-start mt-1 flex-shrink-0">
                              <X className="h-4 w-4" />
                            </button>
                          </div>
                          )
                        })}
                      </div>
                      <Separator />
                      <div className="p-4 space-y-3 shrink-0">
                        <div className="flex justify-between text-base font-bold">
                          <span>Total</span>
                          <span className="text-amber-600">{formatPrice(total)}</span>
                        </div>
                        <Link href="/checkout" onClick={() => setCartOpen(false)}
                          className="inline-flex items-center justify-center w-full rounded-lg text-sm font-semibold bg-amber-500 text-white hover:bg-amber-600 h-11 px-4 transition-colors">
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
                  {link.label === "Home" && <Home className="h-4 w-4" />}
                  {link.label === "Products" && <Package className="h-4 w-4" />}
                  {link.label === "Track Order" && <MapPin className="h-4 w-4" />}
                  {link.label === "About" && <Info className="h-4 w-4" />}
                  {link.label === "Contact" && <Phone className="h-4 w-4" />}
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

          </div>
        </div>
      )}
    </header>
  )
}

