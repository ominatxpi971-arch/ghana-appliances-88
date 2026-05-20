"use client"

import { useState } from "react"
import { ChevronDown } from "lucide-react"
const FAQS = [
  { q: "How does Cash on Delivery work?", a: "You place your order online, we confirm it via phone/WhatsApp, deliver the product to your address, and you pay in cash when you receive it. No online payment required." },
  { q: "Which areas do you deliver to?", a: "We deliver to all major cities and towns across Ghana including Accra, Kumasi, Tema, Takoradi, Tamale, and more. Contact us to confirm delivery to your specific location." },
  { q: "How long does delivery take?", a: "Typical delivery time is 1-3 business days within Accra, and 3-7 business days for other regions. We will confirm the exact timeline when we call to verify your order." },
  { q: "Are your products genuine?", a: "Yes! All our products are 100% authentic, sourced directly from authorized distributors. Every product comes with a manufacturer warranty." },
];

export default function FAQPage() {
  const [open, setOpen] = useState<number | null>(null)
  return (
    <div className="container mx-auto px-4 py-12 max-w-3xl">
      <h1 className="text-3xl font-bold mb-2">Frequently Asked Questions</h1>
      <p className="text-gray-500 mb-8">Find answers to common questions about our products and services.</p>
      <div className="space-y-2">
        {FAQS.map((faq, i) => (
          <div key={i} className="bg-white border rounded-xl overflow-hidden">
            <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center justify-between p-4 text-left font-medium hover:bg-gray-50">
              {faq.q}
              <ChevronDown className={`h-4 w-4 transition-transform flex-shrink-0 ${open === i ? "rotate-180" : ""}`} />
            </button>
            {open === i && <div className="px-4 pb-4 text-gray-600 text-sm">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  )
}

