"use client"

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ShieldCheck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { useAdmin } from '@/components/shop/admin-context'
import { toast } from 'sonner'

function LoginForm() {
  const { login, isLoggedIn } = useAdmin()
  const router = useRouter()
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)

  if (isLoggedIn) { router.push('/admin'); return null }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    const ok = await login(password)
    setLoading(false)
    if (ok) {
      router.push('/admin')
    } else {
      toast.error('Wrong password')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border p-8">
        <div className="text-center mb-6">
          <div className="h-14 w-14 rounded-full bg-amber-100 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="h-7 w-7 text-amber-600" />
          </div>
          <h2 className="text-xl font-semibold mt-2">Admin Login</h2>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <Label>Password</Label>
            <Input
              type="password"
              placeholder="Enter admin password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              autoFocus
            />
          </div>
          <Button type="submit" className="w-full bg-amber-500 hover:bg-amber-600" disabled={loading}>
            {loading ? "Signing in..." : "Login"}
          </Button>
        </form>
      </div>
    </div>
  )
}

export default function AdminLogin() {
  return <LoginForm />
}
