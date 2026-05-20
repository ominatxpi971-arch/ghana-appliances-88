"use client"

import { useEffect, useRef } from "react"
import { usePathname, useSearchParams } from "next/navigation"

function fbq(event: string, ...args: unknown[]) {
  const f = (window as Window & { fbq?: (...args: unknown[]) => void }).fbq
  if (typeof f !== 'function') return
  try { f(event, ...args) } catch { /* prevent pixel errors from crashing the app */ }
}

// Strip undefined/null values so Facebook always sees real data
function cleanParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
}

// Track PageView on route change
export function MetaPixelRouter() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    fbq("track", "PageView")
  }, [pathname])

  return null
}

// E-commerce helper events (value & currency guaranteed clean)
export const MetaPixel = {
  pageView() { fbq("track", "PageView") },

  viewContent(params: {
    content_ids?: string[]
    content_name?: string
    content_category?: string
    content_type?: string
    value?: number
    currency?: string
  }) {
    fbq("track", "ViewContent", cleanParams({
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_category: params.content_category,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
    }))
  },

  addToCart(params: {
    content_ids?: string[]
    content_name?: string
    content_type?: string
    value?: number
    currency?: string
    num_items?: number
  }) {
    fbq("track", "AddToCart", cleanParams({
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
      num_items: params.num_items,
    }))
  },

  initiateCheckout(params: {
    content_ids?: string[]
    contents?: { id: string; quantity: number }[]
    content_type?: string
    num_items?: number
    value?: number
    currency?: string
  }) {
    fbq("track", "InitiateCheckout", cleanParams({
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type || "product",
      num_items: params.num_items,
      value: params.value,
      currency: params.currency || "GHS",
    }))
  },

  purchase(params: {
    content_ids?: string[]
    contents?: { id: string; quantity: number }[]
    num_items?: number
    value: number
    currency?: string
    order_id?: string
  }) {
    fbq("track", "Purchase", cleanParams({
      content_ids: params.content_ids,
      contents: params.contents,
      num_items: params.num_items,
      value: params.value,
      currency: params.currency || "GHS",
      order_id: params.order_id,
    }))
  },

  search(params: { search_string?: string }) {
    fbq("track", "Search", params)
  },

  contact() {
    fbq("track", "Contact")
  },

  addToWishlist(params: {
    content_id?: string
    content_name?: string
    content_category?: string
    value?: number
    currency?: string
  }) {
    fbq("track", "AddToWishlist", cleanParams({
      content_id: params.content_id,
      content_name: params.content_name,
      content_category: params.content_category,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GHS",
    }))
  },
}