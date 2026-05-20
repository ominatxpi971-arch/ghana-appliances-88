import { createBrowserClient } from "@supabase/ssr"

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  if (!url || !key) {
    // Return a dummy client during build/dev when env vars are missing
    if (typeof window === "undefined") {
      throw new Error("Supabase env vars not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.")
    }
    throw new Error("Supabase env vars not configured")
  }
  return createBrowserClient(url, key)
}
