
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"

export default function CookieConsent() {
  const [show, setShow] = useState(false)
  useEffect(() => { if (!localStorage.getItem("cookie-consent")) setShow(true) }, [])
  const accept = () => { localStorage.setItem("cookie-consent", "true"); setShow(false) }
  if (!show) return null
  return (
    <div className="fixed bottom-16 md:bottom-4 left-4 right-4 z-50 bg-white border shadow-xl rounded-xl p-4 max-w-md md:left-4 md:right-auto">
      <p className="text-sm text-gray-600 mb-3">We use cookies to improve your experience. By continuing, you agree to our <a href="/privacy" className="text-amber-600 underline">Privacy Policy</a>.</p>
      <Button onClick={accept} className="bg-amber-500 hover:bg-amber-600 w-full">Accept</Button>
    </div>
  )
}
