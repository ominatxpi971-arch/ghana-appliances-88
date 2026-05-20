"use client"

import { useEffect, useRef } from "react"
import { usePathname } from "next/navigation"

const sessionId = typeof window !== "undefined"
  ? sessionStorage.getItem("analytics_session") || (() => { const s = Date.now().toString(36) + Math.random().toString(36).slice(2); sessionStorage.setItem("analytics_session", s); return s })()
  : ""

function getUtmParams(): Record<string, string> {
  if (typeof window === "undefined") return {}
  const urlParams = new URLSearchParams(window.location.search)
  const keys = ["utm_source", "utm_medium", "utm_campaign", "utm_content", "utm_term", "fbclid", "gclid"]
  const params: Record<string, string> = {}
  let hasUrlUtm = false

  for (const key of keys) {
    const val = urlParams.get(key)
    if (val) {
      params[key] = val
      hasUrlUtm = true
    }
  }

  if (hasUrlUtm) {
    sessionStorage.setItem("analytics_utm", JSON.stringify(params))
    return params
  }

  // Restore from sessionStorage if URL has no UTM params
  try {
    const stored = sessionStorage.getItem("analytics_utm")
    if (stored) return JSON.parse(stored)
  } catch {}

  return params
}

export function useAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef(pathname)

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname

    const utm = getUtmParams()

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
        eventType: "pageview",
        sessionId,
        ...utm,
      }),
    }).catch(() => {})
  }, [pathname])

  const trackEvent = (eventType: string, eventLabel?: string) => {
    const utm = getUtmParams()

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
        eventType,
        eventLabel: eventLabel || "",
        sessionId,
        ...utm,
      }),
    }).catch(() => {})
  }

  const trackSearch = (query: string, resultsCount: number) => {
    const utm = getUtmParams()

    fetch("/api/analytics/track", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        referrer: document.referrer || "",
        userAgent: navigator.userAgent,
        eventType: "search",
        eventLabel: query,
        searchQuery: query,
        resultsCount,
        sessionId,
        ...utm,
      }),
    }).catch(() => {})
  }

  return { trackEvent, trackSearch }
}