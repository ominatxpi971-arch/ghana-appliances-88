import { getSettings } from "./db"
import type { SiteSettings } from "./types"

interface OrderEmailParams {
  id: string | number
  customer_name: string
  customer_email?: string
  customer_phone: string
  customer_address: string
  total_ghs: number
  items: Array<{ product_name: string; quantity: number; unit_price?: number }>
}

function escapeHtml(str: string): string {
  if (!str) return ''
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
}

async function getResend() {
  const settings = await getSettings()
  const apiKey = settings?.resend_api_key || process.env.RESEND_API_KEY
  if (!apiKey || apiKey.length < 10) {
    return null
  }
  try {
    const { Resend } = await import("resend")
    return new Resend(apiKey)
  } catch (e) {
    return null
  }
}

export async function sendOrderConfirmation(order: OrderEmailParams) {
  const resend = await getResend()
  if (!resend) return false
  const settings = await getSettings()
  const storeName = escapeHtml(settings?.site_name || "Ghana Appliances")
  const storeEmail = escapeHtml(settings?.admin_email || settings?.email || "info@ghanaappliance.cc")
  const storePhone = escapeHtml(settings?.phone || "")
  const itemsHtml = (order.items || []).map((i: { product_name: string; quantity: number; unit_price?: number }) => {
    const itemTotal = (Number(i.unit_price) || 0) * (i.quantity || 1)
    return `<tr><td style="padding:8px;border-bottom:1px solid #eee">${escapeHtml(i.product_name)} x ${i.quantity}</td><td style="padding:8px;border-bottom:1px solid #eee;text-align:right">GH` + '\u20b5' + ` ${itemTotal.toLocaleString()}</td></tr>`
  }).join("")

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background:#f59e0b;color:#000;padding:16px;text-align:center;border-radius:8px 8px 0 0"><h1 style="margin:0;font-size:20px">` + '\u26a1' + ` ${storeName}</h1><p style="margin:4px 0 0;font-size:14px">Order Confirmation</p></div><div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 8px 8px"><p>Dear <strong>${escapeHtml(order.customer_name)}</strong>,</p><p>Thank you for your order! We have received it and will contact you shortly.</p><div style="background:#fffbeb;border:1px solid #fcd34d;border-radius:8px;padding:12px;margin:16px 0"><p style="margin:0;font-weight:bold">Order ID: ${escapeHtml(String(order.id))}</p><p style="margin:4px 0 0;font-size:14px">Payment: Cash on Delivery ` + '\u2014' + ` GH` + '\u20b5' + ` ${Number(order.total_ghs).toLocaleString()}</p></div><h3 style="margin:16px 0 8px">Order Details</h3><table style="width:100%;border-collapse:collapse">${itemsHtml}<tr><td style="padding:8px;font-weight:bold">Total</td><td style="padding:8px;text-align:right;font-weight:bold;font-size:18px;color:#f59e0b">GH` + '\u20b5' + ` ${Number(order.total_ghs).toLocaleString()}</td></tr></table><h3 style="margin:16px 0 8px">Delivery</h3><p style="margin:0;font-size:14px;color:#6b7280">${escapeHtml(order.customer_address)}</p><p style="margin:16px 0 0;font-size:14px;color:#6b7280">Questions? ${storePhone}</p></div></body></html>`

  try {
    const to = order.customer_email
    if (!to) return false
    await resend.emails.send({
      from: `${storeName} <noreply@ghanaappliance.cc>`,
      to,
      subject: `Order Confirmed ` + '\u2014' + ` #${escapeHtml(String(order.id).slice(0, 8))}`,
      html
    })
    return true
  } catch { return false }
}

export async function sendManualEmail(to: string, subject: string, html: string) {
  const resend = await getResend()
  if (!resend) return false
  const settings = await getSettings()
  const storeName = escapeHtml(settings?.site_name || "Ghana Appliances")
  try {
    await resend.emails.send({
      from: `${storeName} <noreply@ghanaappliance.cc>`,
      to,
      subject,
      html
    })
    return true
  } catch (e) { return false }
}

