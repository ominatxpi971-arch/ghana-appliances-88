"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Search } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import ProductCard from "@/components/shop/product-card"
import Breadcrumbs from "@/components/Breadcrumbs"
import { ProductListSkeleton } from "@/components/skeletons"
import { formatPrice } from "@/lib/utils"
import { Product } from "@/lib/types"
import { MetaPixel } from "@/lib/pixel"
import { useAnalytics } from "@/hooks/use-analytics"

const CATEGORIES = [
  { value: "all", label: "All Categories" },
  { value: "televisions", label: "Televisions" },
  { value: "air-conditioners", label: "Air Conditioners" },
  { value: "refrigerators", label: "Refrigerators" },
  { value: "washing-machines", label: "Washing Machines" },
  { value: "small-appliances", label: "Small Appliances" },
]

const BRANDS = [{ value: "all", label: "All Brands" },{ value: "Samsung", label: "Samsung" },{ value: "LG", label: "LG" },{ value: "TCL", label: "TCL" },{ value: "Hisense", label: "Hisense" },{ value: "Midea", label: "Midea" },{ value: "Gree", label: "Gree" },{ value: "Bosch", label: "Bosch" },{ value: "Philips", label: "Philips" },{ value: "Binatone", label: "Binatone" },{ value: "Kenwood", label: "Kenwood" },{ value: "Nexus", label: "Nexus" },]

const PRICE_RANGES = [
  { value: "all", label: "All Prices" },
  { value: "0-500", label: "Under ₵500" },
  { value: "500-2000", label: "₵500 - 2,000" },
  { value: "2000-5000", label: "₵2,000 - 5,000" },
  { value: "5000-999999", label: "₵5,000+" },
]

interface ProductsPageClientProps {
  initialProducts: Product[]
}

export default function ProductsPageClient({ initialProducts }: ProductsPageClientProps) {
  const [products] = useState<Product[]>(initialProducts)
  const [loading] = useState(false)
  const [search, setSearch] = useState("")
  const [category, setCategory] = useState("all")
  const [sort, setSort] = useState("featured")
  const [priceRange, setPriceRange] = useState("all")
  const [brand, setBrand] = useState("all")
  const { trackSearch } = useAnalytics()
  const searchTimer = useRef<ReturnType<typeof setTimeout>>(undefined)

  const filtered = useMemo(() => {
    let list = [...products]
    if (category !== "all") list = list.filter(p => p.category === category)
    if (search) {
      const q = search.toLowerCase()
      list = list.filter(p => p.name.toLowerCase().includes(q))
    }
    if (brand !== "all") list = list.filter(p => p.name.toLowerCase().includes(brand.toLowerCase()))
    if (priceRange !== "all") {
      const [min, max] = priceRange.split("-").map(Number)
      list = list.filter(p => p.price_ghs >= min && p.price_ghs <= max)
    }
    switch (sort) {
      case "price-asc": list.sort((a, b) => a.price_ghs - b.price_ghs); break
      case "price-desc": list.sort((a, b) => b.price_ghs - a.price_ghs); break
      case "name": list.sort((a, b) => a.name.localeCompare(b.name)); break
    }
    return list
  }, [products, search, category, sort, priceRange, brand])

  useEffect(() => {
    if (searchTimer.current) clearTimeout(searchTimer.current)
    if (search.trim().length > 0) {
      searchTimer.current = setTimeout(() => {
        MetaPixel.search({ search_string: search.trim() })
        trackSearch(search.trim(), filtered.length)
      }, 800)
    }
    return () => { if (searchTimer.current) clearTimeout(searchTimer.current) }
  }, [search, filtered.length])

  return (
    <div className="container mx-auto px-4 py-8">
      <Breadcrumbs items={[{ label: "Products" }]} />
      <h1 className="text-3xl font-bold mb-2">All Products</h1>
      <p className="text-gray-500 mb-6">{filtered.length} products available</p>

      <div className="flex flex-wrap gap-3 mb-8">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search products..." className="pl-9" value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <Select value={category} onValueChange={(v) => setCategory(v ?? "all")}>
          <SelectTrigger className="w-[160px]"><SelectValue /></SelectTrigger>
          <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={priceRange} onValueChange={(v) => setPriceRange(v ?? "all")}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>{PRICE_RANGES.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={brand} onValueChange={(v) => setBrand(v ?? "all")}>
          <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
          <SelectContent>{BRANDS.map(b => <SelectItem key={b.value} value={b.value}>{b.label}</SelectItem>)}</SelectContent>
        </Select>
        <Select value={sort} onValueChange={(v) => setSort(v ?? "featured")}>
          <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="featured">Featured</SelectItem>
            <SelectItem value="price-asc">Price: Low to High</SelectItem>
            <SelectItem value="price-desc">Price: High to Low</SelectItem>
            <SelectItem value="name">Name</SelectItem>
          </SelectContent>
        </Select>
        {(search || category !== "all" || priceRange !== "all" || brand !== "all") && (
          <Button variant="outline" size="sm" onClick={() => { setSearch(""); setCategory("all"); setPriceRange("all"); setBrand("all") }}>
            Clear Filters
          </Button>
        )}
      </div>

      {loading ? <ProductListSkeleton /> : (
        filtered.length === 0 ? (
          <div className="text-center py-20 text-gray-400">
            <p className="text-lg">No products found</p>
            <p className="text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {filtered.map(p => <ProductCard key={p.id} product={p} />)}
          </div>
        )
      )}
    </div>
  )
}
