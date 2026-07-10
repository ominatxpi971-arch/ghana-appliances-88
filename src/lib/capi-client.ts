// Read Meta cookies for CAPI matching
export function getMetaCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

// Generate a unique event ID for browser/server deduplication
export function generateEventId(prefix: string): string {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`
}

// Fire-and-forget CAPI event from client side
export function sendCapiClientEvent(event: "AddToCart" | "InitiateCheckout" | "ViewContent" | "Search" | "Contact", data: Record<string, unknown>) {
  fetch("/api/capi/event", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      event,
      ...data,
      fbp: getMetaCookie("_fbp"),
      fbc: getMetaCookie("_fbc"),
    }),
  }).catch(() => {}); // fire-and-forget
}