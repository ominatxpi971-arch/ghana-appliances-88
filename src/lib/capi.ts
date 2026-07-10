// Server-side Meta Conversions API (CAPI)
// Sends events directly to Meta Graph API for reliable conversion tracking
// Docs: https://developers.facebook.com/docs/marketing-api/conversions-api

const GRAPH_API_VERSION = "v22.0"
const GRAPH_API_BASE = `https://graph.facebook.com/${GRAPH_API_VERSION}`

// Generate a unique event ID for browser/server deduplication
export function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

interface CapiEventData {
  event_name: string
  event_time: number
  event_id?: string
  event_source_url?: string
  action_source?: string
  user_data?: {
    em?: string
    ph?: string
    external_id?: string
    country?: string
    client_ip_address?: string
    client_user_agent?: string
    fbc?: string
    fbp?: string
  }
  custom_data?: Record<string, any>
}

// Hash email for CAPI (SHA256)
async function sha256(text: string): Promise<string> {
  const enc = new TextEncoder().encode(text.trim().toLowerCase())
  const hash = await crypto.subtle.digest("SHA-256", enc)
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2, "0")).join("")
}

export async function sendCapiEvent(
  pixelId: string,
  accessToken: string,
  event: CapiEventData
): Promise<boolean> {
  if (!pixelId || !accessToken || accessToken.length < 10) {
    console.warn("[CAPI] Missing pixel ID or access token")
    return false
  }

  try {
    const payload = {
      data: [
        {
          event_name: event.event_name,
          event_time: event.event_time,
          event_id: event.event_id,
          event_source_url: event.event_source_url,
          action_source: event.action_source || "website",
          user_data: event.user_data || {},
          custom_data: event.custom_data || {},
        },
      ],
      test_event_code: process.env.META_TEST_EVENT_CODE || undefined,
    }

    const url = `${GRAPH_API_BASE}/${pixelId}/events`
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${accessToken}`,
      },
      body: JSON.stringify(payload),
    })

    const body = await res.json()
    if (!res.ok) {
      console.error("[CAPI] Failed:", JSON.stringify(body))
      return false
    }

    console.log("[CAPI] Event sent:", event.event_name, "— received:", body?.events_received)
    return true
  } catch (e) {
    console.error("[CAPI] Error:", e)
    return false
  }
}

// Helper: send AddToCart event
export async function sendCapiAddToCart(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  customerEmail?: string
  customerPhone?: string
  clientIp?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
  value?: number
  currency?: string
  contentIds?: string[]
  contentName?: string
  numItems?: number
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.customerEmail) userData.em = await sha256(params.customerEmail)
  if (params.customerPhone) userData.ph = await sha256(params.customerPhone)
  if (params.clientIp) userData.client_ip_address = params.clientIp
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "AddToCart",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: params.value,
      currency: params.currency || "GHS",
      content_ids: params.contentIds,
      content_name: params.contentName,
      num_items: params.numItems,
    },
  })
}

// Helper: send InitiateCheckout event
export async function sendCapiInitiateCheckout(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  customerEmail?: string
  customerPhone?: string
  clientIp?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
  value?: number
  currency?: string
  contentIds?: string[]
  contents?: { id: string; quantity: number }[]
  numItems?: number
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.customerEmail) userData.em = await sha256(params.customerEmail)
  if (params.customerPhone) userData.ph = await sha256(params.customerPhone)
  if (params.clientIp) userData.client_ip_address = params.clientIp
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "InitiateCheckout",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: params.value,
      currency: params.currency || "GHS",
      content_ids: params.contentIds,
      contents: params.contents,
      num_items: params.numItems,
    },
  })
}

// Helper: send Purchase event (server-side, after order creation)
export async function sendCapiPurchase(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  externalId?: string
  country?: string
  customerEmail?: string
  customerPhone?: string
  clientIp?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
  value: number
  currency?: string
  contentIds?: string[]
  contents?: { id: string; quantity: number }[]
  numItems?: number
  orderId?: string
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.externalId) userData.external_id = await sha256(params.externalId)
  if (params.country) userData.country = await sha256(params.country)
  if (params.customerEmail) {
    userData.em = await sha256(params.customerEmail)
  }
  if (params.customerPhone) {
    userData.ph = await sha256(params.customerPhone)
  }
  if (params.clientIp) {
    userData.client_ip_address = params.clientIp
  }
  if (params.clientUserAgent) {
    userData.client_user_agent = params.clientUserAgent
  }
  if (params.fbp) {
    userData.fbp = params.fbp
  }
  if (params.fbc) {
    userData.fbc = params.fbc
  }

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "Purchase",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      value: params.value,
      currency: params.currency || "GHS",
      content_ids: params.contentIds,
      contents: params.contents,
      num_items: params.numItems,
    },
  })
}

// Helper: send ViewContent event (product page views)
export async function sendCapiViewContent(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  fbp?: string
  fbc?: string
  clientIp?: string
  clientUserAgent?: string
  contentIds?: string[]
  contentName?: string
  contentCategory?: string
  value?: number
  currency?: string
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.clientIp) userData.client_ip_address = params.clientIp
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "ViewContent",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {
      content_ids: params.contentIds,
      content_name: params.contentName,
      content_category: params.contentCategory,
      content_type: "product",
      value: params.value,
      currency: params.currency || "GHS",
    },
  })
}

// Helper: send Search event
export async function sendCapiSearch(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  fbp?: string
  fbc?: string
  clientIp?: string
  clientUserAgent?: string
  searchString?: string
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.clientIp) userData.client_ip_address = params.clientIp
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "Search",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: params.searchString ? { search_string: params.searchString } : {},
  })
}

// Helper: send Contact event (lead)
export async function sendCapiContact(params: {
  pixelId: string
  accessToken: string
  eventId?: string
  eventSourceUrl?: string
  customerEmail?: string
  customerPhone?: string
  clientIp?: string
  clientUserAgent?: string
  fbp?: string
  fbc?: string
}): Promise<boolean> {
  const userData: Record<string, string> = {}
  if (params.customerEmail) userData.em = await sha256(params.customerEmail)
  if (params.customerPhone) userData.ph = await sha256(params.customerPhone)
  if (params.clientIp) userData.client_ip_address = params.clientIp
  if (params.clientUserAgent) userData.client_user_agent = params.clientUserAgent
  if (params.fbp) userData.fbp = params.fbp
  if (params.fbc) userData.fbc = params.fbc

  return sendCapiEvent(params.pixelId, params.accessToken, {
    event_name: "Contact",
    event_time: Math.floor(Date.now() / 1000),
    event_id: params.eventId,
    event_source_url: params.eventSourceUrl,
    action_source: "website",
    user_data: userData,
    custom_data: {},
  })
}