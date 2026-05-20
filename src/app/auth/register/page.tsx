"use client"

export const dynamic = "force-dynamic";

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { createClient } from "@/lib/supabase/client"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { toast } from "sonner"
import { useAuth } from "@/components/shop/auth-context"

export default function RegisterPage() {
  const router = useRouter()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", password: "", confirmPassword: "" })

  if (user) { router.push("/"); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (form.password !== form.confirmPassword) { toast.error("Passwords do not match"); return }
    if (form.password.length < 6) { toast.error("Password must be at least 6 characters"); return }

    setLoading(true)
    const supabase = createClient()
    const { data, error } = await supabase.auth.signUp({
      email: form.email,
      password: form.password,
      options: { data: { first_name: form.firstName, last_name: form.lastName, phone: form.phone } },
    })

    if (error) { toast.error(error.message) } else if (data.user) { try { const u = data.user; await fetch("/api/profiles", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ user_id: u.id, first_name: form.firstName, last_name: form.lastName, email: form.email, phone: form.phone }) }) } catch {} }
    else { toast.success("Account created! Check your email to verify."); router.push("/auth/login") }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">Create Account</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>First Name</Label><Input value={form.firstName} onChange={e => setForm(f => ({ ...f, firstName: e.target.value }))} required /></div>
          <div className="space-y-1.5"><Label>Last Name</Label><Input value={form.lastName} onChange={e => setForm(f => ({ ...f, lastName: e.target.value }))} required /></div>
        </div>
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} required /></div>
        <div className="space-y-1.5"><Label>Phone</Label><Input type="tel" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} required /></div>
        <div className="space-y-1.5"><Label>Confirm Password</Label><Input type="password" value={form.confirmPassword} onChange={e => setForm(f => ({ ...f, confirmPassword: e.target.value }))} required /></div>
        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading}>{loading ? "Creating..." : "Create Account"}</Button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-500">Already have an account? <Link href="/auth/login" className="text-amber-600 hover:underline">Sign in</Link></p>
    </div>
  )
}
