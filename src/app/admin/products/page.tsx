"use client"

import { useState, useEffect, useCallback } from "react"
import { formatPrice } from "@/lib/utils"
import { Plus, Search, Edit, Trash2, Eye, EyeOff, ChevronLeft, ChevronRight, Upload, DollarSign, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import ImageUpload from "@/components/admin/image-upload"
import SpecsEditor from "@/components/admin/specs-editor"
import VariantEditor from "@/components/admin/variant-editor"
import { Product, ProductVariant } from "@/lib/types"
import { toast } from "sonner"

const CATEGORIES = [
  { value: "televisions", label: "Televisions" },
  { value: "air-conditioners", label: "Air Conditioners" },
  { value: "refrigerators", label: "Refrigerators" },
  { value: "washing-machines", label: "Washing Machines" },
  { value: "small-appliances", label: "Small Appliances" },
]

const PAGE_SIZE = 10

type SortField = "name" | "price_ghs" | "stock" | "created_at"
type SortOrder = "asc" | "desc"

const EMPTY: Partial<Product> = {
   name: "", description: "", category: "televisions", price_ghs: 0, original_price: null,
   images: [], specs: {}, stock: 0, featured: false, active: true, slug: "", variants: [] as any
 }

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [editing, setEditing] = useState<Partial<Product> | null>(null)
  const [page, setPage] = useState(0)
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkPriceOpen, setBulkPriceOpen] = useState(false);
  const [bulkPriceMode, setBulkPriceMode] = useState<'fixed'|'percent'>('fixed');
  const [bulkPriceValue, setBulkPriceValue] = useState(0);
  const [sortBy, setSortBy] = useState<SortField>("created_at");
  const [sortOrder, setSortOrder] = useState<SortOrder>("desc");

  // CSV import state
  const [importing, setImporting] = useState(false);
  const [csvProgress, setCsvProgress] = useState(0);
  const [csvTotal, setCsvTotal] = useState(0);

  // Confirm dialog state
  const [deleteConfirm, setDeleteConfirm] = useState<{ id: string; name: string } | null>(null);
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const fetchProducts = useCallback(async () => {
    try {
      const res = await fetch("/api/products")
      setProducts(await res.json())
    } catch { toast.error("Failed to load") }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchProducts() }, [fetchProducts])

  // Column sort handler
  const handleSort = (field: SortField) => {
    if (sortBy === field) {
      setSortOrder(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortBy(field)
      setSortOrder(field === "created_at" ? "desc" : "asc")
    }
    setPage(0)
  }

  const sortIcon = (field: SortField) => {
    if (sortBy !== field) return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-gray-400" />
    return sortOrder === "asc"
      ? <ArrowUp className="h-3.5 w-3.5 ml-1 text-amber-600" />
      : <ArrowDown className="h-3.5 w-3.5 ml-1 text-amber-600" />
  }

  const filtered = products
    .filter(p =>
      !search || p.name.toLowerCase().includes(search.toLowerCase()) || p.category.toLowerCase().includes(search.toLowerCase())
    )
    .sort((a, b) => {
      const dir = sortOrder === "asc" ? 1 : -1
      if (sortBy === "created_at") {
        return dir * (new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
      }
      if (sortBy === "name") {
        return dir * a.name.localeCompare(b.name)
      }
      return dir * ((a[sortBy] as number) - (b[sortBy] as number))
    })

  // CSV import function
  const handleCSVImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setImporting(true)
    setCsvProgress(0)

    try {
      const text = await file.text()
      const lines = text.split("\n").filter(Boolean)
      const dataRows = lines.slice(1).filter(l => {
        const cols = l.split(",")
        return cols.length >= 5 && cols[0]?.trim()
      })

      if (dataRows.length === 0) {
        toast.error("CSV has no valid data rows")
        setImporting(false)
        return
      }

      setCsvTotal(dataRows.length)

      let imported = 0
      let failed = 0

      for (let i = 0; i < dataRows.length; i++) {
        const cols = dataRows[i].split(",")
        try {
          const p = {
            name: cols[0]?.trim() || "",
            category: cols[1]?.trim() || "televisions",
            price_ghs: Number(cols[2]) || 0,
            original_price: cols[3] ? Number(cols[3]) : null,
            stock: Number(cols[4]) || 0,
            description: cols[5]?.trim() || "",
            images: [],
            specs: {},
            featured: false,
            active: true,
          }
          const res = await fetch("/api/products", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(p),
          })
          if (res.ok) {
            imported++
          } else {
            failed++
          }
        } catch {
          failed++
        }
        setCsvProgress(i + 1)
      }

      if (failed > 0) {
        toast.warning(`Imported ${imported} products. ${failed} rows failed.`)
      } else {
        toast.success(`Imported ${imported} products successfully`)
      }
      fetchProducts()
    } catch {
      toast.error("Failed to parse CSV file")
    } finally {
      setImporting(false)
      setCsvProgress(0)
      setCsvTotal(0)
      if (e.target) e.target.value = ""
    }
  }

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE)
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  const toggleSelect = (id: string) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    if (selected.size === paged.length) setSelected(new Set())
    else setSelected(new Set(paged.map(p => p.id)))
  }

  const bulkDelete = async () => {
    setBulkDeleteOpen(false)
    const ids = Array.from(selected)
    for (const id of ids) {
      await fetch(`/api/products/${id}`, { method: "DELETE" })
    }
    toast.success(`Deleted ${ids.length} products`)
    setSelected(new Set())
    fetchProducts()
  }

  const bulkPriceEdit = async () => {
    try {
      const res = await fetch('/api/products/bulk-price', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: Array.from(selected), mode: bulkPriceMode, value: bulkPriceValue })
      });
      const d = await res.json();
      if (res.ok) {
        toast.success('Updated ' + d.updated + ' of ' + d.total + ' products');
        setBulkPriceOpen(false);
        setSelected(new Set());
        fetchProducts();
      } else {
        toast.error(d.error || 'Failed');
      }
    } catch { toast.error('Bulk price update failed'); }
  };

  const bulkToggle = async (active: boolean) => {
    const targets = products.filter(p => selected.has(p.id))
    for (const p of targets) {
      await fetch(`/api/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, active }) })
    }
    setSelected(new Set())
    fetchProducts()
  }

  const handleSave = async () => {
    if (!editing?.name || !editing?.price_ghs) { toast.error("Name and price required"); return }
    const isNew = !editing.id
    const url = isNew ? "/api/products" : `/api/products/${editing.id}`
    try {
      const res = await fetch(url, { method: isNew ? "POST" : "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) })
      if (!res.ok) throw new Error()
      toast.success(isNew ? "Created" : "Updated")
      setDialogOpen(false); fetchProducts()
    } catch { toast.error("Save failed") }
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { id } = deleteConfirm
    setDeleteConfirm(null)
    await fetch(`/api/products/${id}`, { method: "DELETE" })
    toast.success("Deleted"); fetchProducts()
  }

  const toggleActive = async (p: Product) => {
    await fetch(`/api/products/${p.id}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...p, active: !p.active }) })
    fetchProducts()
  }

  if (loading) return <div className="py-20 text-center text-gray-400">Loading...</div>

  return (
    <div>
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold">Products ({products.length})</h1>
        <div className="flex items-center gap-2">
          <input type="file" accept=".csv" className="hidden" id="csv-import" onChange={handleCSVImport} disabled={importing} />
          <label htmlFor="csv-import" className={`inline-flex items-center gap-1 px-3 py-1.5 text-sm border rounded-lg cursor-pointer hover:bg-gray-50 ${importing ? 'pointer-events-none opacity-60' : ''}`}>
            <Upload className="h-4 w-4" />
            {importing ? `Importing ${csvProgress}/${csvTotal}...` : "Import CSV"}
          </label>
          <Button className="bg-amber-500 hover:bg-amber-600 gap-1" onClick={() => { setEditing({ ...EMPTY }); setDialogOpen(true) }}>
            <Plus className="h-4 w-4" /> Add Product
          </Button>
        </div>
      </div>

      {importing && (
        <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-700">
          <div className="flex items-center justify-between mb-1">
            <span>Importing products...</span>
            <span>{csvProgress} of {csvTotal}</span>
          </div>
          <div className="w-full bg-blue-200 rounded-full h-2">
            <div className="bg-blue-600 h-2 rounded-full transition-all duration-200" style={{ width: `${csvTotal > 0 ? Math.round((csvProgress / csvTotal) * 100) : 0}%` }} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 mb-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} />
        </div>
        {selected.size > 0 && (
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={() => bulkToggle(true)}>Show Selected</Button>
            <Button variant="outline" size="sm" onClick={() => bulkToggle(false)}>Hide Selected</Button>
            <Button variant="destructive" size="sm" onClick={() => setBulkDeleteOpen(true)}>Delete ({selected.size})</Button>
            <Button variant="outline" size="sm" onClick={() => { setBulkPriceValue(0); setBulkPriceMode('fixed'); setBulkPriceOpen(true) }}><DollarSign className="h-4 w-4 mr-1" /> Bulk Price</Button>
          </div>
        )}
      </div>

      <div className="bg-white border rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="p-3 w-10"><input type="checkbox" checked={paged.length > 0 && selected.size === paged.length} onChange={selectAll} /></th>
                <th className="text-left p-3 font-medium cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort("name")}>
                  <span className="inline-flex items-center">Product{sortIcon("name")}</span>
                </th>
                <th className="text-left p-3 font-medium">Category</th>
                <th className="text-right p-3 font-medium cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort("price_ghs")}>
                  <span className="inline-flex items-center justify-end w-full">Price{sortIcon("price_ghs")}</span>
                </th>
                <th className="text-right p-3 font-medium cursor-pointer select-none hover:bg-gray-100 transition-colors" onClick={() => handleSort("stock")}>
                  <span className="inline-flex items-center justify-end w-full">Stock{sortIcon("stock")}</span>
                </th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium w-20">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {paged.map(p => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="p-3"><input type="checkbox" checked={selected.has(p.id)} onChange={() => toggleSelect(p.id)} /></td>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <div className="h-8 w-8 bg-gray-100 rounded flex items-center justify-center text-lg overflow-hidden flex-shrink-0">
                        {p.images?.[0] ? <img src={p.images[0]} alt="" className="h-full w-full object-cover" /> : "PU"}
                      </div>
                      <div className="min-w-0">
                        <p className="font-medium truncate">{p.name}</p>
                        {p.featured && <Badge variant="secondary" className="text-xs">Featured</Badge>}
                      </div>
                    </div>
                  </td>
                  <td className="p-3 text-gray-500 capitalize">{p.category?.replace("-", " ")}</td>
                  <td className="p-3 text-right font-medium"> {formatPrice(p.price_ghs ?? 0)}</td>
                  <td className={`p-3 text-right ${(p.stock || 0) <= 5 ? "text-red-500 font-bold" : ""}`}>{p.stock || 0}</td>
                  <td className="p-3 text-center">
                    <button onClick={() => toggleActive(p)}>
                      {p.active ? <Badge className="bg-green-100 text-green-700"><Eye className="h-3 w-3 mr-1" />Active</Badge>
                        : <Badge variant="secondary"><EyeOff className="h-3 w-3 mr-1" />Hidden</Badge>}
                    </button>
                  </td>
                  <td className="p-3">
                    <div className="flex gap-1">
                      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={async () => { const res = await fetch(`/api/products/${p.id}`); const full = await res.json(); setEditing(full); setDialogOpen(true) }}><Edit className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-red-500" onClick={() => setDeleteConfirm({ id: p.id, name: p.name })}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </td>
                </tr>
              ))}
              {paged.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-gray-400">No products found</td></tr>}
            </tbody>
          </table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between border-t px-4 py-3">
            <span className="text-sm text-gray-500">Page {page + 1} of {totalPages}</span>
            <div className="flex gap-1">
              <Button variant="outline" size="sm" disabled={page === 0} onClick={() => setPage(p => p - 1)}><ChevronLeft className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}><ChevronRight className="h-4 w-4" /></Button>
            </div>
          </div>
        )}
      </div>

      {/* Bulk Price Dialog */}
      <Dialog open={bulkPriceOpen} onOpenChange={setBulkPriceOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Bulk Price Edit</DialogTitle></DialogHeader>
          <div className="space-y-4 py-4">
            <p className="text-sm text-gray-500">Update prices for {selected.size} selected product(s).</p>
            <div className="flex gap-2">
              <Button
                variant={bulkPriceMode === 'fixed' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkPriceMode('fixed')}
                className={bulkPriceMode === 'fixed' ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                Fixed (GHS)
              </Button>
              <Button
                variant={bulkPriceMode === 'percent' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setBulkPriceMode('percent')}
                className={bulkPriceMode === 'percent' ? 'bg-amber-500 hover:bg-amber-600' : ''}
              >
                Percent (%)
              </Button>
            </div>
            <div className="space-y-1.5">
              <Label>{bulkPriceMode === 'fixed' ? 'Amount (GHS)' : 'Percentage (%)'}</Label>
              <Input
                type="number"
                value={bulkPriceValue}
                onChange={e => setBulkPriceValue(Number(e.target.value))}
                placeholder={bulkPriceMode === 'fixed' ? 'e.g. 50 to add GHS 50' : 'e.g. -10 to reduce by 10%'}
              />
              <p className="text-xs text-gray-400">
                {bulkPriceMode === 'fixed' ? 'Positive = increase, negative = decrease. Applied to all selected products.' : 'Negative = discount. Original prices updated proportionally.'}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setBulkPriceOpen(false)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={bulkPriceEdit}>Apply to {selected.size} Products</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Single Delete Confirm */}
      <ConfirmDialog
        open={deleteConfirm !== null}
        onOpenChange={(open) => { if (!open) setDeleteConfirm(null) }}
        title="Delete Product"
        description={deleteConfirm ? `Are you sure you want to delete "${deleteConfirm.name}"? This action cannot be undone.` : ""}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={handleDelete}
      />

      {/* Bulk Delete Confirm */}
      <ConfirmDialog
        open={bulkDeleteOpen}
        onOpenChange={setBulkDeleteOpen}
        title="Delete Products"
        description={`Are you sure you want to delete ${selected.size} product${selected.size !== 1 ? 's' : ''}? This action cannot be undone.`}
        confirmLabel={`Delete ${selected.size}`}
        variant="destructive"
        onConfirm={bulkDelete}
      />

      {/* Add/Edit Product Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editing?.id ? "Edit Product" : "Add Product"}</DialogTitle></DialogHeader>
          <Tabs defaultValue="general">
            <TabsList className="mb-4">
              <TabsTrigger value="general">General</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="variants">Variants (SKU)</TabsTrigger>
            </TabsList>
            <TabsContent value="general" className="space-y-4">
            <div className="space-y-1.5">
              <Label>Name *</Label>
              <Input value={editing?.name || ""} onChange={e => setEditing({ ...editing, name: e.target.value })} />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Category</Label>
                <Select value={editing?.category || "televisions"} onValueChange={(v) => setEditing({ ...editing, category: v ?? "televisions" })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>{CATEGORIES.map(c => <SelectItem key={c.value} value={c.value}>{c.label}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Price (GHS) *</Label>
                <Input type="number" value={editing?.price_ghs || 0} onChange={e => setEditing({ ...editing, price_ghs: Number(e.target.value) })} />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Original Price</Label>
                <Input type="number" value={editing?.original_price || ""} onChange={e => setEditing({ ...editing, original_price: e.target.value ? Number(e.target.value) : null })} />
              </div>
              <div className="space-y-1.5">
                <Label>Stock</Label>
                <Input type="number" value={editing?.stock || 0} onChange={e => setEditing({ ...editing, stock: Number(e.target.value) })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Description</Label>
              <Textarea rows={3} value={editing?.description || ""} onChange={e => setEditing({ ...editing, description: e.target.value })} />
            </div>
            <div className="space-y-2">
              <Label>Images</Label>
              <ImageUpload images={editing?.images || []} onChange={images => setEditing({ ...editing, images })} />
            </div>
            <div className="space-y-2">
              <Label>Specifications</Label>
              <SpecsEditor specs={editing?.specs || {}} onChange={specs => setEditing({ ...editing, specs })} />
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing?.featured || false} onChange={e => setEditing({ ...editing, featured: e.target.checked })} />Featured</label>
              <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={editing?.active ?? true} onChange={e => setEditing({ ...editing, active: e.target.checked })} />Active</label>
            </div>
            </TabsContent>
            <TabsContent value="seo" className="space-y-4 pt-2">
              <div className="space-y-1.5">
                <Label>SEO Title</Label>
                <p className="text-xs text-gray-400">Overrides default title pattern</p>
                <Input value={editing?.seo_title || ""} onChange={e => setEditing({ ...editing, seo_title: e.target.value })} placeholder="Leave empty for auto-generate" />
              </div>
              <div className="space-y-1.5">
                <Label>SEO Description</Label>
                <p className="text-xs text-gray-400">Overrides auto-excerpt from product description</p>
                <Textarea rows={3} value={editing?.seo_description || ""} onChange={e => setEditing({ ...editing, seo_description: e.target.value })} placeholder="Leave empty for auto-generate" />
              </div>
              <div className="space-y-1.5">
                <Label>SEO Keywords</Label>
                <Input value={editing?.seo_keywords || ""} onChange={e => setEditing({ ...editing, seo_keywords: e.target.value })} placeholder="comma, separated, keywords" />
              </div>
            
</TabsContent>
            <TabsContent value="variants" className="space-y-4 pt-2">
              <VariantEditor variants={(editing?.variants || []) as any} onChange={(variants: any) => setEditing({ ...editing, variants } as any)} />
            </TabsContent>
          </Tabs>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button className="bg-amber-500 hover:bg-amber-600" onClick={handleSave}>Save Product</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
