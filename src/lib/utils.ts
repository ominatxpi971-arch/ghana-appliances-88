import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

// Currency formatter for Ghanaian Cedi
// Uses the Cedi sign (U+20B5) rendered safely via JavaScript to avoid encoding issues
export function formatPrice(amount: number): string {
  if (amount == null || isNaN(amount)) return "GH₵ 0"
  return "GH₵ " + amount.toLocaleString("en-US")
}

// Short form for compact displays
export function formatPriceShort(amount: number): string {
  if (amount == null || isNaN(amount)) return "? 0"
  if (amount >= 1000) {
    return "? " + (amount / 1000).toFixed(1).replace(/\.0$/, "") + "k"
  }
  return "? " + amount.toLocaleString("en-US")
}
