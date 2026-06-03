'use client'

import { useState, useEffect, useCallback, useRef } from 'react'
import { CartItem, Product, ProductVariant } from '@/lib/types'
import { MetaPixel, TikTokPixel } from '@/lib/pixel'
import { useAnalytics } from '@/hooks/use-analytics'

const CART_KEY = 'ghana-appliances-cart'

function loadCart(): CartItem[] {
  if (typeof window === 'undefined') return []
  try {
    const raw = localStorage.getItem(CART_KEY)
    return raw ? JSON.parse(raw) : []
  } catch {
    return []
  }
}

function saveCart(items: CartItem[]) {
  localStorage.setItem(CART_KEY, JSON.stringify(items))
  window.dispatchEvent(new Event('cart-updated'))
}

/** Return the effective unit price for a cart item (variant price if present, otherwise product price). */
function unitPrice(item: CartItem): number {
  if (item.variant?.price_ghs && item.variant.price_ghs > 0) return item.variant.price_ghs
  return item.product.price_ghs
}

/** Match two cart items by product ID and variant ID (both may be undefined). */
function itemMatch(a: CartItem, b: { productId: string; variantId?: string }): boolean {
  return a.product.id === b.productId && (a.variant_id || undefined) === b.variantId
}

export function useCart() {
  const { trackEvent } = useAnalytics()
  // Stable ref so addItem never re-creates due to analytics
  const trackEventRef = useRef(trackEvent)
  trackEventRef.current = trackEvent

  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setMounted(true)
    const handler = () => setItems(loadCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const addItem = useCallback((product: Product, quantity = 1, variant?: ProductVariant) => {
    const current = loadCart()
    const variantId = variant?.id || undefined
    // Match by product ID AND variant ID (or lack thereof)
    const idx = current.findIndex(i =>
      i.product.id === product.id &&
      (i.variant_id || undefined) === variantId
    )
    if (idx >= 0) {
      current[idx].quantity += quantity
    } else {
      current.push({ product, quantity, variant_id: variantId, variant: variant || undefined })
    }
    saveCart(current)

    const effectivePrice = variant?.price_ghs && variant.price_ghs > 0 ? variant.price_ghs : product.price_ghs
    if (effectivePrice > 0 && quantity > 0) {
      // Analytics and pixel calls are fire-and-forget — never block cart operations
      try { trackEventRef.current("add_to_cart", product.slug) } catch (_) {}
      try {
        MetaPixel.addToCart({
          content_ids: [product.id],
          content_name: product.name,
          content_type: "product",
          value: effectivePrice * quantity,
          currency: "GHS",
          num_items: quantity,
        })
      } catch (_) {}
      try {
        TikTokPixel.addToCart({
          content_id: product.id,
          content_name: product.name,
          value: effectivePrice * quantity,
          currency: "GHS",
          quantity,
        })
      } catch (_) {}
    }
  }, []) // stable — never re-creates due to analytics changes

  const removeItem = useCallback((productId: string, variantId?: string) => {
    saveCart(loadCart().filter(i => !itemMatch(i, { productId, variantId })))
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
      saveCart(current)
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
