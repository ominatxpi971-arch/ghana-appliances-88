"use client"

import { formatPrice } from "@/lib/utils";
import { getStatusLabel, STATUS_LIST } from "@/lib/status-labels";
import { useState, useEffect, useCallback, useMemo } from "react"
import { Search, Download, Mail, AlertCircle, RefreshCw, Trash2, CheckSquare, Square, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { Order, OrderStatus } from "@/lib/types"
import { toast } from "sonner"

const PAGE_SIZE = 15

type SortField = "id" | "customer_name" | "total_ghs" | "created_at"

const STATUS_COLORS: Record<OrderStatus, string> = {
  pending: "bg-yellow-100 text-yellow-700", confirmed: "bg-blue-100 text-blue-700",
  shipping: "bg-purple-100 text-purple-700", delivered: "bg-green-100 text-green-700", cancelled: "bg-red-100 text-red-700",
}

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([])
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")
  const [sortField, setSortField] = useState<SortField>("created_at")
  const [sortDir, setSortDir] = useState<"asc"|"desc">("desc")
  const [page, setPage] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [detailOrder, setDetailOrder] = useState<Order | null>(null)
  const [selected, setSelected] = useState<Set<string|number>>(new Set())
  const [trackingModal, setTrackingModal] = useState<{ orderId: string | number } | null>(null)
  const [trackingNumber, setTrackingNumber] = useState("")
  const [trackingUrl, setTrackingUrl] = useState("")
  const [confirmOpen, setConfirmOpen] = useState(false)

  const handleExport = () => { window.open("/api/export-orders", "_blank") }

  const handleSendEmail = async (order: Order) => {
    const email = (order as any).customer_email
    if (!email) { toast.error("This order has no email address"); return }
    try {
      const res = await fetch("/api/send-email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId: order.id, to: email }) })
      if (res.ok) toast.success("Email sent!"); else toast.error("Failed to send email")
    } catch { toast.error("Network error") }
  }

  const fetchOrders = useCallback(async () => {
    setLoading(true); setError(null)
    try {
      const res = await fetch("/api/orders")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (!Array.isArray(data)) throw new Error("Invalid response")
      setOrders(data)
    } catch (e: any) {
      setError(e.message || "Failed to load")
      toast.error("Could not load orders")
    } finally { setLoading(false) }
  }, [])

  useEffect(() => { fetchOrders() }, [fetchOrders])

  const updateStatus = async (orderId: string|number, newStatus: string) => {
    try {
      const id = String(orderId)
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus })
      })
      if (res.ok) {
        toast.success(`Status changed to ${newStatus}`)
        fetchOrders()
      } else {
        const err = await res.text().catch(() => "")
        toast.error("Update failed: " + err)
      }
    } catch (e: any) { toast.error("Network error: " + (e?.message || "")) }
  }

  const handleShip = async () => {
    if (!trackingModal) return
    try {
      const res = await fetch(`/api/orders/${trackingModal.orderId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          status: "shipping", 
          tracking_number: trackingNumber,
          tracking_url: trackingUrl 
        }),
      })
      if (res.ok) {
        setTrackingModal(null)
        setTrackingNumber("")
        setTrackingUrl("")
        fetchOrders()
      }
    } catch (_) {}
  }

  const toggleSelect = (id: string|number) => {
    const next = new Set(selected)
    next.has(id) ? next.delete(id) : next.add(id)
    setSelected(next)
  }

  const selectAll = () => {
    if (selected.size === paged.length && paged.length > 0) setSelected(new Set())
    else setSelected(new Set(paged.map(o => o.id)))
  }

  const handleBulkDelete = async () => {
    try {
      const res = await fetch("/api/orders/bulk-delete", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids: [...selected] }) })
      const data = await res.json()
      toast.success(`Deleted ${data.deleted} order(s)`)
      setSelected(new Set())
      setConfirmOpen(false)
      fetchOrders()
    } catch { toast.error("Delete failed") }
  }

  const bulkStatus = async (status: string) => {
    if (selected.size === 0) return
    const promises = [...selected].map(id => {
      const sid = String(id)
      return fetch(`/api/orders/${sid}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status })
      }).catch(() => null)
    })
    await Promise.all(promises)
    toast.success(`Updated ${promises.length} orders to ${status}`)
    setSelected(new Set())
    fetchOrders()
  }

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(prev => prev === "asc" ? "desc" : "asc")
    } else {
      setSortField(field)
      setSortDir("asc")
    }
    setPage(0)
  }

  const filtered = useMemo(() => orders.filter(o => {
    if (filter !== "all" && o.status !== filter) return false
    if (search) {
      const q = search.toLowerCase()
      if (!(o.customer_name||"").toLowerCase().includes(q) && !(o.customer_phone||"").includes(q) && !String(o.id).includes(q)) return false
    }
    if (dateFrom) {
      const from = new Date(dateFrom)
      from.setHours(0, 0, 0, 0)
      if (o.created_at && new Date(o.created_at) < from) return false
    }
    if (dateTo) {
      const to = new Date(dateTo)
      to.setHours(23, 59, 59, 999)
      if (o.created_at && new Date(o.created_at) > to) return false
    }
    return true
  }), [orders, filter, search, dateFrom, dateTo])

  const sorted = useMemo(() => {
    const copy = [...filtered]
    copy.sort((a, b) => {
      let va: any, vb: any
      switch (sortField) {
        case "id":
          va = String(a.id); vb = String(b.id)
          break
        case "customer_name":
          va = (a.customer_name || "").toLowerCase()
          vb = (b.customer_name || "").toLowerCase()
          break
        case "total_ghs":
          va = a.total_ghs || 0; vb = b.total_ghs || 0
          break
        case "created_at":
          va = a.created_at ? new Date(a.created_at).getTime() : 0
          vb = b.created_at ? new Date(b.created_at).getTime() : 0
          break
        default:
          return 0
      }
      if (va < vb) return sortDir === "asc" ? -1 : 1
      if (va > vb) return sortDir === "asc" ? 1 : -1
      return 0
    })
    return copy
  }, [filtered, sortField, sortDir])

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE))
  const paged = sorted.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE)

  // Reset page when filters change
  useEffect(() => { setPage(0) }, [search, filter, dateFrom, dateTo])

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) return <ArrowUpDown className="h-3.5 w-3.5 text-gray-300" />
    return sortDir === "asc" ? <ArrowUp className="h-3.5 w-3.5 text-amber-500" /> : <ArrowDown className="h-3.5 w-3.5 text-amber-500" />
  }

  if (loading) return <div className="py-20 text-center text-gray-400"><RefreshCw className="h-6 w-6 mx-auto mb-3 animate-spin" />Loading orders...</div>

  if (error) return <div className="py-20 text-center"><AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" /><p className="text-red-500 font-medium mb-2">Failed to load</p><p className="text-sm text-gray-400 mb-4">{error}</p><Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4 mr-2" />Retry</Button></div>

  return <div>
    <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
      <h1 className="text-2xl font-bold">Orders ({sorted.length})</h1>
      <div className="flex gap-2 items-center flex-wrap">
        {selected.size > 0 && <><span className="text-sm text-gray-500">{selected.size} selected</span><Button variant="outline" size="sm" onClick={() => bulkStatus("confirmed")}>Confirm</Button><Button variant="outline" size="sm" onClick={() => bulkStatus("shipping")}>In transit</Button><Button variant="outline" size="sm" className="text-red-500" onClick={() => setConfirmOpen(true)}><Trash2 className="h-4 w-4 mr-1" />Delete</Button></>}
        <Button variant="outline" size="sm" onClick={fetchOrders}><RefreshCw className="h-4 w-4" /></Button>
        <Button variant="outline" size="sm" onClick={handleExport}><Download className="h-4 w-4 mr-1" />Export</Button>
      </div>
    </div>

    <div className="flex flex-col sm:flex-row gap-3 mb-3 flex-wrap">
      <div className="relative flex-1 max-w-md"><Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" /><Input placeholder="Search orders..." className="pl-9" value={search} onChange={e => { setSearch(e.target.value); setPage(0) }} /></div>
      <Select value={filter} onValueChange={v => setFilter(v??"all")}><SelectTrigger className="w-full sm:w-[180px]"><SelectValue /></SelectTrigger><SelectContent>{["all", ...STATUS_LIST].map(s => <SelectItem key={s} value={s}>{s==="all"?"All Statuses":getStatusLabel(s)}</SelectItem>)}</SelectContent></Select>
      <div className="flex items-center gap-2">
        <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="w-full sm:w-[150px] text-sm" />
        <span className="text-gray-400 text-sm">to</span>
        <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="w-full sm:w-[150px] text-sm" />
        {(dateFrom || dateTo) && <Button variant="ghost" size="sm" onClick={() => { setDateFrom(""); setDateTo("") }} className="text-xs">Clear</Button>}
      </div>
    </div>

    {/* Sort bar */}
    <div className="flex items-center gap-4 mb-3 text-sm text-gray-500 border-b pb-2">
      <button onClick={() => toggleSort("id")} className="flex items-center gap-1 hover:text-gray-700 transition-colors">Order ID {renderSortIcon("id")}</button>
      <button onClick={() => toggleSort("customer_name")} className="flex items-center gap-1 hover:text-gray-700 transition-colors">Customer {renderSortIcon("customer_name")}</button>
      <button onClick={() => toggleSort("total_ghs")} className="flex items-center gap-1 hover:text-gray-700 transition-colors">Total {renderSortIcon("total_ghs")}</button>
      <button onClick={() => toggleSort("created_at")} className="flex items-center gap-1 hover:text-gray-700 transition-colors">Date {renderSortIcon("created_at")}</button>
    </div>

    <div className="flex items-center gap-2 mb-3">
      <button onClick={selectAll} className="text-sm text-gray-500 hover:text-gray-700 flex items-center gap-1">{selected.size === paged.length && paged.length > 0 ? <CheckSquare className="h-4 w-4 text-amber-500" /> : <Square className="h-4 w-4" />}Select Page ({paged.length})</button>
      <span className="text-xs text-gray-300">| {sorted.length} total</span>
    </div>

    {paged.length === 0 ? <div className="py-20 text-center text-gray-400">No orders found</div> : <div className="grid gap-3">
      {paged.map(order => <div key={order.id} className="bg-white border rounded-xl p-4 hover:border-amber-300 transition-colors">
        <div className="flex items-start gap-3">
          <button onClick={e => { e.stopPropagation(); toggleSelect(order.id) }} className="mt-1 flex-shrink-0">{selected.has(order.id) ? <CheckSquare className="h-5 w-5 text-amber-500" /> : <Square className="h-5 w-5 text-gray-300" />}</button>
          <div className="flex-1 cursor-pointer" onClick={() => setDetailOrder(order)}>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-semibold">{order.customer_name || "Unknown"}</h3>
                <p className="text-sm text-gray-500">{order.customer_phone || ""}</p>
              </div>
              <div className="text-right">
                <Badge className={STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}>{getStatusLabel(order.status)}</Badge>
                <p className="text-lg font-bold text-amber-600 mt-1">{formatPrice(order.total_ghs || 0)}</p>
                <p className="text-xs text-gray-400">{order.created_at ? new Date(order.created_at).toLocaleString() : ""}</p>
              </div>
            </div>
            {order.items && order.items.length > 0 && <div className="border-t pt-3 flex flex-wrap items-center gap-2">{order.items.slice(0,3).map((item:any) => <Badge key={item.id} variant="secondary" className="text-xs">{item.product_name} x{item.quantity}</Badge>)}{order.items.length > 3 && <span className="text-xs text-gray-400">+{order.items.length-3} more</span>}</div>}
            {(order as any).customer_email && <button onClick={e=>{e.stopPropagation();handleSendEmail(order)}} className="mt-2 text-xs flex items-center gap-1 text-blue-500 hover:underline"><Mail className="h-3 w-3" />Send Email</button>}
          </div>
        </div>
      </div>)}
    </div>}

    {/* Pagination */}
    {totalPages > 1 && (
      <div className="flex items-center justify-center gap-2 mt-6">
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0}><ChevronLeft className="h-4 w-4" /></Button>
        {Array.from({ length: totalPages }, (_, i) => (
          <Button key={i} variant={i === page ? "default" : "outline"} size="sm" className={i === page ? "bg-amber-500 hover:bg-amber-600" : ""} onClick={() => setPage(i)}>{i + 1}</Button>
        ))}
        <Button variant="outline" size="sm" onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1}><ChevronRight className="h-4 w-4" /></Button>
        <span className="text-xs text-gray-400 ml-2">Page {page + 1} of {totalPages}</span>
      </div>
    )}

    <Dialog open={!!detailOrder} onOpenChange={() => setDetailOrder(null)}>
      <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
        <DialogHeader><DialogTitle>Order #{String(detailOrder?.id||"").slice(0,8)}</DialogTitle></DialogHeader>
        {detailOrder && <div className="space-y-4 py-4">
          <div className="flex items-center gap-2"><Badge className={STATUS_COLORS[detailOrder.status]||"bg-gray-100"}>{getStatusLabel(detailOrder.status)}</Badge><span className="text-sm text-gray-400">{detailOrder.created_at?new Date(detailOrder.created_at).toLocaleString():""}</span></div>
          {detailOrder.tracking_number && (
            <div className="mt-2 text-sm">
              <span className="font-medium">Tracking:</span> {detailOrder.tracking_number}
              {detailOrder.tracking_url && (
                <a href={detailOrder.tracking_url} target="_blank" rel="noopener noreferrer" className="ml-2 text-blue-600 underline text-xs">Track online →</a>
              )}
            </div>
          )}
          <div className="bg-gray-50 rounded-lg p-4 space-y-1"><h4 className="font-semibold text-sm">Customer</h4><p className="font-medium">{detailOrder.customer_name}</p><p className="text-sm text-gray-500">{detailOrder.customer_phone}</p>{(detailOrder as any).customer_email && <p className="text-sm text-gray-500">{(detailOrder as any).customer_email}</p>}</div>
          <div className="bg-gray-50 rounded-lg p-4"><h4 className="font-semibold text-sm mb-1">Address</h4><p className="text-sm text-gray-600">{detailOrder.customer_address}</p></div>
          <div><h4 className="font-semibold text-sm mb-2">Items</h4><div className="space-y-1">{detailOrder.items?.map((item:any) => <div key={item.id} className="flex justify-between text-sm border-b py-1"><span>{item.product_name} x{item.quantity}</span><span>{formatPrice((item.unit_price||0)*(item.quantity||1))}</span></div>)}</div><div className="flex justify-between font-bold text-lg mt-2 pt-2 border-t"><span>Total</span><span className="text-amber-600">{formatPrice(detailOrder.total_ghs||0)}</span></div></div>
          {detailOrder.notes && <div className="bg-yellow-50 rounded-lg p-3"><p className="text-sm"><strong>Note:</strong> {detailOrder.notes}</p></div>}
          <div className="space-y-2"><h4 className="font-semibold text-sm">Update Status</h4><div className="flex flex-wrap gap-2">{(["pending","confirmed","shipping","delivered","cancelled"] as OrderStatus[]).map(s => <button key={s} onClick={s==="shipping"?()=>setTrackingModal({orderId:detailOrder.id}):async()=>{await updateStatus(detailOrder.id,s)}} className={`px-3 py-1.5 text-sm rounded-md transition-colors border ${detailOrder.status===s?"ring-2 ring-amber-400 font-bold border-amber-400":"border-transparent"} ${STATUS_COLORS[s]||"bg-gray-100 text-gray-600"}`}>{getStatusLabel(s)}</button>)}</div></div>
        </div>}
      </DialogContent>
    </Dialog>

    {trackingModal && (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
          <h3 className="text-lg font-semibold mb-4">Ship Order - Tracking Info</h3>
          <div className="space-y-3">
            <div>
              <label className="block text-sm font-medium mb-1">Tracking Number</label>
              <input
                type="text"
                value={trackingNumber}
                onChange={e => setTrackingNumber(e.target.value)}
                placeholder="e.g. DH123456789GH"
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tracking URL (optional)</label>
              <input
                type="url"
                value={trackingUrl}
                onChange={e => setTrackingUrl(e.target.value)}
                placeholder="e.g. https://www.dhl.com/gh-en/home/tracking.html?tracking-id=..."
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 mt-4">
            <button onClick={() => { setTrackingModal(null); setTrackingNumber(""); setTrackingUrl("") }} className="px-4 py-2 text-sm border rounded">Cancel</button>
            <button onClick={handleShip} className="px-4 py-2 text-sm bg-blue-600 text-white rounded" disabled={!trackingNumber.trim()}>
              Confirm Shipment
            </button>
          </div>
        </div>
      </div>
    )}

    <ConfirmDialog
      open={confirmOpen}
      onOpenChange={setConfirmOpen}
      title={`Delete ${selected.size} order(s)?`}
      description="This action cannot be undone. All selected orders will be permanently removed."
      confirmLabel="Delete"
      variant="destructive"
      onConfirm={handleBulkDelete}
    />
  </div>
}

