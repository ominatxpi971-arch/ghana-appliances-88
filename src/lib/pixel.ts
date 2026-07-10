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

// Generate a unique event ID for browser/server deduplication
export function generatePixelEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
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
    eventID?: string
  }) {
    fbq("track", "ViewContent", cleanParams({
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_category: params.content_category,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
    }), params.eventID ? { eventID: params.eventID } : undefined)
  },

  addToCart(params: {
    content_ids?: string[]
    content_name?: string
    content_type?: string
    value?: number
    currency?: string
    num_items?: number
    eventID?: string
  }) {
    fbq("track", "AddToCart", cleanParams({
      content_ids: params.content_ids,
      content_name: params.content_name,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
      num_items: params.num_items,
    }), params.eventID ? { eventID: params.eventID } : undefined)
  },

  initiateCheckout(params: {
    content_ids?: string[]
    contents?: { id: string; quantity: number }[]
    content_type?: string
    num_items?: number
    value?: number
    currency?: string
    eventID?: string
  }) {
    fbq("track", "InitiateCheckout", cleanParams({
      content_ids: params.content_ids,
      contents: params.contents,
      content_type: params.content_type || "product",
      num_items: params.num_items,
      value: params.value,
      currency: params.currency || "GHS",
    }), params.eventID ? { eventID: params.eventID } : undefined)
  },

  purchase(params: {
    content_ids?: string[]
    contents?: { id: string; quantity: number }[]
    num_items?: number
    value: number
    currency?: string
    order_id?: string
    eventID?: string
  }) {
    fbq("track", "Purchase", cleanParams({
      content_ids: params.content_ids,
      contents: params.contents,
      num_items: params.num_items,
      value: params.value,
      currency: params.currency || "GHS",
      order_id: params.order_id,
    }), params.eventID ? { eventID: params.eventID } : undefined)
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
    eventID?: string
  }) {
    fbq("track", "AddToWishlist", cleanParams({
      content_id: params.content_id,
      content_name: params.content_name,
      content_category: params.content_category,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GHS",
    }), params.eventID ? { eventID: params.eventID } : undefined)
  },
}

// TikTok Pixel helpers
function ttq(event: string, ...args: unknown[]) {
  const t = (window as Window & { ttq?: (...args: unknown[]) => void }).ttq
  if (typeof t !== "function") return
  try { t(event, ...args) } catch { /* prevent pixel errors from crashing the app */ }
}

function cleanTikTokParams(params: Record<string, unknown>): Record<string, unknown> {
  return Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined && v !== null))
}

// Track PageView on route change for TikTok
export function TikTokPixelRouter() {
  const pathname = usePathname()
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    ttq("page")
  }, [pathname])

  return null
}

export const TikTokPixel = {
  pageView() { ttq("page") },

  viewContent(params: {
    content_id?: string
    content_name?: string
    content_category?: string
    value?: number
    currency?: string
  }) {
    ttq("track", "ViewContent", cleanTikTokParams({
      content_id: params.content_id,
      content_name: params.content_name,
      content_category: params.content_category,
      value: params.value,
      currency: params.currency || "GHS",
    }))
  },

  addToCart(params: {
    content_id?: string
    content_name?: string
    content_type?: string
    value?: number
    currency?: string
    quantity?: number
  }) {
    ttq("track", "AddToCart", cleanTikTokParams({
      content_id: params.content_id,
      content_name: params.content_name,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
      quantity: params.quantity,
    }))
  },

  initiateCheckout(params: {
    content_id?: string
    content_type?: string
    quantity?: number
    value?: number
    currency?: string
    description?: string
    contents?: { content_id: string; content_name?: string; quantity: number; price?: number }[]
  }) {
    ttq("track", "InitiateCheckout", cleanTikTokParams({
      content_id: params.content_id,
      content_type: params.content_type || "product",
      quantity: params.quantity,
      value: params.value,
      currency: params.currency || "GHS",
      description: params.description,
      contents: params.contents,
    }))
  },

  purchase(params: {
    content_id?: string
    content_type?: string
    value: number
    currency?: string
    order_id?: string
    quantity?: number
    description?: string
    contents?: { content_id: string; content_name?: string; quantity: number; price?: number }[]
  }) {
    ttq("track", "PlaceAnOrder", cleanTikTokParams({
      content_id: params.content_id,
      content_type: params.content_type || "product",
      value: params.value,
      currency: params.currency || "GHS",
      order_id: params.order_id,
      quantity: params.quantity,
      description: params.description,
      contents: params.contents,
    }))
  },

  search(params: { search_string?: string }) {
    ttq("track", "Search", params)
  },

  contact() {
    ttq("track", "Contact")
  },

  registration() {
    ttq("track", "CompleteRegistration")
  },

  submitForm(params: { form_name?: string }) {
    ttq("track", "SubmitForm", params)
  },

  addToWishlist(params: {
    content_id?: string
    content_name?: string
    content_category?: string
    value?: number
    currency?: string
  }) {
    ttq("track", "AddToWishlist", cleanTikTokParams({
      content_id: params.content_id,
      content_name: params.content_name,
      content_category: params.content_category,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GHS",
    }))
  },
}