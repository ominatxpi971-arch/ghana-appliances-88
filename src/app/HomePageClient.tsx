"use client"

import { Product, SiteSettings } from "@/lib/types"
import { useState, useEffect, useCallback } from "react"
import Link from "next/link"
import Image from 'next/image'
import { 
  ArrowRight, ShieldCheck, Truck, RefreshCw, Phone, Star, 
  ChevronLeft, ChevronRight, Award, Users, Package, ThumbsUp,
  Clock, Tag, Zap, ShoppingCart, Heart
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import ProductCard from "@/components/shop/product-card"

const FEATURES = [
  { icon: Truck, title: "Cash on Delivery", desc: "Pay only when you receive your order �� nationwide" },
  { icon: ShieldCheck, title: "100% Authentic", desc: "Genuine branded appliances with manufacturer warranty" },
  { icon: RefreshCw, title: "Easy Returns", desc: "7-day hassle-free return policy on all items" },
  { icon: Phone, title: "24/7 Support", desc: "Call or WhatsApp us anytime �� we are here to help" },
]

const CATEGORIES = [
  { name: "Televisions", slug: "televisions", icon: "??", color: "from-blue-500 to-cyan-500", desc: "4K, OLED, Smart TVs" },
  { name: "Air Conditioners", slug: "air-conditioners", icon: "??", color: "from-sky-400 to-blue-600", desc: "Split, Inverter, Window ACs" },
  { name: "Refrigerators", slug: "refrigerators", icon: "??", color: "from-emerald-400 to-teal-600", desc: "French Door, Side-by-Side" },
  { name: "Washing Machines", slug: "washing-machines", icon: "??", color: "from-violet-400 to-purple-600", desc: "Front Load, Top Load, Twin Tub" },
  { name: "Small Appliances", slug: "small-appliances", icon: "??", color: "from-orange-400 to-rose-500", desc: "Kettles, Irons, Blenders & more" },
]

function getHeroSlides(settings: Partial<SiteSettings> | null) { if (!settings) settings = {};
  return [
    {
      badge: settings.hero1_badge || "Premium Appliances",
      title: settings.hero1_title || "Premium Home Appliances",
      highlight: settings.hero1_highlight || "Delivered Across Ghana",
      subtitle: settings.hero1_subtitle || "Quality water heaters for your home. Free shipping and COD available.",
      cta: settings.hero1_cta || "Shop Now",
      ctaLink: settings.hero1_cta_link || "/products",
      bg: settings.hero1_bg || "from-gray-900 via-gray-800 to-amber-900",
      accent: settings.hero1_accent || "amber",
      icon: settings.hero1_icon || "??",
      image: settings.hero1_image || "/hero-1.webp",
    },
    {
      badge: settings.hero2_badge || "Best Quality",
      title: settings.hero2_title || "Kitchen Essentials",
      highlight: settings.hero2_highlight || "Cook with Confidence",
      subtitle: settings.hero2_subtitle || "Premium rice cookers and kitchen appliances at the best prices.",
      cta: settings.hero2_cta || "View Deals",
      ctaLink: settings.hero2_cta_link || "/products",
      bg: settings.hero2_bg || "from-amber-900 via-orange-800 to-red-900",
      accent: settings.hero2_accent || "orange",
      icon: settings.hero2_icon || "??",
      image: settings.hero2_image || "/hero-2.webp",
    },
    {
      badge: settings.hero3_badge || "Free Delivery",
      title: settings.hero3_title || "Fast & Free Delivery",
      highlight: settings.hero3_highlight || "Cash on Delivery",
      subtitle: settings.hero3_subtitle || "Order today and get free delivery. Pay cash when it arrives.",
      cta: settings.hero3_cta || "Order Now",
      ctaLink: settings.hero3_cta_link || "/products",
      bg: settings.hero3_bg || "from-emerald-900 via-teal-800 to-amber-900",
      accent: settings.hero3_accent || "emerald",
      icon: settings.hero3_icon || "??",
      image: settings.hero3_image || "/hero-3.webp",
    },
  ]
}

const TESTIMONIALS = [
  { name: "Akua M.", city: "Accra", text: "Ordered a Samsung TV and it arrived within 2 days. The delivery team was professional and the product is genuine. Highly recommend!", rating: 5 },
  { name: "Kwame O.", city: "Kumasi", text: "Best prices on air conditioners in Ghana. I saved over GH? 500 compared to other shops. Installation was smooth.", rating: 5 },
  { name: "Abena D.", city: "Tema", text: "Their COD option saved me. I could inspect the fridge before paying. Great customer service via WhatsApp.", rating: 5 },
]

const STATS = [
  { icon: Package, value: "500+", label: "Products" },
  { icon: Users, value: "1000+", label: "Happy Customers" },
  { icon: ThumbsUp, value: "98%", label: "Satisfaction" },
  { icon: Clock, value: "24/7", label: "Support" },
]

function StyledLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return <Link href={href} className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-all ${className || ""}`}>{children}</Link>
}

export default function HomePageClient({ settings, products }: { settings: Partial<SiteSettings> | null; products: Product[] }) {
  const [heroIndex, setHeroIndex] = useState(0)
  const [topRated, setTopRated] = useState<Product[]>([])
  const [reviewStats, setReviewStats] = useState({ totalSold: 500, happyCustomers: 200 })
  const [countdown, setCountdown] = useState({ hours: 0, mins: 0, secs: 0 })

  const heroSlides = getHeroSlides(settings)

  // Countdown to midnight
  useEffect(() => {
    const tick = () => {
      const now = new Date()
      const midnight = new Date(now)
      midnight.setHours(24, 0, 0, 0)
      const diff = midnight.getTime() - now.getTime()
      setCountdown({
        hours: Math.floor(diff / 3600000),
        mins: Math.floor((diff % 3600000) / 60000),
        secs: Math.floor((diff % 60000) / 1000),
      })
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [])

  // Fetch real review stats for social proof
  useEffect(() => {
    async function load() {
      try {
        const res = await fetch("/api/reviews")
        const d = await res.json()
        const reviews = d.reviews || []
        const productRatings: Record<string, { count: number; total: number }> = {}
        const customerSet = new Set<string>()
        reviews.forEach((r: { product_id?: string; rating?: number; customer_name?: string | null }) => { if (!r.product_id) return;
          if (!productRatings[r.product_id]) productRatings[r.product_id] = { count: 0, total: 0 }
          productRatings[r.product_id].count++
          productRatings[r.product_id].total += r.rating || 0
          if (r.customer_name) customerSet.add(r.customer_name)
        })
        // Top rated: products with at least 1 review, sorted by average rating
        const rated = Object.entries(productRatings)
          .map(([id, s]) => ({ id, avg: s.total / s.count, count: s.count }))
          .sort((a, b) => b.avg - a.avg)
          .slice(0, 4)
        const topProducts = rated
          .map(r => products.find((p: Product) => p.id === r.id))
          .filter((p): p is Product => p !== undefined)
        setTopRated(topProducts)
        setReviewStats({ totalSold: reviews.length, happyCustomers: customerSet.size })
      } catch {}
    }
    load()
  }, [products])

  // Auto-rotate hero
  useEffect(() => {
    const timer = setInterval(() => {
      setHeroIndex(i => (i + 1) % heroSlides.length)
    }, 5000)
    return () => clearInterval(timer)
  }, [heroSlides.length])

  const siteName = settings?.site_name || "Ghana Appliances"
  const activeSlide = heroSlides[heroIndex]

  return (
    <>
      <h1 className="sr-only">{siteName} - Buy Electrical Appliances in Ghana | Cash on Delivery</h1>
      {/* ========== HERO CAROUSEL ==========*/}
      <section className={`relative h-[420px] md:h-[520px] bg-gradient-to-r ${activeSlide.bg} text-white overflow-hidden`}>
        {activeSlide.image && (
          <div className="absolute inset-0">
            <Image src={activeSlide.image} alt="" fill sizes="100vw" className="object-cover opacity-30" priority />
          </div>
        )}
        <div className="relative container mx-auto px-4 py-16 md:py-24">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="max-w-xl">
              <Badge className={`bg-${activeSlide.accent}-500/20 text-${activeSlide.accent}-200 border-${activeSlide.accent}-500/30 mb-4`}>
                {activeSlide.badge}
              </Badge>
              <h1 className="text-3xl md:text-5xl lg:text-6xl font-extrabold leading-tight mb-3">
                {activeSlide.title}{" "}
                <span className={`text-${activeSlide.accent}-400`}>{activeSlide.highlight}</span>
              </h1>
              <p className="text-lg text-gray-300 mb-6 leading-relaxed">{activeSlide.subtitle}</p>
              <div className="flex flex-wrap gap-3">
                <StyledLink href={activeSlide.ctaLink} className={`bg-${activeSlide.accent}-500 hover:bg-${activeSlide.accent}-600 text-white h-12 px-8 text-base font-bold`}>
                  {activeSlide.cta} <ArrowRight className="ml-2 h-5 w-5" />
                </StyledLink>
                <StyledLink href="/products" className="border-2 border-white/30 hover:bg-white/10 h-12 px-8 text-base">
                  All Products
                </StyledLink>
              </div>
            </div>
            <div className="hidden md:flex justify-center">
            </div>
          </div>
        </div>
        {/* Navigation dots */}
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
          {heroSlides.map((_, i) => (
            <button
              key={i}
              onClick={() => setHeroIndex(i)}
              className={`h-2 rounded-full transition-all ${i === heroIndex ? "w-8 bg-white" : "w-2 bg-white/50 hover:bg-white/70"}`}
            />
          ))}
        </div>
        {/* Arrows */}
        <button onClick={() => setHeroIndex(i => i > 0 ? i - 1 : heroSlides.length - 1)} className="absolute left-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button onClick={() => setHeroIndex(i => (i + 1) % heroSlides.length)} className="absolute right-4 top-1/2 -translate-y-1/2 h-10 w-10 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center">
          <ChevronRight className="h-5 w-5" />
        </button>
      </section>

      {/* ========== CATEGORY QUICK NAV ==========*/}
      <section className="container mx-auto px-4 py-12">
        <div className="text-center mb-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Shop by Category</h2>
          <p className="text-gray-500">Find exactly what you need for your home</p>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {CATEGORIES.map((cat) => (
            <Link
              key={cat.slug}
              href={`/products?category=${cat.slug}`}
              className="group bg-white border rounded-xl p-4 text-center hover:shadow-lg hover:border-amber-200 transition-all"
            >
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${cat.color} flex items-center justify-center mx-auto mb-2 text-white text-lg`}>
                {cat.icon}
              </div>
              <p className="font-semibold text-sm text-gray-900 group-hover:text-amber-600 transition-colors">{cat.name}</p>
              <p className="text-xs text-gray-400">{cat.desc}</p>
            </Link>
          ))}
        </div>
      </section>

      {/* ========== FEATURES ==========*/}
      <section className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
          {FEATURES.map((feat, i) => (
            <div key={i} className="text-center">
              <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
                <feat.icon className="h-6 w-6 text-amber-600" />
              </div>
              <h3 className="font-semibold text-sm text-gray-900">{feat.title}</h3>
              <p className="text-xs text-gray-500 mt-1">{feat.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ========== TOP RATED ==========*/}
      {topRated.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">? Top Rated</h2>
            <p className="text-gray-500">Highest rated by our customers</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {topRated.map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========== ALL PRODUCTS ==========*/}
      {products.length > 0 && (
        <section className="container mx-auto px-4 py-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">Our Products</h2>
            <Link href="/products" className="text-amber-600 hover:underline text-sm">View All &rarr; </Link>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {products.slice(0, 8).map((product: Product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* ========== WHY CHOOSE US ==========*/}
      <section className="bg-gray-50">
        <div className="container mx-auto px-4 py-16">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Why Choose {siteName}?</h2>
            <p className="text-gray-500 text-lg">We are committed to bringing you the best shopping experience</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              { icon: ShieldCheck, title: "Genuine Products", desc: "Every product we sell is 100% authentic with full manufacturer warranty. No counterfeits, ever." },
              { icon: Truck, title: "Fast Delivery", desc: "Orders within Greater Accra delivered in 1-2 days. Nationwide shipping to all 16 regions of Ghana." },
              { icon: RefreshCw, title: "Easy Returns", desc: "Not satisfied? Return within 7 days for a full refund or exchange. No questions asked." },
              { icon: Award, title: "Best Prices", desc: "We monitor the market to ensure you get the most competitive prices on all major appliance brands." },
            ].map((item, i) => (
              <div key={i} className="text-center group">
                <div className="inline-flex h-16 w-16 rounded-2xl bg-amber-100 items-center justify-center mb-4 group-hover:bg-amber-200 transition-colors">
                  <item.icon className="h-8 w-8 text-amber-600" />
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{item.title}</h3>
                <p className="text-sm text-gray-500 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== STATS ==========*/}
      <section className="bg-amber-500">
        <div className="container mx-auto px-4 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {STATS.map((stat, i) => (
              <div key={i} className="text-center text-black">
                <stat.icon className="h-8 w-8 mx-auto mb-2 opacity-70" />
                <p className="text-3xl md:text-4xl font-extrabold">{stat.value}</p>
                <p className="text-sm font-medium opacity-80">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ========== TESTIMONIALS ==========*/}
      <section className="container mx-auto px-4 py-16">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">What Our Customers Say</h2>
          <p className="text-gray-500 text-lg">Trusted by hundreds of Ghanaian households</p>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {TESTIMONIALS.map((t, i) => (
            <div key={i} className="bg-white border rounded-xl p-6 hover:shadow-lg transition-shadow">
              <div className="flex gap-1 mb-3">
                {Array.from({ length: t.rating }).map((_, j) => (
                  <Star key={j} className="h-4 w-4 fill-amber-400 text-amber-400" />
                ))}
              </div>
              <p className="text-gray-600 text-sm leading-relaxed mb-4 italic">"{t.text}"</p>
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center font-bold text-amber-700">
                  {t.name[0]}
                </div>
                <div>
                  <p className="font-semibold text-sm text-gray-900">{t.name}</p>
                  <p className="text-xs text-gray-400">{t.city}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ========== CTA SECTION ==========*/}
      <section className="bg-gradient-to-r from-amber-500 to-orange-500 text-black">
        <div className="container mx-auto px-4 py-16 text-center">
          <h2 className="text-3xl md:text-4xl font-extrabold mb-3">Ready to Upgrade Your Home?</h2>
          <p className="text-lg mb-6 opacity-90 max-w-xl mx-auto">
            Browse our collection of quality appliances. No payment needed until delivery �� shop with confidence.
          </p>
          <div className="flex flex-wrap gap-3 justify-center">
            <StyledLink href="/products" className="bg-black text-white hover:bg-gray-800 h-12 px-8 text-base font-bold">
              View All Products
            </StyledLink>
            <StyledLink href="/contact" className="border-2 border-black/30 text-black hover:bg-black/10 h-12 px-8 text-base">
              Contact Us
            </StyledLink>
          </div>
        </div>
      </section>
    </>
  )
}
