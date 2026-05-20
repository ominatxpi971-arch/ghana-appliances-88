"use client"

import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from "react"
import { Product } from "@/lib/types"

interface CompareContextType {
  items: Product[]
  addToCompare: (product: Product) => void
  removeItem: (id: string) => void
  clearAll: () => void
  isInCompare: (id: string) => boolean
}

const CompareContext = createContext<CompareContextType>({
  items: [],
  addToCompare: () => {},
  removeItem: () => {},
  clearAll: () => {},
  isInCompare: () => false,
})

export function CompareProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<Product[]>([])

  useEffect(() => {
    try {
      const saved = localStorage.getItem("compare_items")
      if (saved) setItems(JSON.parse(saved))
    } catch {}
  }, [])

  useEffect(() => {
    localStorage.setItem("compare_items", JSON.stringify(items))
  }, [items])

  const addToCompare = useCallback((product: Product) => {
    setItems(prev => {
      if (prev.length >= 4) return prev
      if (prev.find(p => p.id === product.id)) return prev
      return [...prev, product]
    })
  }, [])

  const removeItem = useCallback((id: string) => {
    setItems(prev => prev.filter(p => p.id !== id))
  }, [])

  const clearAll = useCallback(() => setItems([]), [])
  const isInCompare = useCallback((id: string) => items.some(p => p.id === id), [items])

  return (
    <CompareContext.Provider value={{ items, addToCompare, removeItem, clearAll, isInCompare }}>
      {children}
    </CompareContext.Provider>
  )
}

export const useCompare = () => useContext(CompareContext)
