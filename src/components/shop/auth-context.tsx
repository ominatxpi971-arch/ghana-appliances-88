"use client"

import { createContext, useContext, useEffect, useState, ReactNode, useRef } from "react"
import { createClient } from "@/lib/supabase/client"
import { User } from "@supabase/supabase-js"

interface AuthState {
  user: User | null
  loading: boolean
  signOut: () => Promise<void>
  refresh: () => Promise<void>
}

const AuthContext = createContext<AuthState>({ user: null, loading: true, signOut: async () => {}, refresh: async () => {} })

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const clientRef = useRef<ReturnType<typeof createClient> | null>(null)

  const getClient = () => {
    if (!clientRef.current) {
      try { clientRef.current = createClient() } catch { return null }
    }
    return clientRef.current
  }

  const refresh = async () => {
    const supabase = getClient()
    if (!supabase) return
    const { data: { user: u } } = await supabase.auth.getUser()
    setUser(u ?? null)
  }

  useEffect(() => {
    const supabase = getClient()
    if (!supabase) { setLoading(false); return }

    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const signOut = async () => {
    const supabase = getClient()
    if (!supabase) return
    await supabase.auth.signOut()
    setUser(null)
  }

  return <AuthContext.Provider value={{ user, loading, signOut, refresh }}>{children}</AuthContext.Provider>
}

export function useAuth() { return useContext(AuthContext) }
