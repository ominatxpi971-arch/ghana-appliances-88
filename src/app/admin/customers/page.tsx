"use client"

import { useState, useEffect, useCallback } from "react"
import {
  Search, Calendar, RefreshCw, AlertCircle, User,
  ChevronLeft, ChevronRight, ArrowUpDown, Trash2, Eye
} from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle
} from "@/components/ui/dialog"
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow
} from "@/components/ui/table"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { getStatusLabel } from "@/lib/status-labels"
import { toast } from "sonner"

type Customer = {
  id: string
  user_id: string | null
  first_name: string
  last_name: string
  email: string | null
  phone: string | null
  city: string | null
  region: string | null
  address: string | null
  created_at: string
}

type SortField = "name" | "joined"
type SortDir = "asc" | "desc"

const PAGE_SIZE = 12

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([])
  const [search, setSearch] = useState("")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Detail modal
  const [detail, setDetail] = useState<Customer | null>(null)
  const [orders, setOrders] = useState<any[]>([])
  const [loadingOrders, setLoadingOrders] = useState(false)

  // Delete
  const [deleteTarget, setDeleteTarget] = useState<Customer | null>(null)
  const [deleting, setDeleting] = useState(false)

  // Sorting
  const [sortField, setSortField] = useState<SortField>("joined")
  const [sortDir, setSortDir] = useState<SortDir>("desc")

  // Pagination
  const [page, setPage] = useState(0)

  const fetchCustomers = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch("/api/profiles")
      if (!res.ok) throw new Error(`HTTP ` + res.status)
      const data = await res.json()
      setCustomers(Array.isArray(data) ? data : [])
    } catch (e: any) {
      setError(e.message || "Failed to load")
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchCustomers()
  }, [fetchCustomers])

  // ---- Detail modal ----
  const viewCustomer = async (c: Customer) => {
    setDetail(c)
    setLoadingOrders(true)
    try {
      let url = "/api/orders?"
      if (c.user_id) url += "userId=" + c.user_id
      else if (c.email) url += "email=" + encodeURIComponent(c.email)
      else {
        setOrders([])
        setLoadingOrders(false)
        return
      }
      const res = await fetch(url)
      const data = await res.json()
      setOrders(Array.isArray(data) ? data : [])
    } catch {
      setOrders([])
    } finally {
      setLoadingOrders(false)
    }
  }

  // ---- Delete ----
  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const res = await fetch(`/api/profiles/${deleteTarget.id}`, {
        method: "DELETE",
      })
      if (res.ok) {
        toast.success(`Deleted ${deleteTarget.first_name} ${deleteTarget.last_name}`)
        setCustomers(prev => prev.filter(c => c.id !== deleteTarget.id))
        setDeleteTarget(null)
      } else {
        const data = await res.json().catch(() => ({}))
        toast.error(data.error || "Delete failed")
      }
    } catch {
      toast.error("Network error")
    } finally {
      setDeleting(false)
    }
  }

  // ---- Filter ----
  const filtered = customers.filter(c => {
    if (!search) return true
    const q = search.toLowerCase()
    return (
      (c.first_name + " " + c.last_name).toLowerCase().includes(q) ||
      (c.email || "").toLowerCase().includes(q) ||
      (c.phone || "").includes(q)
    )
  })

  // ---- Sort ----
  const sorted = [...filtered].sort((a, b) => {
    const dir = sortDir === "asc" ? 1 : -1
    if (sortField === "name") {
      const na = (a.first_name + " " + a.last_name).toLowerCase()
      const nb = (b.first_name + " " + b.last_name).toLowerCase()
      return na < nb ? -dir : na > nb ? dir : 0
    }
    // joined
    const da = a.created_at ? new Date(a.created_at).getTime() : 0
    const db = b.created_at ? new Date(b.created_at).getTime() : 0
    return (da - db) * dir
  })

  // ---- Paginate ----
  const totalPages = Math.ceil(sorted.length / PAGE_SIZE)
  const safePage = Math.min(page, Math.max(0, totalPages - 1))
  const paged = sorted.slice(safePage * PAGE_SIZE, safePage * PAGE_SIZE + PAGE_SIZE)

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortField(field)
      setSortDir("asc")
    }
    setPage(0)
  }

  const sortIcon = (field: SortField) => {
    if (sortField !== field)
      return <ArrowUpDown className="h-3.5 w-3.5 ml-1 text-gray-300" />
    return (
      <span className="ml-1 text-amber-500">
        {sortDir === "asc" ? "\u2191" : "\u2193"}
      </span>
    )
  }

  // ---- Loading ----
  if (loading)
    return (
      <div className="py-20 text-center text-gray-400">
        <RefreshCw className="h-6 w-6 mx-auto mb-3 animate-spin" />
        Loading customers...
      </div>
    )

  // ---- Error ----
  if (error)
    return (
      <div className="py-20 text-center">
        <AlertCircle className="h-10 w-10 mx-auto mb-3 text-red-400" />
        <p className="text-red-500 font-medium">Failed to load</p>
        <p className="text-sm text-gray-400 mb-4">{error}</p>
        <Button variant="outline" size="sm" onClick={fetchCustomers}>
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    )

  return (
    <div>
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">
          Customers ({filtered.length})
        </h1>
        <Button variant="outline" size="sm" onClick={fetchCustomers}>
          <RefreshCw className="h-4 w-4" />
        </Button>
      </div>

      {/* Search */}
      <div className="mb-4 max-w-md">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search by name, email or phone..."
            value={search}
            onChange={e => {
              setSearch(e.target.value)
              setPage(0)
            }}
            className="pl-10"
          />
        </div>
      </div>

      {/* Empty state */}
      {filtered.length === 0 ? (
        <div className="py-20 text-center text-gray-400">
          <User className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>No customers found</p>
        </div>
      ) : (
        <>
          {/* Table */}
          <div className="border rounded-lg overflow-hidden bg-white">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("name")}
                  >
                    <span className="inline-flex items-center">
                      Name{sortIcon("name")}
                    </span>
                  </TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                  <TableHead>City</TableHead>
                  <TableHead>Region</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead
                    className="cursor-pointer select-none"
                    onClick={() => toggleSort("joined")}
                  >
                    <span className="inline-flex items-center">
                      Joined Date{sortIcon("joined")}
                    </span>
                  </TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">
                      {c.first_name} {c.last_name}
                    </TableCell>
                    <TableCell className="text-gray-500 max-w-[180px] truncate">
                      {c.email || "\u2014"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {c.phone || "\u2014"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {c.city || "\u2014"}
                    </TableCell>
                    <TableCell className="text-gray-500">
                      {c.region || "\u2014"}
                    </TableCell>
                    <TableCell>
                      {c.user_id ? (
                        <Badge className="bg-green-100 text-green-700">
                          Registered
                        </Badge>
                      ) : (
                        <Badge className="bg-gray-100 text-gray-600">
                          Guest
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell className="text-gray-500 text-sm">
                      {c.created_at
                        ? new Date(c.created_at).toLocaleDateString()
                        : "\u2014"}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => viewCustomer(c)}
                          title="View details"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setDeleteTarget(c)}
                          title="Delete customer"
                          className="text-red-500 hover:text-red-700 hover:bg-red-50"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between mt-4 text-sm">
              <span className="text-gray-500">
                Showing {safePage * PAGE_SIZE + 1}\u2013
                {Math.min((safePage + 1) * PAGE_SIZE, sorted.length)} of{" "}
                {sorted.length}
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.max(0, p - 1))}
                  disabled={safePage === 0}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="px-2 text-gray-600">
                  {safePage + 1} / {totalPages}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                  disabled={safePage >= totalPages - 1}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Detail Dialog */}
      <Dialog
        open={!!detail}
        onOpenChange={() => {
          setDetail(null)
          setOrders([])
        }}
      >
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {detail?.first_name} {detail?.last_name}
            </DialogTitle>
          </DialogHeader>
          {detail && (
            <div className="space-y-4 py-4">
              <div className="bg-gray-50 rounded-lg p-4 space-y-2">
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div>
                    <span className="text-gray-400">Email:</span>{" "}
                    <span className="font-medium">
                      {detail.email || "\u2014"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Phone:</span>{" "}
                    <span className="font-medium">
                      {detail.phone || "\u2014"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">City:</span>{" "}
                    <span className="font-medium">
                      {detail.city || "\u2014"}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400">Region:</span>{" "}
                    <span className="font-medium">
                      {detail.region || "\u2014"}
                    </span>
                  </div>
                </div>
                {detail.address && (
                  <div className="text-sm">
                    <span className="text-gray-400">Address:</span>{" "}
                    <span className="font-medium">{detail.address}</span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  {detail.user_id ? (
                    <Badge className="bg-green-100 text-green-700">
                      Registered
                    </Badge>
                  ) : (
                    <Badge className="bg-gray-100 text-gray-600">Guest</Badge>
                  )}
                  <span className="text-xs text-gray-400 flex items-center gap-1">
                    <Calendar className="h-3 w-3" />
                    Joined{" "}
                    {detail.created_at
                      ? new Date(detail.created_at).toLocaleDateString()
                      : "unknown"}
                  </span>
                </div>
              </div>
              <div>
                <h4 className="font-semibold text-sm mb-2">Order History</h4>
                {loadingOrders ? (
                  <p className="text-sm text-gray-400">Loading...</p>
                ) : orders.length === 0 ? (
                  <p className="text-sm text-gray-400">No orders</p>
                ) : (
                  <div className="space-y-2">
                    {orders.map(o => (
                      <div key={o.id} className="bg-gray-50 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <span className="text-sm font-medium">
                            #{(o.id + "").slice(0, 8)}
                          </span>
                          <Badge
                            className={
                              o.status === "delivered"
                                ? "bg-green-100 text-green-700"
                                : o.status === "cancelled"
                                  ? "bg-red-100 text-red-700"
                                  : "bg-yellow-100 text-yellow-700"
                            }
                          >
                            {getStatusLabel(o.status)}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm mt-1">
                          <span className="text-gray-400">
                            {o.created_at
                              ? new Date(o.created_at).toLocaleDateString()
                              : ""}
                          </span>
                          <span className="font-bold text-amber-600">
                            GH\u20B5 {(o.total_ghs || 0).toLocaleString()}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirm */}
      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={() => setDeleteTarget(null)}
        title="Delete Customer"
        description={
          deleteTarget ? (
            <>
              Are you sure you want to delete{" "}
              <strong>
                {deleteTarget.first_name} {deleteTarget.last_name}
              </strong>
              {deleteTarget.email && <> ({deleteTarget.email})</>}? This action
              cannot be undone.
            </>
          ) : undefined
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={deleting}
        onConfirm={handleDelete}
      />
    </div>
  )
}