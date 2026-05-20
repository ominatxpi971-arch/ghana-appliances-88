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

export default function LoginPage() {
  const router = useRouter()
  const { user, refresh } = useAuth()
  const [loading, setLoading] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  if (user) { router.push("/"); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const supabase = createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) { toast.error(error.message) }
    else { await refresh(); toast.success("Welcome back!"); router.push("/") }
    setLoading(false)
  }

  return (
    <div className="container mx-auto px-4 py-16 max-w-md">
      <h1 className="text-2xl font-bold text-center mb-6">Sign In</h1>
      <form onSubmit={handleSubmit} className="bg-white border rounded-xl p-6 space-y-4">
        <div className="space-y-1.5"><Label>Email</Label><Input type="email" value={email} onChange={e => setEmail(e.target.value)} required /></div>
        <div className="space-y-1.5"><Label>Password</Label><Input type="password" value={password} onChange={e => setPassword(e.target.value)} required /></div>
        <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading}>{loading ? "Signing in..." : "Sign In"}</Button>
      </form>
      <p className="text-center mt-4 text-sm text-gray-500">Don"t have an account? <Link href="/auth/register" className="text-amber-600 hover:underline">Create one</Link></p>
    </div>
  )
}
