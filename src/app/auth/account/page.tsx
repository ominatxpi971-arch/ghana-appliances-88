"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { useAuth } from "@/components/shop/auth-context"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { User, Mail, Phone, MapPin, ShoppingBag, LogOut, Save } from "lucide-react"

export default function AccountPage() {
  const router = useRouter()
  const { user, loading, signOut } = useAuth()
  const [profile, setProfile] = useState<any>({ first_name: "", last_name: "", email: "", phone: "", address: "", city: "", region: "" })
  const [saving, setSaving] = useState(false)
  const [orders, setOrders] = useState<any[]>([])

  useEffect(() => {
    if (!loading && !user) { router.push("/auth/login"); return }
    if (user) {
      fetch("/api/profiles").then(r => r.json()).then(data => {
        const p = Array.isArray(data) ? data.find((d: any) => d.user_id === user.id) : null
        if (p) setProfile(p)
        else setProfile((f: any) => ({ ...f, email: user.email || "" }))
      }).catch(() => {})
      fetch(`/api/orders?email=${encodeURIComponent(user.email||"")}`).then(r => r.json()).then(d => setOrders(Array.isArray(d) ? d : [])).catch(() => {})
    }
  }, [user, loading, router])

  const handleSave = async () => {
    if (!user) return
    setSaving(true)
    try {
      await fetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...profile, user_id: user.id }) })
      toast.success("Profile saved!")
    } catch { toast.error("Save failed") }
    finally { setSaving(false) }
  }

  if (loading) return <div className="container mx-auto px-4 py-20 text-center text-gray-400">Loading...</div>
  if (!user) return null

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <h1 className="text-2xl font-bold">My Account</h1>
        <Button variant="outline" onClick={async () => { await signOut(); router.push("/") }} className="gap-2 text-red-500"><LogOut className="h-4 w-4" /> Sign Out</Button>
      </div>
      
      <div className="grid lg:grid-cols-3 gap-8 min-w-0">
        <div className="lg:col-span-2 min-w-0">
          <div className="bg-white border rounded-xl p-6 space-y-4">
            <h2 className="font-semibold text-lg flex items-center gap-2"><User className="h-5 w-5 text-amber-500" /> Profile</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>First Name</Label><Input value={profile.first_name || ""} onChange={e => setProfile((p: any) => ({ ...p, first_name: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Last Name</Label><Input value={profile.last_name || ""} onChange={e => setProfile((p: any) => ({ ...p, last_name: e.target.value }))} /></div>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label><Mail className="h-3 w-3 inline mr-1" />Email</Label><Input value={profile.email || user.email || ""} disabled /></div>
              <div className="space-y-1.5"><Label><Phone className="h-3 w-3 inline mr-1" />Phone</Label><Input value={profile.phone || ""} onChange={e => setProfile((p: any) => ({ ...p, phone: e.target.value }))} /></div>
            </div>
            <div className="space-y-1.5"><Label><MapPin className="h-3 w-3 inline mr-1" />Address</Label><Input value={profile.address || ""} onChange={e => setProfile((p: any) => ({ ...p, address: e.target.value }))} /></div>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5"><Label>City</Label><Input value={profile.city || ""} onChange={e => setProfile((p: any) => ({ ...p, city: e.target.value }))} /></div>
              <div className="space-y-1.5"><Label>Region</Label><Input value={profile.region || ""} onChange={e => setProfile((p: any) => ({ ...p, region: e.target.value }))} /></div>
            </div>
            <Button onClick={handleSave} disabled={saving} className="bg-amber-500 hover:bg-amber-600 gap-2"><Save className="h-4 w-4" />{saving ? "Saving..." : "Save Profile"}</Button>
          </div>
        </div>

        <div>
          <div className="bg-white border rounded-xl p-6">
            <h2 className="font-semibold text-lg mb-4 flex items-center gap-2"><ShoppingBag className="h-5 w-5 text-amber-500" /> Recent Orders</h2>
            {orders.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                <ShoppingBag className="h-10 w-10 mx-auto mb-2 opacity-30" />
                <p className="text-sm">No orders yet</p>
                <Link href="/products" className="text-amber-500 text-sm hover:underline mt-1 inline-block">Start shopping</Link>
              </div>
            ) : (
              <div className="space-y-3">
                {orders.slice(0, 5).map(o => (
                  <div key={o.id} className="border rounded-lg p-3">
                    <div className="flex justify-between text-sm">
                      <span className="font-medium">#{String(o.id).slice(0, 8)}</span>
                      <span className={`text-xs px-2 py-0.5 rounded-full ${o.status === "delivered" ? "bg-green-100 text-green-700" : o.status === "cancelled" ? "bg-red-100 text-red-700" : "bg-yellow-100 text-yellow-700"}`}>{o.status}</span>
                    </div>
                    <p className="text-xs text-gray-400">{o.created_at ? new Date(o.created_at).toLocaleDateString() : ""}</p>
                    <p className="text-sm font-bold text-amber-600 mt-1">GH{"?"} {(o.total_ghs || 0).toLocaleString()}</p>
                  </div>
                ))}
                {orders.length > 5 && <p className="text-xs text-gray-400 text-center">+{orders.length - 5} more orders</p>}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}