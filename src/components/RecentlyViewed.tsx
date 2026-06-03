
"use client"

import Link from 'next/link'
import NextImage from 'next/image'
import { Clock } from "lucide-react"
import { useRecentlyViewed } from "@/hooks/use-recently-viewed"
import { useEffect } from "react"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/lib/types"

export default function RecentlyViewed({ currentProduct }: { currentProduct?: Product }) {
  const { items, addView } = useRecentlyViewed()

  useEffect(() => {
    if (currentProduct) {
      addView({
        id: currentProduct.id, slug: currentProduct.slug,
        name: currentProduct.name, price: currentProduct.price_ghs,
        image: currentProduct.images?.[0] || "",
      })
    }
  }, [currentProduct])

  if (items.length <= 1) return null

  return (
    <div className="border-t pt-8 mt-8">
      <h3 className="text-lg font-bold mb-4 flex items-center gap-2"><Clock className="h-5 w-5 text-amber-500" /> Recently Viewed</h3>
      <div className="flex gap-3 overflow-x-auto pb-2">
        {items.filter(i => !currentProduct || i.id !== currentProduct.id).slice(0, 6).map(item => (
          <Link key={item.id} href={`/products/${item.slug}`} className="flex-shrink-0 w-32 group">
            <div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-1 relative">
              {item.image ? <NextImage src={item.image} alt={item.name} fill sizes="100px" className="object-cover group-hover:opacity-80" />
                : <div className="h-full w-full flex items-center justify-center text-3xl">📦</div>}
            </div>
            <p className="text-xs font-medium line-clamp-2">{item.name}</p>
            <p className="text-xs font-bold text-amber-600">{formatPrice(item.price)}</p>
          </Link>
        ))}
      </div>
    </div>
  )
}
