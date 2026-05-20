'use client'

import { useState, useEffect, useCallback } from 'react'
import { CartItem, Product } from '@/lib/types'
import { MetaPixel } from '@/lib/pixel'
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

export function useCart() {
  const { trackEvent } = useAnalytics()
  const [items, setItems] = useState<CartItem[]>([])
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setItems(loadCart())
    setMounted(true)
    const handler = () => setItems(loadCart())
    window.addEventListener('cart-updated', handler)
    return () => window.removeEventListener('cart-updated', handler)
  }, [])

  const addItem = useCallback((product: Product, quantity = 1) => {
    const current = loadCart()
    const idx = current.findIndex(i => i.product.id === product.id)
    if (idx >= 0) {
      current[idx].quantity += quantity
    } else {
      current.push({ product, quantity })
    }
    saveCart(current)

    // Meta Pixel: AddToCart event
    if (product.price_ghs > 0 && quantity > 0) {
      trackEvent("add_to_cart", product.slug)
      MetaPixel.addToCart({
        content_ids: [product.id],
        content_name: product.name,
        content_type: "product",
        value: product.price_ghs * quantity,
        currency: "GHS",
        num_items: quantity,
      })
    }
  }, [])

  const removeItem = useCallback((productId: string) => {
    saveCart(loadCart().filter(i => i.product.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    if (quantity < 1) {
      removeItem(productId)
      return
    }
    const current = loadCart()
    const idx = current.findIndex(i => i.product.id === productId)
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
  const total = items.reduce((sum, i) => sum + i.product.price_ghs * i.quantity, 0)

  return { items, itemCount, total, addItem, removeItem, updateQuantity, clearCart, mounted }
}
