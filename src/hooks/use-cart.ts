"use client"

import { useState, useEffect, useCallback, useRef } from "react"
import { CartItem, Product, ProductVariant } from "@/lib/types"
import { MetaPixel, TikTokPixel } from "@/lib/pixel"
import { useAnalytics } from "@/hooks/use-analytics"

const CART_KEY = "ghana-appliances-cart"

function loadCart(): CartItem[] {
  if (typeof window === "undefined") return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]): boolean {
  try {
    localStorage.setItem(CART_KEY, JSON.stringify(items))
    window.dispatchEvent(new Event("cart-updated"))
    return true
  } catch {
    return false
  }
}

function unitPrice(item: CartItem): number {
  if (item.variant?.price_ghs && item.variant.price_ghs > 0) return item.variant.price_ghs
  return item.product.price_ghs
}

function itemMatch(a: CartItem, b: { productId: string; variantId?: string }): boolean {
  return a.product.id === b.productId && (a.variant_id || undefined) === b.variantId
}

export function useCart() {
  const { trackEvent } = useAnalytics()
  const trackEventRef = useRef(trackEvent)
  trackEventRef.current = trackEvent

  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  // Load cart on mount + listen for cross-tab updates
  useEffect(() => {
    setItems(loadCart())
    setMounted(true)
    const handler = () => setItems(loadCart())
    window.addEventListener("cart-updated", handler)
    return () => window.removeEventListener("cart-updated", handler)
  }, [])

  const addItem = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    const current = loadCart()
    const variantId = variant?.id || undefined
    const idx = current.findIndex(i =>
      i.product.id === product.id &&
      (i.variant_id || undefined) === variantId
    )
    if (idx >= 0) {
      current[idx].quantity += quantity
    } else {
      current.push({ product, quantity, variant_id: variantId, variant: variant || undefined })
    }

    // Save to localStorage AND update React state directly (don't rely solely on event)
    const saved = saveCart(current)
    if (saved) setItems(current)

    // Analytics and pixel calls are fire-and-forget
    const effectivePrice = variant?.price_ghs && variant.price_ghs > 0 ? variant.price_ghs : product.price_ghs
    if (effectivePrice > 0 && quantity > 0) {
      try { trackEventRef.current("add_to_cart", product.slug) } catch (_) {}
      try { MetaPixel.addToCart({ content_ids: [product.id], content_name: product.name, content_type: "product", value: effectivePrice * quantity, currency: "GHS", num_items: quantity }) } catch (_) {}
      try { TikTokPixel.addToCart({ content_id: product.id, content_name: product.name, value: effectivePrice * quantity, currency: "GHS", quantity }) } catch (_) {}
    }
  }, [])

  const removeItem = useCallback((productId: string, variantId?: string) => {
    const next = loadCart().filter(i => !itemMatch(i, { productId, variantId }))
    const saved = saveCart(next)
    if (saved) setItems(next)
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number, variantId?: string) => {
    if (quantity < 1) {
      removeItem(productId, variantId)
      return
    }
    const current = loadCart()
    const idx = current.findIndex(i => itemMatch(i, { productId, variantId }))
    if (idx >= 0) {
      current[idx].quantity = quantity
      const saved = saveCart(current)
      if (saved) setItems(current)
    }
  }, [removeItem])

  const clearCart = useCallback(() => {
    setItems([])
    saveCart([])
  }, [])

  const itemCount = items.reduce((sum, i) => sum + i.quantity, 0)
  const total = items.reduce((sum, i) => sum + unitPrice(i) * i.quantity, 0)

  return { items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, mounted }
}
