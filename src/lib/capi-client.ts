// Read Meta cookies for CAPI matching
export function getMetaCookie(name: string): string {
  if (typeof document === "undefined") return "";
  const match = document.cookie.match(new RegExp("(^| )" + name + "=([^;]+)"));
  return match ? decodeURIComponent(match[2]) : "";
}

// Fire-and-forget CAPI event from client side
export function sendCapiClientEvent(event: "AddToCart" | "InitiateCheckout", data: Record<string, unknown>) {
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
