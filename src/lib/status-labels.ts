export const STATUS_LABELS: Record<string, string> = {
  pending: "Pending",
  confirmed: "Confirmed",
  shipping: "In transit",
  delivered: "Delivered",
  cancelled: "Cancelled",
}

export const STATUS_LIST = ["pending", "confirmed", "shipping", "delivered", "cancelled"] as const

export function getStatusLabel(status: string): string {
  return STATUS_LABELS[status] || status
}