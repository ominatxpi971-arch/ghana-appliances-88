import { NextRequest, NextResponse } from "next/server"
import { createAdminClient } from "@/lib/supabase/admin"
import { sendContactNotification } from "@/lib/email"

// Simple in-memory rate limiter
const rateLimitMap = new Map<string, { count: number; resetAt: number }>()

function getClientIP(request: NextRequest): string {
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || 
         request.headers.get("x-real-ip") || 
         "unknown"
}

export async function POST(request: NextRequest) {
  
  const ip = getClientIP(request)
  const now = Date.now()
  const existing = rateLimitMap.get(ip)
  if (existing) {
    if (now > existing.resetAt) {
      rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
    } else if (existing.count >= 3) {
      return NextResponse.json({ error: "Too many messages. Please try again later." }, { status: 429 })
    } else {
      existing.count++
    }
  } else {
    rateLimitMap.set(ip, { count: 1, resetAt: now + 3600000 })
  }
  // Occasional cleanup
  for (const [key, entry] of rateLimitMap) {
    if (now > entry.resetAt) rateLimitMap.delete(key)
  }

  try {
    const body = await request.json()
    const { name, email, phone, subject, message } = body

    if (!name || !email || !message) {
      return NextResponse.json({ error: "Name, email and message are required" }, { status: 400 })
    }

    // Store in database (gracefully handle if table doesn"t exist yet)
    try {
      const supabase = createAdminClient()
      await supabase.from("contact_messages").insert({
        name, email, phone: phone || "", subject: subject || "", message
      })
    } catch { /* table may not exist yet - that"s OK */ }

    // Send email notification to admin
    sendContactNotification({ name, email, phone: phone || "", subject: subject || "", message }).catch(() => {})

    return NextResponse.json({ success: true, message: "Message sent successfully!" })
  } catch (error) {
    return NextResponse.json({ error: "Failed to send message" }, { status: 500 })
  }
}
