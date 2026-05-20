"use client"

import Breadcrumbs from "@/components/Breadcrumbs"
import { useState } from "react"
import { formatPrice } from "@/lib/utils"
import { getStatusLabel } from "@/lib/status-labels"
import { Search, Package, Truck, CheckCircle, XCircle, Clock } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Order, OrderStatus } from "@/lib/types"

const STATUS_ICONS: Record<OrderStatus, React.ReactNode> = {
  pending: <Clock className="h-5 w-5 text-yellow-500" />,
  confirmed: <Package className="h-5 w-5 text-blue-500" />,
  shipping: <Truck className="h-5 w-5 text-purple-500" />,
  delivered: <CheckCircle className="h-5 w-5 text-green-500" />,
  cancelled: <XCircle className="h-5 w-5 text-red-500" />,
}

const STATUS_LABEL: Record<OrderStatus, string> = {
  pending: "Pending  -Awaiting confirmation",
  confirmed: "Confirmed  -Preparing your order",
  shipping: "In transit",
  delivered: "Delivered  -Enjoy!",
  cancelled: "Cancelled",
}

export default function TrackOrderPage() {
  const [orderId, setOrderId] = useState("")
  const [phone, setPhone] = useState("")
  const [order, setOrder] = useState<Order | null>(null)
  const [error, setError] = useState("")
  const [searching, setSearching] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!orderId || !phone) { setError("Please fill both fields"); return }
    setSearching(true)
    setError("")

    try {
      const res = await fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId: orderId.trim(), phone }),
      })
      const data = await res.json()
      const found = data.order
      if (found) setOrder(found as Order)
      else setError("Order not found. Check your order ID and phone number.")
    } catch {
      setError("Failed to search. Please try again.")
    } finally {
      setSearching(false)
    }
  }

  const steps: OrderStatus[] = ["pending", "confirmed", "shipping", "delivered"]
  const currentStep = order ? steps.indexOf(order.status) : -1

  return (
    <div className="container mx-auto px-4 py-12 max-w-2xl">
      <Breadcrumbs items={[{ label: "Home", href: "/" }, { label: "Track Order" }]} />
      <h1 className="text-3xl font-bold text-center mb-2">Track Your Order</h1>
      <p className="text-gray-500 text-center mb-8">Enter your order ID and phone number to check delivery status.</p>

      {!order ? (
        <form onSubmit={handleSearch} className="bg-white border rounded-xl p-6 space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="orderId">Order ID</Label>
            <Input id="orderId" placeholder="e.g. 1747123456789" value={orderId} onChange={e => setOrderId(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="phone">Phone Number</Label>
            <Input id="phone" placeholder="0501234567" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          {error && <p className="text-red-500 text-sm">{error}</p>}
          <Button type="submit" disabled={searching} className="w-full bg-amber-500 hover:bg-amber-600">
            <Search className="h-4 w-4 mr-2" />{searching ? "Searching..." : "Track Order"}
          </Button>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="bg-white border rounded-xl p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs text-gray-400 font-mono">#{String(order.id).slice(0, 8)}</span>
                <h2 className="text-xl font-bold">{order.customer_name}</h2>
              </div>
              <Badge className={
                order.status === "delivered" ? "bg-green-100 text-green-700" :
                order.status === "cancelled" ? "bg-red-100 text-red-700" :
                "bg-amber-100 text-amber-700"
              }>
                {order.status}
              </Badge>
            </div>

            {/* Progress tracker */}
            {order.status !== "cancelled" && (
              <div className="flex items-center justify-between mb-6 pt-2">
                {steps.map((step, i) => (
                  <div key={step} className="flex flex-col items-center flex-1">
                    <div className={`h-8 w-8 rounded-full flex items-center justify-center text-sm font-bold ${
                      i <= currentStep ? "bg-amber-500 text-white" : "bg-gray-200 text-gray-400"
                    }`}>
                      {i < currentStep ? "OK" : i + 1}
                    </div>
                    <span className={`text-xs mt-1 text-center ${
                      i <= currentStep ? "text-amber-600 font-medium" : "text-gray-400"
                    }`}>
                      {getStatusLabel(step)}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Tracking information */}
            {order.tracking_number && (
              <div className="rounded-lg border bg-blue-50 p-4 mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Truck className="h-4 w-4 text-blue-600" />
                  <span className="font-medium">Tracking: {order.tracking_number}</span>
                </div>
                {order.tracking_url && (
                  <a href={order.tracking_url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline text-sm">
                    Track online &rarr;
                  </a>
                )}
              </div>
            )}

            <div className="border-t pt-4 space-y-2">
              <p className="flex items-center gap-2 text-sm">
                {STATUS_ICONS[order.status]}
                <span className="font-medium">{STATUS_LABEL[order.status]}</span>
              </p>
              <p className="text-sm text-gray-500">Total: <strong>{formatPrice(order.total_ghs)}</strong></p>
              <p className="text-sm text-gray-500">Items: {order.items?.map(i => `${i.product_name} ×${i.quantity}`).join(", ")}</p>
              <p className="text-sm text-gray-500">Delivery to: {order.customer_city && `${order.customer_city}, `}{order.customer_address}</p>
              <p className="text-xs text-gray-400">Ordered: {new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>

          <button onClick={() => { setOrder(null); setOrderId(""); setPhone("") }} className="text-sm text-amber-600 hover:underline mx-auto block">
            Track Another Order
          </button>
        </div>
      )}
    </div>
  )
}
