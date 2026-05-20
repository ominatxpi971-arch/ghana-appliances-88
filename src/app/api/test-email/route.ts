import { NextRequest, NextResponse } from "next/server"
import { sendManualEmail } from "@/lib/email"

export async function POST(request: NextRequest) {
  const { to } = await request.json()
  if (!to) return NextResponse.json({ error: "Email required" }, { status: 400 })
  
  const html = `<!DOCTYPE html><html><body style="font-family:Arial;padding:20px"><h2>Test Email from Ghana Appliances</h2><p>This is a test email to verify Resend is configured correctly.</p><p style="color:#666;font-size:12px">Sent at: ${new Date().toISOString()}</p></body></html>`
  
  const sent = await sendManualEmail(to, "Test Email - Ghana Appliances", html)
  if (!sent) return NextResponse.json({ error: "Failed to send. Check Resend API key and verified domain." }, { status: 500 })
  return NextResponse.json({ success: true, message: `Test email sent to ${to}` })
}
