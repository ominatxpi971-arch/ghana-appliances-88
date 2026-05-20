
"use client"

import { useState, useEffect, useCallback } from "react"
import { MetaPixel } from "@/lib/pixel"

const KEY = "ghana-wishlist"

function load(): string[] {
  if (typeof window === "undefined") return []
  try { return JSON.parse(localStorage.getItem(KEY) || "[]") } catch { return [] }
}

function save(ids: string[]) {
  localStorage.setItem(KEY, JSON.stringify(ids))
  window.dispatchEvent(new Event("wishlist-updated"))
}

export function useWishlist() {
  const [ids, setIds] = useState<string[]>([])

  useEffect(() => {
    setIds(load())
    const handler = () => setIds(load())
    window.addEventListener("wishlist-updated", handler)
    return () => window.removeEventListener("wishlist-updated", handler)
  }, [])

  const toggle = useCallback((id: string) => {
    const current = load()
    const next = current.includes(id) ? current.filter(i => i !== id) : [...current, id]
    save(next)
    if (!current.includes(id)) {
      try { MetaPixel.addToWishlist({ content_id: id }) } catch (_) {}
    }
  }, [])

  const isWishlisted = useCallback((id: string) => ids.includes(id), [ids])

  return { ids, toggle, isWishlisted }
}
