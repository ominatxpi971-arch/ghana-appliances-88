"use client"

import { useAnalytics } from "@/hooks/use-analytics"

// Auto-track page views - just mount this component in your layout
export default function AnalyticsProvider() {
  useAnalytics()
  return null
}