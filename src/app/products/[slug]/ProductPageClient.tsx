"use client"

import { useState, useEffect } from "react"
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from "next/navigation"
import { ShoppingCart, Zap, Minus, Plus, Truck, ShieldCheck, ChevronLeft, ChevronRight, Heart } from "lucide-react"
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
import type { Product } from "@/lib/types"

import { MetaPixel } from "@/lib/pixel"
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
    }
  }, [product.id, product.price_ghs])

  const discount = product.original_price ? Math.round((1 - product.price_ghs / product.original_price) * 100) : 0
  const images = product.images?.length ? product.images : []
  const buyNow = () => { addItem(product, qty); setTimeout(() => router.push("/checkout"), 300) }
  const productImageAlt = product.name + ' - ' + (product.category || '') + ' | Ghana Appliances'
  const brand = product.specs?.brand || product.specs?.Brand

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Products", href: "/products" }, { label: product.name }]} />

      <div className="grid md:grid-cols-2 gap-8">
        <div>
          <div className="aspect-square bg-gray-100 rounded-xl overflow-hidden mb-3 flex items-center justify-center relative">
            {images.length > 0 ? <Image src={images[activeImage]} alt={productImageAlt} fill sizes="(max-width: 768px) 100vw, 50vw" className="object-cover" priority /> : <span className="text-8xl">📝</span>}
            {images.length > 1 && (<><button onClick={() => setActiveImage(i => i > 0 ? i - 1 : images.length - 1)} className="absolute left-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white"><ChevronLeft className="h-4 w-4" /></button><button onClick={() => setActiveImage(i => i < images.length - 1 ? i + 1 : 0)} className="absolute right-2 top-1/2 -translate-y-1/2 h-8 w-8 rounded-full bg-white/80 shadow flex items-center justify-center hover:bg-white"><ChevronRight className="h-4 w-4" /></button></>)}
          </div>
          {images.length > 1 && (<div className="flex gap-2 overflow-x-auto pb-1">{images.map((url, i) => (<button key={i} onClick={() => setActiveImage(i)} className={`h-16 w-16 rounded-lg overflow-hidden border-2 flex-shrink-0 relative ${i === activeImage ? "border-amber-500" : "border-transparent hover:border-gray-300"}`}><Image src={url} alt={`${product.name} - view ${i + 1} | Ghana Appliances`} fill sizes="64px" className="object-cover" /></button>))}</div>)}
        </div>

        <div>
          <p className="text-sm text-gray-500 uppercase tracking-wider mb-1">{product.category}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
          {brand && <p className="text-sm text-gray-500 mb-2" itemProp="brand">Brand: {brand}</p>}
          <div className="flex items-baseline gap-2 mb-4"><span className="text-3xl font-bold text-amber-600">{formatPrice(product.price_ghs)}</span>{product.original_price && <><span className="text-lg text-gray-400 line-through">{formatPrice(product.original_price)}</span><Badge className="bg-red-500">-{discount}%</Badge></>}</div>
          <p className="text-gray-600 mb-6" itemProp="description">{product.description}</p>

          {Object.keys(product.specs || {}).length > 0 && (<div className="bg-gray-50 rounded-lg p-4 mb-6"><h2 className="font-semibold mb-2">Specifications</h2><div className="grid grid-cols-2 gap-2 text-sm">{Object.entries(product.specs || {}).map(([k, v]) => (<div key={k}><span className="text-gray-500">{k}:</span> <span className="font-medium">{v as string}</span></div>))}</div></div>)}

          <div className="flex items-center gap-2 mb-4"><Badge variant={product.stock > 0 ? "default" : "destructive"}>{product.stock > 0 ? `${product.stock} in stock` : "Out of Stock"}</Badge>{product.stock > 0 && product.stock <= 5 && <span className="text-xs text-orange-600 font-medium">Low stock!</span>}</div>

          {product.id && <meta itemProp="sku" content={product.id} />}

          <div className="flex items-center gap-3 mb-4">
            <div className="flex items-center border rounded-lg"><button onClick={() => setQty(Math.max(1, qty - 1))} className="px-3 py-2 hover:bg-gray-100"><Minus className="h-4 w-4" /></button><span className="px-4 py-2 font-medium">{qty}</span><button onClick={() => setQty(qty + 1)} className="px-3 py-2 hover:bg-gray-100"><Plus className="h-4 w-4" /></button></div>
            <button onClick={() => toggle(product.id)} className={`h-10 w-10 rounded-lg border flex items-center justify-center flex-shrink-0 ${isWishlisted(product.id) ? "bg-red-50 border-red-300 text-red-500" : "border-gray-200 text-gray-400 hover:text-red-500"}`}><Heart className={`h-5 w-5 ${isWishlisted(product.id) ? "fill-current" : ""}`} /></button>
          </div>

          <div className="flex gap-3"><Button onClick={() => { addItem(product, qty); setQty(1) }} disabled={product.stock <= 0} className="flex-1 bg-amber-500 hover:bg-amber-600" size="lg"><ShoppingCart className="h-5 w-5 mr-2" /> Add to Cart</Button><Button onClick={buyNow} disabled={product.stock <= 0} className="flex-1 bg-orange-500 hover:bg-orange-600" size="lg"><Zap className="h-5 w-5 mr-2" /> Buy Now</Button></div>
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
