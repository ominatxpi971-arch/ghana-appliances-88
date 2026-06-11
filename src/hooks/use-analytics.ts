"use client"

import { useEffect, useRef, useCallback } from "react"
import { usePathname } from "next/navigation"

let sessionId = ""
if (typeof window !== "undefined") {
  try {
    sessionId = sessionStorage.getItem("analytics_session")
      || (() => { const s = Date.now().toString(36) + Math.random().toString(36).slice(2); sessionStorage.setItem("analytics_session", s); return s })()
  } catch { /* sessionStorage may be unavailable */ }
}

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
    try { sessionStorage.setItem("analytics_utm", JSON.stringify(params)) } catch {}
    return params
  }

  try {
    const stored = sessionStorage.getItem("analytics_utm")
    if (stored) return JSON.parse(stored)
  } catch {}

  return params
}

export function useAnalytics() {
  const pathname = usePathname()
  const lastPath = useRef(pathname)
  const sessionRef = useRef(sessionId)

  useEffect(() => {
    sessionRef.current = sessionId
  }, [])

  // Pageview tracking on route change
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
        sessionId: sessionRef.current,
        ...utm,
      }),
    }).catch(() => {})
  }, [pathname])

  // Global click tracking for user interaction clicks
  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      const clickable = target.closest("a, button, [role='button'], .product-card, input[type='submit']")
      if (!clickable) return

      let label = ""
      if (clickable instanceof HTMLAnchorElement) {
        label = clickable.href || clickable.textContent?.trim().slice(0, 100) || "link"
      } else if (clickable instanceof HTMLButtonElement) {
        label = clickable.textContent?.trim().slice(0, 100) || clickable.name || "button"
      } else if (clickable instanceof HTMLInputElement) {
        label = clickable.value || clickable.name || "input"
      } else {
        label = clickable.textContent?.trim().slice(0, 100) || "element"
      }

      const utm = getUtmParams()

      fetch("/api/analytics/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          path: pathname,
          referrer: document.referrer || "",
          userAgent: navigator.userAgent,
          eventType: "click",
          eventLabel: label,
          sessionId: sessionRef.current,
          ...utm,
        }),
      }).catch(() => {})
    }

    document.addEventListener("click", handleClick, true)
    return () => document.removeEventListener("click", handleClick, true)
  }, [pathname])

  const trackEvent = useCallback((eventType: string, eventLabel?: string): void => {
    try {
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
          sessionId: sessionRef.current,
          ...utm,
        }),
      }).catch(() => {})
    } catch { /* never let analytics errors affect the app */ }
  }, [pathname])

  const trackSearch = useCallback((query: string, resultsCount: number): void => {
    try {
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
          sessionId: sessionRef.current,
          ...utm,
        }),
      }).catch(() => {})
    } catch { /* never let analytics errors affect the app */ }
  }, [pathname])

  return { trackEvent, trackSearch }
}
