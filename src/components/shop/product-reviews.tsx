"use client"

import { useState, useEffect } from "react"
import { Star, User, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import { toast } from "sonner"

interface Review {
  id: string
  product_id: string
  customer_name: string
  rating: number
  comment: string
  created_at: string
}

export default function ProductReviews({ productId }: { productId: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [average, setAverage] = useState(0)
  const [count, setCount] = useState(0)
  const [loading, setLoading] = useState(true)

  // Review form
  const [name, setName] = useState("")
  const [rating, setRating] = useState(5)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState("")
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = async () => {
    try {
      const res = await fetch(`/api/reviews?productId=${productId}`)
      const data = await res.json()
      setReviews(data.reviews || [])
      setAverage(data.average || 0)
      setCount(data.count || 0)
    } catch { /* ignore */ }
    finally { setLoading(false) }
  }

  useEffect(() => { fetchReviews() }, [productId])

  const submitReview = async () => {
    if (!name.trim()) { toast.error("Please enter your name"); return }
    if (!comment.trim()) { toast.error("Please write a comment"); return }
    setSubmitting(true)
    try {
      const res = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ product_id: productId, customer_name: name, rating, comment }),
      })
      if (!res.ok) throw new Error()
      toast.success("Review submitted! Thank you.")
      setName(""); setComment(""); setRating(5)
      fetchReviews()
    } catch { toast.error("Failed to submit review") }
    finally { setSubmitting(false) }
  }

  const renderStars = (n: number, interactive = false) => (
    <div className="flex gap-0.5">
      {[1, 2, 3, 4, 5].map(i => (
        <Star
          key={i}
          className={`h-4 w-4 ${interactive ? "cursor-pointer" : ""} ${
            i <= (interactive ? (hoverRating || rating) : n)
              ? "fill-amber-400 text-amber-400"
              : "text-gray-300"
          } ${interactive ? "hover:scale-110 transition-transform" : ""}`}
          onMouseEnter={() => interactive && setHoverRating(i)}
          onMouseLeave={() => interactive && setHoverRating(0)}
          onClick={() => interactive && setRating(i)}
        />
      ))}
    </div>
  )

  return (
    <div className="space-y-6">
      <Separator />
      
      {/* Summary */}
      <div className="flex flex-wrap items-center gap-4">
        <h2 className="text-xl font-bold">Customer Reviews</h2>
        {count > 0 && (
          <div className="flex items-center gap-2">
            {renderStars(average)}
            <span className="font-bold text-lg">{average}</span>
            <span className="text-gray-400 text-sm">({count} review{count !== 1 ? "s" : ""})</span>
          </div>
        )}
      </div>

      {/* Rating bars */}
      {count > 0 && (
        <div className="flex flex-wrap gap-4 text-sm">
          {[5, 4, 3, 2, 1].map(star => {
            const starCount = reviews.filter(r => r.rating === star).length
            const pct = count > 0 ? Math.round(starCount / count * 100) : 0
            return (
              <div key={star} className="flex items-center gap-1">
                <span className="w-3 text-right text-gray-500">{star}</span>
                <Star className="h-3 w-3 fill-amber-400 text-amber-400" />
                <div className="w-20 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-amber-400 rounded-full" style={{ width: `${pct}%` }} />
                </div>
                <span className="text-gray-400 text-xs w-8">{pct}%</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Review list */}
      <div className="space-y-4">
        {loading ? (
          <p className="text-gray-400 text-sm">Loading reviews...</p>
        ) : reviews.length === 0 ? (
          <p className="text-gray-400 text-sm">No reviews yet. Be the first to review this product!</p>
        ) : (
          reviews.map(r => (
            <div key={r.id} className="bg-gray-50 rounded-lg p-4" itemProp="review" itemScope itemType="https://schema.org/Review">
              <div className="flex items-center gap-2 mb-2">
                <div className="h-8 w-8 rounded-full bg-amber-100 flex items-center justify-center">
                  <User className="h-4 w-4 text-amber-600" />
                </div>
                <div>
                  <p className="font-semibold text-sm" itemProp="author" itemScope itemType="https://schema.org/Person">
                    <span itemProp="name">{r.customer_name}</span>
                  </p>
                  <div className="flex items-center gap-1" itemProp="reviewRating" itemScope itemType="https://schema.org/Rating">
                    <meta itemProp="ratingValue" content={String(r.rating)} />
                    <meta itemProp="bestRating" content="5" />
                    <meta itemProp="worstRating" content="1" />
                    {renderStars(r.rating)}
                    <span className="text-xs text-gray-400 ml-2">
                      <meta itemProp="datePublished" content={r.created_at} />
                      {new Date(r.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
              {r.comment && <p className="text-sm text-gray-600 ml-10" itemProp="reviewBody">{r.comment}</p>}
            </div>
          ))
        )}
      </div>

      {/* Submit review form */}
      <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
        <h3 className="font-semibold mb-3">Write a Review</h3>
        <div className="space-y-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Your Name</label>
            <Input
              placeholder="Enter your name"
              value={name}
              onChange={e => setName(e.target.value)}
              className="bg-white"
            />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Rating</label>
            {renderStars(rating, true)}
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Your Review</label>
            <Textarea
              placeholder="Share your experience with this product..."
              value={comment}
              onChange={e => setComment(e.target.value)}
              className="bg-white"
              rows={3}
            />
          </div>
          <Button
            onClick={submitReview}
            disabled={submitting}
            className="bg-amber-500 hover:bg-amber-600"
          >
            <Send className="h-4 w-4 mr-2" />
            {submitting ? "Submitting..." : "Submit Review"}
          </Button>
        </div>
      </div>

      {count > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "Product",
              "@id": `${window.location.origin}/products/${productId}`,
              "aggregateRating": {
                "@type": "AggregateRating",
                ratingValue: average,
                reviewCount: count,
                bestRating: 5,
                worstRating: 1,
              },
              review: reviews.map(r => ({
                "@type": "Review",
                author: { "@type": "Person", name: r.customer_name },
                datePublished: r.created_at,
                reviewBody: r.comment,
                reviewRating: {
                  "@type": "Rating",
                  ratingValue: r.rating,
                  bestRating: 5,
                  worstRating: 1,
                },
              })),
            }),
          }}
        />
      )}
    </div>
  )
}
