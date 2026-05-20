"use client"

import { useState, useEffect, useCallback } from "react"
import { Plus, Search, Trash2, Pencil, Tag, Percent, RefreshCw } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

interface Coupon {
  id: string
  code: string
  discount: number
  type: "percent" | "fixed"
  min_order: number
  max_uses: number
  used: number
  active: boolean
  created_at: string
  expires_at?: string | null
}

const EMPTY: Partial<Coupon> = { code: "", discount: 0, type: "fixed", min_order: 0, max_uses: 0, active: true, expires_at: null }

export default function AdminCoupons() {
  const [coupons, setCoupons] = useState<Coupon[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogMode, setDialogMode] = useState<"create" | "edit">("create")
  const [editing, setEditing] = useState<Partial<Coupon>>(EMPTY)
  const [saving, setSaving] = useState(false)
  const [deleteId, setDeleteId] = useState<string | null>(null)
  const [deleting, setDeleting] = useState(false)

  const fetchCoupons = useCallback(async () => {
    try {
      const res = await fetch("/api/coupons")
      setCoupons(await res.json())
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchCoupons() }, [fetchCoupons])

  const validateCoupon = (c: Partial<Coupon>): string | null => {
    if (!c.code || !c.code.trim()) return "Code is required"
    if (c.discount === undefined || c.discount === null) return "Discount is required"
    if (c.type === "percent" && (c.discount < 1 || c.discount > 100)) return "Percent discount must be between 1 and 100"
    if (c.type === "fixed" && c.discount < 0) return "Fixed discount must be 0 or greater"
    if (c.min_order !== undefined && c.min_order < 0) return "Min order cannot be negative"
    if (c.max_uses !== undefined && c.max_uses < 0) return "Max uses cannot be negative"
    return null
  }

  const handleSave = async () => {
    const err = validateCoupon(editing)
    if (err) { toast.error(err); return }

    setSaving(true)
    try {
      const isEdit = dialogMode === "edit"
      const method = isEdit ? "PUT" : "POST"
      const res = await fetch("/api/coupons", { method, headers: { "Content-Type": "application/json" }, body: JSON.stringify(editing) })
      if (!res.ok) throw new Error()
      toast.success(isEdit ? "Coupon updated!" : "Coupon created!")
      setDialogOpen(false)
      setEditing(EMPTY)
      setDialogMode("create")
      fetchCoupons()
    } catch { toast.error(dialogMode === "edit" ? "Failed to update coupon" : "Failed to create coupon") }
    finally { setSaving(false) }
  }

  const handleEdit = (coupon: Coupon) => {
    setEditing({ ...coupon })
    setDialogMode("edit")
    setDialogOpen(true)
  }

  const openCreate = () => {
    setEditing(EMPTY)
    setDialogMode("create")
    setDialogOpen(true)
  }

  const handleToggle = async (coupon: Coupon) => {
    try {
      await fetch("/api/coupons", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...coupon, active: !coupon.active }) })
      fetchCoupons()
    } catch { toast.error("Failed to update") }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    setDeleting(true)
    try {
      await fetch(`/api/coupons?id=${deleteId}`, { method: "DELETE" })
      toast.success("Coupon deleted")
      setDeleteId(null)
      fetchCoupons()
    } catch { toast.error("Failed to delete") }
    finally { setDeleting(false) }
  }

  const isExpired = (c: Coupon) => c.expires_at ? new Date(c.expires_at) < new Date() : false

  const filtered = coupons.filter(c => c.code.toLowerCase().includes(search.toLowerCase()))

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Coupons</h1>
        <div className="flex gap-2">
          <Button onClick={fetchCoupons} variant="outline" size="sm"><RefreshCw className="h-4 w-4 mr-1" /> Refresh</Button>
          <Button onClick={openCreate} className="bg-amber-500 hover:bg-amber-600"><Plus className="h-4 w-4 mr-1" /> New Coupon</Button>
        </div>
      </div>

      <div className="mb-4">
        <div className="relative max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input placeholder="Search coupons..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9" />
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 py-12 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Tag className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>{search ? "No matching coupons" : "No coupons yet. Create your first coupon!"}</p>
        </div>
      ) : (
        <div className="bg-white border rounded-xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="text-left p-3 font-medium">Code</th>
                <th className="text-left p-3 font-medium">Discount</th>
                <th className="text-left p-3 font-medium">Min Order</th>
                <th className="text-center p-3 font-medium">Used / Max</th>
                <th className="text-center p-3 font-medium">Status</th>
                <th className="text-right p-3 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map(c => (
                <tr key={c.id} className={`hover:bg-gray-50 ${isExpired(c) ? "opacity-50 bg-gray-50" : ""}`}>
                  <td className="p-3">
                    <div className="flex items-center gap-2">
                      <Tag className="h-4 w-4 text-amber-500" />
                      <span className="font-mono font-bold">{c.code}</span>
                    </div>
                  </td>
                  <td className="p-3">
                    <span className="font-bold text-green-600">
                      {c.type === "percent" ? `${c.discount}%` : `GHS ${c.discount.toFixed(2)}`}
                    </span>
                  </td>
                  <td className="p-3 text-gray-500">{c.min_order > 0 ? `GHS ${c.min_order.toFixed(2)}` : "—"}</td>
                  <td className="p-3 text-center">
                    <span className={c.max_uses > 0 && c.used >= c.max_uses ? "text-red-600 font-bold" : ""}>
                      {c.used}{c.max_uses > 0 ? ` / ${c.max_uses}` : ""}
                    </span>
                  </td>
                  <td className="p-3 text-center">
                    <div className="flex flex-col items-center gap-1">
                      <button onClick={() => handleToggle(c)}>
                        <Badge className={c.active ? "bg-green-100 text-green-700 hover:bg-green-200" : "bg-gray-100 text-gray-400 hover:bg-gray-200"}>
                          {c.active ? "Active" : "Inactive"}
                        </Badge>
                      </button>
                      {isExpired(c) && <Badge className="bg-red-100 text-red-600 text-xs">Expired</Badge>}
                    </div>
                  </td>
                  <td className="p-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(c)} className="text-blue-500 hover:text-blue-700">
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => setDeleteId(c.id)} className="text-red-500 hover:text-red-700">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{dialogMode === "edit" ? "Edit Coupon" : "Create Coupon"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>Coupon Code</Label>
              <Input value={editing.code || ""} onChange={e => setEditing(p => ({ ...p, code: e.target.value.toUpperCase() }))} placeholder="e.g. WELCOME10" />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Type</Label>
                <Select value={editing.type || "fixed"} onValueChange={v => setEditing(p => ({ ...p, type: v as "percent" | "fixed" }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fixed">Fixed (GHS)</SelectItem>
                    <SelectItem value="percent">Percent (%)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>Discount {editing.type === "percent" ? "(%)" : "(GHS)"}</Label>
                <Input
                  type="number"
                  min={editing.type === "percent" ? 1 : 0}
                  max={editing.type === "percent" ? 100 : undefined}
                  value={editing.discount ?? ""}
                  onChange={e => setEditing(p => ({ ...p, discount: Number(e.target.value) }))}
                />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Min Order (GHS, 0 = no min)</Label>
                <Input type="number" value={editing.min_order || 0} onChange={e => setEditing(p => ({ ...p, min_order: Number(e.target.value) }))} />
              </div>
              <div className="space-y-1.5">
                <Label>Max Uses (0 = unlimited)</Label>
                <Input type="number" value={editing.max_uses || 0} onChange={e => setEditing(p => ({ ...p, max_uses: parseInt(e.target.value) }))} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>Expiration Date</Label>
              <Input
                type="date"
                value={editing.expires_at ? editing.expires_at.slice(0, 10) : ""}
                onChange={e => setEditing(p => ({ ...p, expires_at: e.target.value ? new Date(e.target.value).toISOString() : null }))}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600">
              {saving ? "Saving..." : dialogMode === "edit" ? "Save Changes" : "Create Coupon"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={v => { if (!v) setDeleteId(null) }}
        title="Delete Coupon"
        description="Are you sure you want to delete this coupon? This action cannot be undone."
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}
