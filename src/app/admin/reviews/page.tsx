"use client"

import { useState, useEffect, useCallback } from "react"
import { Search, Trash2, Star, User, Package, RefreshCw, MessageSquare, Check, X, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import { ConfirmDialog } from "@/components/ui/confirm-dialog"
import { toast } from "sonner"

interface Review {
  id: string
  product_id: string
  product_name?: string
  customer_name: string
  rating: number
  comment: string
  approved?: boolean
  created_at: string
}

const PAGE_SIZE = 12

export default function AdminReviews() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [page, setPage] = useState(1)
  const [totalCount, setTotalCount] = useState(0)
  const [starFilter, setStarFilter] = useState<number | null>(null)
  const [approvedFilter, setApprovedFilter] = useState<string | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Review | null>(null)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchReviews = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      params.set("page", String(page))
      params.set("pageSize", String(PAGE_SIZE))
      if (starFilter) params.set("rating", String(starFilter))
      if (approvedFilter) params.set("approved", approvedFilter)

      const res = await fetch(`/api/reviews?${params.toString()}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setTotalCount(data.count || 0)
    } catch {
      /* ignore */
    } finally {
      setLoading(false)
    }
  }, [page, starFilter, approvedFilter])

  useEffect(() => {
    fetchReviews()
  }, [fetchReviews])

  const handleDelete = async () => {
    if (!deleteTarget) return
    setActionLoading(deleteTarget.id)
    try {
      await fetch(`/api/reviews?id=${deleteTarget.id}`, { method: "DELETE" })
      toast.success("Review deleted")
      setDeleteTarget(null)
      fetchReviews()
    } catch {
      toast.error("Failed to delete")
    } finally {
      setActionLoading(null)
    }
  }

  const handleToggleApproved = async (review: Review) => {
    setActionLoading(review.id)
    try {
      const res = await fetch("/api/reviews", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: review.id, approved: !review.approved }),
      })
      const data = await res.json()
      if (data.error) {
        toast.error(data.error)
      } else {
        toast.success(review.approved ? "Review rejected" : "Review approved")
        fetchReviews()
      }
    } catch {
      toast.error("Failed to update review")
    } finally {
      setActionLoading(null)
    }
  }

  const totalPages = Math.ceil(totalCount / PAGE_SIZE)

  const renderStars = (n: number) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map((i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${i <= n ? "fill-amber-400 text-amber-400" : "text-gray-200"}`}
        />
      ))}
    </div>
  )

  const filtered = reviews.filter(
    (r) =>
      r.customer_name.toLowerCase().includes(search.toLowerCase()) ||
      r.comment.toLowerCase().includes(search.toLowerCase()) ||
      (r.product_name || "").toLowerCase().includes(search.toLowerCase())
  )

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-gray-500 mt-1">{totalCount} total reviews</p>
        </div>
        <Button onClick={fetchReviews} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-1" /> Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-4 mb-4">
        <div className="relative max-w-sm flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search reviews..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-1">
          <Filter className="h-4 w-4 text-gray-400 mr-1" />
          {[1, 2, 3, 4, 5].map((s) => (
            <Button
              key={s}
              variant={starFilter === s ? "default" : "outline"}
              size="sm"
              className="h-8 px-2"
              onClick={() => {
                setStarFilter(starFilter === s ? null : s)
                setPage(1)
              }}
            >
              <Star
                className={`h-3.5 w-3.5 ${starFilter === s ? "fill-white text-white" : ""}`}
              />
              <span className="text-xs ml-0.5">{s}</span>
            </Button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          <Button
            variant={approvedFilter === "true" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setApprovedFilter(approvedFilter === "true" ? null : "true")
              setPage(1)
            }}
          >
            <Check className="h-3.5 w-3.5 mr-1" /> Approved
          </Button>
          <Button
            variant={approvedFilter === "false" ? "default" : "outline"}
            size="sm"
            onClick={() => {
              setApprovedFilter(approvedFilter === "false" ? null : "false")
              setPage(1)
            }}
          >
            <X className="h-3.5 w-3.5 mr-1" /> Pending
          </Button>
        </div>
      </div>

      {loading ? (
        <p className="text-gray-400 py-12 text-center">Loading...</p>
      ) : filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <MessageSquare className="h-12 w-12 mx-auto mb-3 opacity-30" />
          <p>
            {search || starFilter || approvedFilter
              ? "No matching reviews"
              : "No reviews yet."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((r) => (
            <div key={r.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
                      <User className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{r.customer_name}</p>
                      <div className="flex items-center gap-2">
                        {renderStars(r.rating)}
                        <span className="text-xs text-gray-400">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                        {r.approved !== undefined && (
                          <Badge
                            variant={r.approved ? "default" : "secondary"}
                            className="text-[10px] h-5"
                          >
                            {r.approved ? "Approved" : "Pending"}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  {r.comment && (
                    <p className="text-sm text-gray-600 mt-2 ml-10">{r.comment}</p>
                  )}
                  <div className="flex items-center gap-1 mt-2 ml-10 text-xs text-gray-400">
                    <Package className="h-3 w-3" />
                    <span>
                      {r.product_name || r.product_id.slice(0, 8) + "..."}
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => handleToggleApproved(r)}
                    disabled={actionLoading === r.id}
                    className={
                      r.approved
                        ? "text-amber-500 hover:text-amber-700"
                        : "text-green-500 hover:text-green-700"
                    }
                    title={r.approved ? "Reject" : "Approve"}
                  >
                    {actionLoading === r.id ? (
                      <RefreshCw className="h-4 w-4 animate-spin" />
                    ) : r.approved ? (
                      <X className="h-4 w-4" />
                    ) : (
                      <Check className="h-4 w-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setDeleteTarget(r)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-6">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((p) => (
            <Button
              key={p}
              variant={p === page ? "default" : "outline"}
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => setPage(p)}
            >
              {p}
            </Button>
          ))}
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
          >
            Next
          </Button>
        </div>
      )}

      <ConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Delete Review"
        description={
          deleteTarget
            ? `Delete review by ${deleteTarget.customer_name}? This action cannot be undone.`
            : ""
        }
        confirmLabel="Delete"
        variant="destructive"
        loading={!!deleteTarget && actionLoading === deleteTarget.id}
        onConfirm={handleDelete}
      />
    </div>
  )
}
