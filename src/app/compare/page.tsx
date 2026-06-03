"use client"

import { useCompare } from "@/hooks/use-compare"
import Link from "next/link"
import { X, ArrowLeft, GitCompare, ShoppingCart } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartContext } from "@/components/shop/cart-context"
import Breadcrumbs from "@/components/Breadcrumbs"

const SPEC_KEYS = [
  "Screen Size", "Resolution", "Smart TV", "Panel", "HDR",
  "Capacity", "Energy Rating", "Noise Level", "Power", "BTU",
  "Type", "Material", "Color", "Warranty",
]

export default function ComparePage() {
  const { items, removeItem, clearAll } = useCompare()
  const { addItem } = useCartContext()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-2xl text-center">
        <Breadcrumbs items={[{ label: "Compare" }]} />
        <div className="py-20">
          <GitCompare className="h-16 w-16 text-gray-300 mx-auto mb-4" />
          <h1 className="text-2xl font-bold mb-2">Compare Products</h1>
          <p className="text-gray-500 mb-6">Add products to compare their features side by side.</p>
          <Link href="/products" className="inline-flex items-center gap-2 bg-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-600">
            <ArrowLeft className="h-4 w-4" /> Browse Products
          </Link>
        </div>
      </div>
    )
  }

  // Only show spec keys that have values in at least one product
  const relevantKeys = SPEC_KEYS.filter(key =>
    items.some(p => (p.specs || {})[key])
  )

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Compare" }]} />

      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Compare Products</h1>
        <div className="flex gap-2">
          <Link href="/products" className="inline-flex items-center gap-1 text-sm text-amber-600 hover:underline">
            <ArrowLeft className="h-3 w-3" /> Add More
          </Link>
          <button onClick={clearAll} className="text-sm text-red-500 hover:underline">Clear All</button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className="text-left p-3 bg-gray-50 font-medium text-sm w-1/4 sm:w-40">Product</th>
              {items.map(p => (
                <th key={p.id} className="p-3 bg-gray-50 text-center flex-1 min-w-0">
                  <div className="relative">
                    <button onClick={() => removeItem(p.id)} className="absolute -top-1 -right-1 text-gray-400 hover:text-red-500">
                      <X className="h-4 w-4" />
                    </button>
                    <p className="font-semibold text-sm mb-1 line-clamp-2">{p.name}</p>
                    <Badge className="text-xs">{p.category}</Badge>
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="p-3 font-medium text-sm bg-gray-50">Price</td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <span className="font-bold text-amber-600">GHS {p.price_ghs.toFixed(2)}</span>
                  {p.original_price && (
                    <span className="text-xs text-gray-400 line-through ml-1">GHS {p.original_price.toFixed(2)}</span>
                  )}
                </td>
              ))}
            </tr>
            <tr>
              <td className="p-3 font-medium text-sm bg-gray-50">Stock</td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <Badge variant={p.stock > 0 ? "default" : "destructive"}>
                    {p.stock > 0 ? `${p.stock} in stock` : "Out of Stock"}
                  </Badge>
                </td>
              ))}
            </tr>
            {relevantKeys.map(key => (
              <tr key={key}>
                <td className="p-3 font-medium text-sm bg-gray-50">{key}</td>
                {items.map(p => (
                  <td key={p.id} className="p-3 text-center text-sm text-gray-600">
                    {(p.specs || {})[key] || "\u2014"}
                  </td>
                ))}
              </tr>
            ))}
            <tr>
              <td className="p-3 bg-gray-50"></td>
              {items.map(p => (
                <td key={p.id} className="p-3 text-center">
                  <Button
                    onClick={() => addItem(p, 1)}
                    disabled={p.stock <= 0}
                    className="bg-amber-500 hover:bg-amber-600"
                    size="sm"
                  >
                    <ShoppingCart className="h-3 w-3 mr-1" /> Add to Cart
                  </Button>
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      <Separator className="my-8" />

      <div className="text-center">
        <Link href="/products" className="text-amber-600 hover:underline text-sm">
          <ArrowLeft className="h-3 w-3 inline mr-1" /> Continue Shopping
        </Link>
      </div>
    </div>
  )
}