
"use client"

import { useState, useEffect, useCallback } from "react"

const KEY = "ghana-recently-viewed"
const MAX = 10

interface RecentItem { id: string; slug: string; name: string; price: number; image: string }

export function useRecentlyViewed() {
  const [items, setItems] = useState<RecentItem[]>([])

  useEffect(() => {
    try { setItems(JSON.parse(localStorage.getItem(KEY) || "[]")) } catch {}
  }, [])

  const addView = useCallback((product: RecentItem) => {
    const current = JSON.parse(localStorage.getItem(KEY) || "[]")
    const filtered = current.filter((i: RecentItem) => i.id !== product.id)
    filtered.unshift(product)
    const trimmed = filtered.slice(0, MAX)
    localStorage.setItem(KEY, JSON.stringify(trimmed))
    setItems(trimmed)
  }, [])

  return { items, addView }
}