export async function sendAdminNotification(order: OrderEmailParams) {
  const resend = await getResend()
  if (!resend) return false
  const settings = await getSettings()
  const storeName = escapeHtml(settings?.site_name || "Ghana Appliances")
  const storeEmail = settings?.email || "info@ghanaappliance.cc"

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial;max-width:600px;margin:0 auto;padding:20px"><h2>New Order: #${escapeHtml(String(order.id).slice(0,8))}</h2><p><strong>Customer:</strong> ${escapeHtml(order.customer_name)}</p><p><strong>Phone:</strong> ${escapeHtml(order.customer_phone)}</p><p><strong>Email:</strong> ${escapeHtml(order.customer_email || "N/A")}</p><p><strong>Address:</strong> ${escapeHtml(order.customer_address)}</p><p><strong>Total:</strong> GH` + '\u20b5' + ` ${Number(order.total_ghs).toLocaleString()}</p><p><strong>Items:</strong> ${escapeHtml((order.items||[]).map((i: { product_name: string; quantity: number; unit_price?: number })=>i.product_name+' x'+i.quantity).join(', '))}</p><p style="margin-top:16px"><a href="https://ghanaappliance.cc/admin/orders" style="background:#f59e0b;color:#000;padding:10px 20px;text-decoration:none;border-radius:6px;font-weight:bold">View in Admin</a></p></body></html>`

  try {
    const result = await resend.emails.send({
      from: `${storeName} <noreply@ghanaappliance.cc>`,
      to: storeEmail,
      subject: `New Order #${escapeHtml(String(order.id).slice(0,8))} ` + '\u2014' + ` ${escapeHtml(order.customer_name)}`,
      html
    })
    return !result.error
  } catch (e) {
    return false
  }
}

export async function sendContactNotification(contact: { name: string; email: string; phone: string; subject: string; message: string }) {
  const resend = await getResend()
  if (!resend) return false
  const settings = await getSettings()
  const storeName = escapeHtml(settings?.site_name || "Ghana Appliances")
  const storeEmail = settings?.email || "info@ghanaappliance.cc"

  const html = `<!DOCTYPE html><html><head><meta charset="utf-8"></head><body style="font-family:Arial,sans-serif;max-width:600px;margin:0 auto;padding:20px"><div style="background:#f59e0b;color:#000;padding:16px;text-align:center;border-radius:8px 8px 0 0"><h1 style="margin:0;font-size:20px">` + '\u26a1' + ` ${storeName}</h1><p style="margin:4px 0 0;font-size:14px">New Contact Message</p></div><div style="background:#fff;border:1px solid #e5e7eb;border-top:0;padding:20px;border-radius:0 0 8px 8px"><p><strong>From:</strong> ${escapeHtml(contact.name)} (${escapeHtml(contact.email)})</p><p><strong>Phone:</strong> ${escapeHtml(contact.phone || "N/A")}</p><p><strong>Subject:</strong> ${escapeHtml(contact.subject || "N/A")}</p><hr style="border:none;border-top:1px solid #eee;margin:16px 0"><p style="white-space:pre-wrap">${escapeHtml(contact.message)}</p></div></body></html>`

  try {
    await resend.emails.send({
      from: `${storeName} <noreply@ghanaappliance.cc>`,
      to: storeEmail,
      subject: `New Contact: ${escapeHtml(contact.subject || contact.name)}`,
      html,
      replyTo: contact.email
    })
    return true
  } catch { return false }
}

export async function sendShipmentEmail(order: OrderEmailParams, trackingNumber: string, trackingUrl?: string) {
  if (!order.customer_email) return
  const resend = await getResend()
  if (!resend) return false
  const settings = await getSettings()
  const storeName = settings?.site_name || "Ghana Appliances"
  const trackingLink = trackingUrl || `https://ghanaappliance.cc/track`
  const html = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a;">Your Order is On the Way! ` + '\u{1F69A}' + `</h2>
      <p>Good news ` + '\u2014' + ` your order <strong>#${escapeHtml(String(order.id).slice(0, 8))}</strong> has been shipped!</p>
      <div style="background: #f7f7f7; padding: 16px; border-radius: 8px; margin: 16px 0;">
        <p style="margin: 0 0 8px;"><strong>Tracking Number:</strong> ${escapeHtml(trackingNumber)}</p>
        ${trackingUrl ? `<p style="margin: 0;"><strong>Track your order:</strong> <a href="${escapeHtml(trackingUrl)}" style="color: #2563eb;">Click here</a></p>` : ''}
      </div>
      <p>You can also check your order status anytime at <a href="${escapeHtml(trackingLink)}" style="color: #2563eb;">ghanaappliance.cc/track</a></p>
      <hr style="border: none; border-top: 1px solid #eee; margin: 24px 0;" />
      <p style="color: #666; font-size: 12px;">${escapeHtml(storeName)}</p>
    </div>
  `
  try {
    await resend.emails.send({
      from: `${storeName} <orders@ghanaappliance.cc>`,
      to: order.customer_email,
      subject: `Your order #${escapeHtml(String(order.id).slice(0, 8))} has shipped!`,
      html,
    })
    return true
  } catch (e) {
    return false
  }
}