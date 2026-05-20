"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import NextImage from 'next/image'
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, Eye, Heart, GitCompare, Star } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog"
import { useCartContext } from "@/components/shop/cart-context"
import { useCompare } from "@/hooks/use-compare"
import { useWishlist } from "@/hooks/use-wishlist"
import { formatPrice } from "@/lib/utils"
import type { Product } from "@/lib/types"

export default function ProductCard({ product }: { product: Product }) {
  const { addItem } = useCartContext()
  const { isWishlisted, toggle } = useWishlist()
  const { isInCompare, addToCompare, removeItem } = useCompare()
  const router = useRouter()
  const [rating, setRating] = useState(0)
  const [ratingCount, setRatingCount] = useState(0)

  useEffect(() => {
    fetch(`/api/reviews?productId=${product.id}`)
      .then(r => r.json())
      .then(d => { setRating(d.average || 0); setRatingCount(d.count || 0) })
      .catch(() => {})
  }, [product.id])

  const [quickOpen, setQuickOpen] = useState(false)

  const discount = product.original_price
    ? Math.round((1 - product.price_ghs / product.original_price) * 100) : 0

  const buyNow = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product, 1)
    router.push("/checkout")
  }

  const addToCart = (e: React.MouseEvent) => {
    e.preventDefault()
    addItem(product, 1)
  }

  const productImageAlt = product.name + ' - Buy in Ghana | COD'

  return (
    <>
      <article itemScope itemType="https://schema.org/Product">
        <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 relative">
          {/* Wishlist */}
          <button
            onClick={(e) => { e.preventDefault(); toggle(product.id) }}
            className={`absolute top-2 right-2 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow transition-colors ${isWishlisted(product.id) ? "bg-red-500 text-white" : "bg-white/80 text-gray-400 hover:text-red-500"}`}
          >
            <Heart className={`h-4 w-4 ${isWishlisted(product.id) ? "fill-current" : ""}`} />
          </button>
          {/* Compare */}
          <button
            onClick={(e) => { e.preventDefault(); isInCompare(product.id) ? removeItem(product.id) : addToCompare(product) }}
            className={`absolute top-2 right-12 z-10 h-8 w-8 rounded-full flex items-center justify-center shadow transition-colors ${isInCompare(product.id) ? "bg-amber-500 text-white" : "bg-white/80 text-gray-400 hover:text-amber-500"}`}
          >
            <GitCompare className="h-4 w-4" />
          </button>

          <Link href={`/products/${product.slug}`}>
            <div className="aspect-square bg-gray-100 relative overflow-hidden">
              {product.images?.[0] ? (
                <NextImage src={product.images[0]} alt={productImageAlt} itemProp="image" fill sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw" className="object-cover group-hover:scale-105 transition-transform duration-300" />
              ) : (
                <div className="h-full w-full flex items-center justify-center text-5xl">📦</div>
              )}
              {discount > 0 && <Badge className="absolute top-2 left-2 bg-red-500">-{discount}%</Badge>}
              {product.stock <= 0 && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge variant="secondary" className="text-lg">Out of Stock</Badge>
                </div>
              )}
              {product.stock > 0 && product.stock <= 5 && (
                <Badge className="absolute bottom-2 left-2 bg-orange-500 text-xs">Only {product.stock} left</Badge>
              )}
              {/* Quick view button */}
              <button
                onClick={(e) => { e.preventDefault(); setQuickOpen(true) }}
                className="absolute bottom-2 right-2 h-8 w-8 rounded-full bg-white/90 shadow flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white"
              >
                <Eye className="h-4 w-4" />
              </button>
            </div>
          </Link>

          <CardContent className="p-4">
            <p itemProp="category" className="text-xs text-gray-500 uppercase tracking-wider mb-1">{product.category?.replace("-", " ")}</p>
            <Link href={`/products/${product.slug}`}>
              <h3 itemProp="name" className="font-semibold text-gray-900 line-clamp-2 hover:text-amber-600 transition-colors text-sm">{product.name}</h3>
            </Link>
            {ratingCount > 0 && (
              <div className="flex items-center gap-1 mt-1.5">
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(i => (
                    <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                  ))}
                </div>
                <span className="text-xs text-gray-400">({ratingCount})</span>
              </div>
            )}
            <div itemProp="offers" itemScope itemType="https://schema.org/Offer" className="flex items-baseline gap-2 mt-2">
              <meta itemProp="priceCurrency" content="GHS" />
              <meta itemProp="price" content={String(product.price_ghs)} />
              <span className="text-lg font-bold text-amber-600">{formatPrice(product.price_ghs)}</span>
              {product.original_price && <span className="text-sm text-gray-400 line-through">{formatPrice(product.original_price)}</span>}
            </div>
            <div className="grid grid-cols-2 gap-2 mt-3">
              <Button
                className="bg-amber-500 hover:bg-amber-600 text-xs h-8"
                disabled={product.stock <= 0}
                onClick={addToCart}
              >
                <ShoppingCart className="h-3.5 w-3.5 mr-1" /> Cart
              </Button>
              <Button
                className="bg-orange-500 hover:bg-orange-600 text-xs h-8"
                disabled={product.stock <= 0}
                onClick={buyNow}
              >
                <Zap className="h-3.5 w-3.5 mr-1" /> Buy Now
              </Button>
            </div>
          </CardContent>
        </Card>
      </article>

      {/* Quick View Dialog */}
      <Dialog open={quickOpen} onOpenChange={setQuickOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogTitle className="sr-only">{product.name}</DialogTitle>
          <div className="grid md:grid-cols-2 gap-6 pt-4">
            <div className="aspect-square bg-gray-100 rounded-lg flex items-center justify-center text-6xl overflow-hidden relative">
              {product.images?.[0] ? <NextImage src={product.images[0]} alt={productImageAlt} fill sizes="(max-width: 768px) 100vw, 400px" className="object-cover" /> : "📦"}
            </div>
            <div>
              <p className="text-xs text-gray-500 uppercase tracking-wider">{product.category?.replace("-", " ")}</p>
              <h3 className="text-xl font-bold mt-1">{product.name}</h3>
              {ratingCount > 0 && (
                <div className="flex items-center gap-1 mt-1.5">
                  <div className="flex gap-0.5">
                    {[1,2,3,4,5].map(i => (
                      <Star key={i} className={`h-3 w-3 ${i <= Math.round(rating) ? "fill-amber-400 text-amber-400" : "text-gray-200"}`} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-400">({ratingCount})</span>
                </div>
              )}
              <div className="flex items-baseline gap-2 mt-2">
                <span className="text-2xl font-bold text-amber-600">{formatPrice(product.price_ghs)}</span>
                {product.original_price && <span className="text-gray-400 line-through">{formatPrice(product.original_price)}</span>}
              </div>
              <p className="text-sm text-gray-600 mt-3 line-clamp-3">{product.description}</p>
              <div className="flex gap-2 mt-4">
                <Button className="flex-1 bg-amber-500 hover:bg-amber-600" onClick={addToCart} disabled={product.stock <= 0}>
                  <ShoppingCart className="h-4 w-4 mr-2" /> Add to Cart
                </Button>
                <Button className="flex-1 bg-orange-500 hover:bg-orange-600" onClick={buyNow} disabled={product.stock <= 0}>
                  <Zap className="h-4 w-4 mr-2" /> Buy Now
                </Button>
              </div>
              <Link href={`/products/${product.slug}`} className="block text-center text-sm text-amber-600 hover:underline mt-3" onClick={() => setQuickOpen(false)}>
                View Full Details →
              </Link>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  )
}
