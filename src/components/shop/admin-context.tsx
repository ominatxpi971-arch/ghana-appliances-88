"use client"

import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from "react"
import { useRouter, usePathname } from "next/navigation"

type AdminContextType = {
  isLoggedIn: boolean
  login: (password: string) => Promise<boolean>
  logout: () => Promise<void>
}

const AdminContext = createContext<AdminContextType | null>(null)

export function AdminProvider({ children }: { children: ReactNode }) {
  const [isLoggedIn, setIsLoggedIn] = useState(false)
  const [ready, setReady] = useState(false)
  const router = useRouter()
  const pathname = usePathname()

  // On mount, verify auth via server-side cookie
  useEffect(() => {
    let cancelled = false
    fetch("/api/auth/verify")
      .then(r => r.json())
      .then(d => { if (!cancelled) setIsLoggedIn(d.authenticated) })
      .catch(() => {})
      .finally(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    if (!ready) return
    if (!isLoggedIn && pathname !== "/admin/login") {
      router.push("/admin/login")
    }
  }, [ready, isLoggedIn, pathname, router])

  const login = useCallback(async (password: string): Promise<boolean> => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      })
      if (res.ok) {
        setIsLoggedIn(true)
        return true
      }
      return false
    } catch {
      return false
    }
  }, [])

  const logout = useCallback(async () => {
    try {
      await fetch("/api/auth/logout", { method: "POST" })
    } catch {}
    setIsLoggedIn(false)
    router.push("/admin/login")
  }, [router])

  return <AdminContext.Provider value={{ isLoggedIn, login, logout }}>{children}</AdminContext.Provider>
}

export function useAdmin() {
  const ctx = useContext(AdminContext)
  if (!ctx) throw new Error("useAdmin must be used within AdminProvider")
  return ctx
}
