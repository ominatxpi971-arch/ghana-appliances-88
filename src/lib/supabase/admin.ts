
import { createClient } from "@supabase/supabase-js"

// Server-side admin client — use ONLY in server code (API routes, server components)
// This has FULL database access via service_role key
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY
  if (!url || !key) throw new Error("Missing Supabase env vars")
  return createClient(url, key, { auth: { autoRefreshToken: false, persistSession: false } })
}

// Re-export browser client for convenience
export { createClient as createBrowserClient } from "./client"
export { createClient as createServerClient } from "./server"
