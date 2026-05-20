
"use client"

import { useState, useEffect } from "react"
import { MessageCircle, X } from "lucide-react"
import { SiteSettings } from "@/lib/types"

export default function WhatsAppFloat() {
  const [settings, setSettings] = useState<Partial<SiteSettings>>({})
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    fetch("/api/settings").then(r => r.json()).then(setSettings).catch(() => {})
  }, [])

  const whatsapp = settings?.whatsapp || "+233501234567"
  const phone = settings?.phone || "+233501234567"
  const cleanNumber = whatsapp.replace(/[^0-9]/g, "")

  return (
    <div className="fixed bottom-20 right-4 z-40 md:bottom-6 flex flex-col items-end gap-2">
      {expanded && (
        <div className="bg-white rounded-xl shadow-xl border p-4 w-64 animate-in slide-in-from-bottom-2">
          <div className="flex items-center justify-between mb-3">
            <span className="font-semibold text-sm">Need Help?</span>
            <button onClick={() => setExpanded(false)}><X className="h-4 w-4" /></button>
          </div>
          <p className="text-xs text-gray-500 mb-3">Chat with us on WhatsApp for quick answers!</p>
          <a
            href={`https://wa.me/${cleanNumber}?text=Hello! I have a question about your products.`}
            target="_blank"
            rel="noopener noreferrer"
            className="block w-full text-center bg-green-500 text-white rounded-lg py-2 text-sm font-medium hover:bg-green-600 transition-colors"
          >
            <MessageCircle className="h-4 w-4 inline mr-1" /> Start Chat
          </a>
        </div>
      )}
      <button
        onClick={() => setExpanded(!expanded)}
        className="h-14 w-14 rounded-full bg-green-500 text-white shadow-lg hover:bg-green-600 transition-all flex items-center justify-center hover:scale-110"
      >
        <MessageCircle className="h-6 w-6" />
      </button>
    </div>
  )
}
