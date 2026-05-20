import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"

export async function GET() {
  try {
  const sb = createAdminClient()
  const profiles: any[] = []
  const seen = new Set<string>()

  // Get all orders, build unique customer list
  const { data: orders, error: ordersError } = await sb.from("orders").select("customer_name,customer_email,customer_phone,customer_city,customer_region,customer_address,created_at").order("created_at", { ascending: false })

  if (ordersError) { console.error("Orders query error:", ordersError) }
  if (orders) {
    for (const o of orders) {
      const key = o.customer_email || o.customer_phone || o.customer_name
      if (!key || seen.has(key)) continue
      seen.add(key)
      const names = (o.customer_name || "").trim().split(/\s+/)
      profiles.push({
        id: `guest-${key.replace(/[^a-zA-Z0-9]/g, "")}`, user_id: null,
        first_name: names[0] || "",
        last_name: names.slice(1).join(" ") || "",
        email: o.customer_email || null,
        phone: o.customer_phone || null,
        city: o.customer_city || null,
        region: o.customer_region || null,
        address: o.customer_address || null,
        avatar_url: null,
        created_at: o.created_at || "",
      })
    }
  }

  // Also add registered users who haven't ordered
  try {
    const { data: authUsers } = await sb.auth.admin.listUsers()
    if (authUsers?.users) {
      for (const u of authUsers.users) {
        if (seen.has(u.id)) continue
        seen.add(u.id)
        const meta = u.user_metadata || {}
        profiles.push({
          id: u.id,
          user_id: u.id,
          first_name: meta.first_name || "",
          last_name: meta.last_name || "",
          email: u.email || null,
          phone: meta.phone || null,
          city: null, region: null, address: null, avatar_url: null,
          created_at: u.created_at || "",
        })
      }
    }
  } catch { /* auth admin may not be available */ }

  return NextResponse.json(profiles)
  } catch(e:any){ return NextResponse.json({error:e.message,stack:e.stack}, {status:500}) }
}

export async function POST(request: NextRequest) {
  const body = await request.json()
  const sb = createAdminClient()
  
  // Update auth user metadata if user_id present
  if (body.user_id) {
    try {
      await sb.auth.admin.updateUserById(body.user_id, {
        user_metadata: { first_name: body.first_name, last_name: body.last_name, phone: body.phone || null }
      })
    } catch { /* ignore */ }
  }

  // Try profiles table, create if possible
  try {
    const { data, error } = await sb.from("profiles").upsert({
      user_id: body.user_id || null,
      first_name: body.first_name, last_name: body.last_name,
      email: body.email || null, phone: body.phone || null,
      address: body.address || null, city: body.city || null, region: body.region || null,
      updated_at: new Date().toISOString(),
    }, { onConflict: "user_id" }).select().single()
    if (!error && data) return NextResponse.json(data)
  } catch { /* table may not exist */ }

  return NextResponse.json({ success: true })
}
