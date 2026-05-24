"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, Minus, Plus, Truck, ShieldCheck, ChevronLeft, ChevronRight, Heart } from "lucide-react"
import { Label } from "@/components/ui/label"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Separator } from "@/components/ui/separator"
import { useCartContext } from "@/components/shop/cart-context"
import { useWishlist } from "@/hooks/use-wishlist"
import Breadcrumbs from "@/components/Breadcrumbs"
import ProductReviews from "@/components/shop/product-reviews"
import RecentlyViewed from "@/components/RecentlyViewed"
import ShareButtons from "@/components/ShareButtons"
import { formatPrice } from "@/lib/utils"
import type { Product, ProductVariant } from "@/lib/types"

import { MetaPixel, TikTokPixel } from "@/lib/pixel"
import { useAnalytics } from "@/hooks/use-analytics"

interface ProductPageClientProps {
  product: Product
  related: Product[]
}

export default function ProductPageClient({ product, related }: ProductPageClientProps) {
  const { addItem } = useCartContext()
  const { trackEvent } = useAnalytics()
  const { isWishlisted, toggle } = useWishlist()
  const router = useRouter()
  const [qty, setQty] = useState(1)
  const [activeImage, setActiveImage] = useState(0)
  const [selectedVariant, setSelectedVariant] = useState<ProductVariant | null>(null)
  const [selOpt1, setSelOpt1] = useState("")
  const [selOpt2, setSelOpt2] = useState("")

  const variants: ProductVariant[] = (product.variants || []).filter((v: ProductVariant) => v.active)
  const hasVariants = variants.length > 0
  const option1Name = variants.find((v: ProductVariant) => v.option1_name)?.option1_name || ""
  const option2Name = variants.find((v: ProductVariant) => v.option2_name)?.option2_name || ""
  const option1Values = [...new Set(variants.filter(v => v.option1_value).map(v => v.option1_value!))] as string[]
  const option2Values = [...new Set(variants.filter(v => v.option2_value).map(v => v.option2_value!))] as string[]

  // Find matching variant when options change
  const findVariant = (opt1: string, opt2: string): ProductVariant | null => {
    return variants.find((v: ProductVariant) => 
      (!option1Name || v.option1_value === opt1) &&
      (!option2Name || v.option2_value === opt2)
    ) || null
  }

  // Sync selected variant
  const currentVariant = selectedVariant
  const displayPrice = currentVariant?.price_ghs && currentVariant.price_ghs > 0 ? currentVariant.price_ghs : product.price_ghs
  const displayStock = hasVariants ? (currentVariant?.stock ?? variants.reduce((s: number, v: ProductVariant) => s + (v.stock || 0), 0)) : product.stock
  const canAdd = hasVariants ? !!currentVariant && displayStock > 0 : product.stock > 0

  useEffect(() => {
    if (product.price_ghs > 0) {
      trackEvent("view_product", product.slug)
      MetaPixel.viewContent({
        content_ids: [product.id],
        content_name: product.name,
        content_category: product.category,
        value: product.price_ghs,
        currency: "GHS",
      })
      try {
        TikTokPixel.viewContent({
          content_id: product.id,
          content_name: product.name,
          content_category: product.category,
          value: product.price_ghs,
          currency: "GHS",
        })
      } catch (_) {}
    }
  }, [product.id, product.price_ghs])

  const discount = product.original_price ? Math.round((1 - displayPrice / product.original_price) * 100) : 0
  const images = product.images?.length ? product.images : []
  const buyNow = () => { addItem(product, qty, selectedVariant || undefined); setTimeout(() => router.push("/checkout"), 300) }
  const productImageAlt = product.name + ' - ' + (product.category || '') + ' | Ghana Appliances'
  const brand = product.specs?.brand || product.specs?.Brand

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: product.name }]} />

      <div className="grid md:grid-cols-2 gap-8">
        <div className="min-w-0 w-full">
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center relative w-full max-w-full">
            {images.length > 0 ? <Image src={images[activeImage]} alt={productImageAlt} fill sizes="(max-width: 768px) calc(100vw - 2rem), 50vw" className="object-cover" priority /> : <span className="text-8xl">📝</span>}
            {images.length > 1 && (<><button onClick={() => setActiveImage(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white z-10 border border-gray-200"><ChevronLeft className="h-5 w-5" /></button><button onClick={() => setActiveImage(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/90 shadow-md flex items-center justify-center hover:bg-white z-10 border border-gray-200"><ChevronRight className="h-5 w-5" /></button></>)}
          </div>
          {images.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-1">{images.map((url, i) => (<button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 relative ${i === activeImage ? "border-amber-500" : "border-transparent hover:border-gray-300"}`}><Image src={url} alt={`${product.name} - view ${i + 1} | Ghana Appliances`} fill sizes="64px" className="object-cover" /></button>))}</div>)}
        </div>

        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">{product.category}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2 break-words">{product.name}</h1>
          {brand && <p className="text-sm text-gray-500 mb-2" itemProp="brand">Brand: {brand}</p>}
          <div className="mb-4">
            {discount > 0 && product.original_price && (
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price)}</span>
                <Badge className="bg-red-500 -mt-0.5">-{discount}% OFF</Badge>
              </div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-amber-600">{formatPrice(displayPrice)}</span>
              {currentVariant?.price_ghs && currentVariant.price_ghs > 0 && currentVariant.price_ghs !== product.price_ghs && (
                <span className="text-sm text-gray-400">(base: {formatPrice(product.price_ghs)})</span>
              )}
            </div>
            {hasVariants && discount > 0 && (
              <p className="text-xs text-green-600 mt-1">You save {formatPrice((product.original_price || displayPrice) - displayPrice)} vs original price</p>
            )}
          </div>
          <p className="text-gray-600 mb-6 break-words whitespace-pre-wrap" itemProp="description">{product.description}</p>

          {/* Variant Selector */}
          {hasVariants && (
            <div className="space-y-3 mb-6">
              {option1Values.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">{option1Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {option1Values.map((val: string) => (
                      <button
                        key={val}
                        onClick={() => {
                          setSelOpt1(val)
                          const v = findVariant(val, selOpt2)
                          setSelectedVariant(v)
                        }}
                        className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                          selOpt1 === val
                            ? "border-amber-500 bg-amber-500 text-white"
                            : "border-gray-200 hover:border-amber-300 text-gray-700"
                        }`}
                      >
                        {val}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {option2Values.length > 0 && (
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-1.5">{option2Name}</p>
                  <div className="flex flex-wrap gap-2">
                    {option2Values.map((val: string) => {
                      const avail = !selOpt1 || variants.some((v: ProductVariant) => v.option1_value === selOpt1 && v.option2_value === val)
                      return (
                        <button
                          key={val}
                          onClick={() => {
                            setSelOpt2(val)
                            const v = findVariant(selOpt1, val)
                            setSelectedVariant(v)
                          }}
                          disabled={!avail}
                          className={`px-4 py-2 rounded-lg border text-sm font-medium transition-all ${
                            !avail ? "border-gray-100 text-gray-300 cursor-not-allowed" :
                            selOpt2 === val
                              ? "border-amber-500 bg-amber-500 text-white"
                              : "border-gray-200 hover:border-amber-300 text-gray-700"
                          }`}
                        >
                          {val}
                        </button>
                      )
                    })}
                  </div>
                </div>
              )}

              {currentVariant && (
                <p className="text-sm text-gray-600 font-medium">
                  {currentVariant.name || (currentVariant.sku && `SKU: ${currentVariant.sku}`)}
                </p>
              )}
            </div>
          )}

          {Object.keys(product.specs || {}).length > 0 && (<div className="bg-gray-50 rounded-lg p-4 mb-6"><h2 className="font-semibold mb-2">Specifications</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-sm">{Object.entries(product.specs || {}).map(([k, v]) => (<div key={k}><span className="text-gray-500">{k}:</span> <span className="font-medium break-words">{v as string}</span></div>))}</div></div>)}

          <div className="flex items-center gap-2 mb-4"><Badge variant={displayStock > 0 ? "default" : "destructive"}>{displayStock > 0 ? `${displayStock} in stock` : "Out of Stock"}</Badge>{displayStock > 0 && displayStock <= 5 && <span className="text-xs text-orange-600 font-medium">Low stock!</span>}</div>

          {product.id && <meta itemProp="sku" content={product.id} />}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-lg"><button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-100"><Minus className="h-4 w-4" /></button><span className="px-4 py-2 font-medium">{qty}</span><button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100"><Plus className="h-4 w-4" /></button></div>
            <button onClick={() => toggle(product.id)} className={`h-10 w-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${isWishlisted(product.id) ? "bg-red-50 border-red-300 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500"}`}><Heart className={`h-5 w-5 ${isWishlisted(product.id) ? "fill-current" : ""}`} /></button>
          </div>

          <div className="flex gap-3">
            <Button onClick={() => { addItem(product, qty, selectedVariant || undefined); setQty(1) }} disabled={!canAdd} className="flex-1 bg-amber-500 hover:bg-amber-600" size="lg"><ShoppingCart className="h-5 w-5 mr-2" /> {hasVariants && !selectedVariant ? "Select Option" : "Add to Cart"}</Button>
            <Button onClick={buyNow} disabled={!canAdd} className="flex-1 bg-orange-500 hover:bg-orange-600" size="lg"><Zap className="h-5 w-5 mr-2" /> {hasVariants && !selectedVariant ? "Select Option" : "Buy Now"}</Button>
          </div>
          <div className="flex gap-4 text-sm text-gray-500 mt-4"><span className="flex items-center gap-1"><Truck className="h-4 w-4" /> COD Available</span><span className="flex items-center gap-1"><ShieldCheck className="h-4 w-4" /> Genuine</span>
          <ShareButtons productName={product.name} productUrl={typeof window!=="undefined"?window.location.href:""} /></div>
        </div>
      </div>

      {related.length > 0 && (<><Separator className="my-12" /><h2 className="text-2xl font-bold mb-6">Related Products</h2><div className="grid grid-cols-2 md:grid-cols-4 gap-4">{related.map(rp => (<Link key={rp.id} href={`/products/${rp.slug}`} className="group"><div className="aspect-square bg-gray-100 rounded-lg overflow-hidden mb-2 group-hover:opacity-80 transition-opacity flex items-center justify-center relative">{rp.images?.[0] ? <Image src={rp.images[0]} alt={rp.name + ' - Buy in Ghana | COD'} fill sizes="(max-width: 768px) 50vw, 25vw" className="object-cover" /> : <span className="text-5xl">📝</span>}</div><p className="text-sm font-medium line-clamp-2">{rp.name}</p><p className="text-sm font-bold text-amber-600">{formatPrice(rp.price_ghs)}</p></Link>))}</div></>)}

      <ProductReviews productId={product.id} />

      <RecentlyViewed currentProduct={product} />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify({
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.name,
        description: product.description,
        sku: product.id,
        ...(brand ? { brand: { "@type": "Brand", name: brand } } : {}),
        url: `https://ghanaappliance.cc/products/${product.slug}`,
        image: product.images?.[0]
          ? (product.images[0].startsWith("http") ? product.images[0] : `https://ghanaappliance.cc${product.images[0]}`)
          : undefined,
        offers: {
          "@type": "Offer",
          price: product.price_ghs,
          priceCurrency: "GHS",
          availability: product.stock > 0
            ? "https://schema.org/InStock"
            : "https://schema.org/OutOfStock",
          itemCondition: "https://schema.org/NewCondition",
        },
        category: product.category,
      }) }} />
    </div>
  )
}
