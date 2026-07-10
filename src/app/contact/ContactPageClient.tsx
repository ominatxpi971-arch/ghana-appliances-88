"use client"

import { useState } from "react"
import { Phone, MessageCircle, Mail, MapPin, Clock, Loader2, Send } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import Breadcrumbs from "@/components/Breadcrumbs"
import { toast } from "sonner"
import { MetaPixel, TikTokPixel } from "@/lib/pixel"
import { sendCapiClientEvent, generateEventId } from "@/lib/capi-client"

export default function ContactPage() {
  const [name, setName] = useState("")
  const [email, setEmail] = useState("")
  const [phone, setPhone] = useState("")
  const [subject, setSubject] = useState("")
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!name || !email || !message) {
      toast.error("Please fill in name, email and message")
      return
    }
    setSending(true)
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, phone, subject, message })
      })
      if (res.ok) {
        setSent(true)
        const eventID = generateEventId("Contact")
        try { MetaPixel.contact() } catch (_) {} try { TikTokPixel.contact() } catch (_) {}
        // CAPI Contact event for lead tracking
        sendCapiClientEvent("Contact", {
          eventId: eventID,
          eventSourceUrl: typeof window !== "undefined" ? window.location.href : "",
          email,
          phone,
        })
        toast.success("Message sent! We will get back to you soon.")
      } else {
        toast.error("Failed to send. Please try again.")
      }
    } catch {
      toast.error("Network error. Please try again.")
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="container mx-auto px-4 py-12 max-w-4xl">
      <Breadcrumbs items={[{ label: "Contact Us" }]} />
      <h1 className="text-3xl font-bold mb-2">Contact Us</h1>
      <p className="text-gray-500 mb-8">Have questions? We are here to help. Reach out via any channel below.</p>

      <div className="grid md:grid-cols-2 gap-8">
        <div className="space-y-4">
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <Phone className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div><p className="font-medium">Phone</p><p className="text-gray-500 break-words">0501234567</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <MessageCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
            <div><p className="font-medium">WhatsApp</p><p className="text-gray-500 break-words">0501234567</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <Mail className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div><p className="font-medium">Email</p><p className="text-gray-500 break-all">info@ghanaappliance.cc</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <MapPin className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div><p className="font-medium">Address</p><p className="text-gray-500 break-words">Accra, Ghana</p></div>
          </div>
          <div className="flex items-center gap-3 p-4 bg-white border rounded-xl">
            <Clock className="h-5 w-5 text-amber-500 flex-shrink-0" />
            <div><p className="font-medium">Business Hours</p><p className="text-gray-500">Mon - Sat, 8 AM - 6 PM</p></div>
          </div>
        </div>

        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold text-lg mb-4">Send us a Message</h2>
          {sent ? (
            <div className="text-center py-8">
              <div className="text-5xl mb-4">✅</div>
              <h3 className="text-xl font-bold mb-2">Message Sent!</h3>
              <p className="text-gray-500">Thank you for reaching out. We will get back to you within 24 hours.</p>
              <Button variant="outline" className="mt-4" onClick={() => { setSent(false); setName(""); setEmail(""); setPhone(""); setSubject(""); setMessage("") }}>Send Another Message</Button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Name *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} placeholder="Your name" required />
              </div>
              <div className="space-y-1.5">
                <Label>Email *</Label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="your@email.com" required />
              </div>
              <div className="space-y-1.5">
                <Label>Phone</Label>
                <Input value={phone} onChange={e => setPhone(e.target.value)} placeholder="Your phone number" />
              </div>
              <div className="space-y-1.5">
                <Label>Subject</Label>
                <Input value={subject} onChange={e => setSubject(e.target.value)} placeholder="What is this about?" />
              </div>
              <div className="space-y-1.5">
                <Label>Message *</Label>
                <Textarea value={message} onChange={e => setMessage(e.target.value)} placeholder="How can we help you?" rows={4} required />
              </div>
              <div className="flex gap-3">
                <Button type="submit" disabled={sending} className="flex-1 bg-amber-500 hover:bg-amber-600">
                  {sending ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Sending...</> : <><Send className="h-4 w-4 mr-2" />Send Message</>}
                </Button>
                <a href="https://wa.me/8618142871306" target="_blank" rel="noopener noreferrer" className="inline-flex items-center justify-center rounded-lg text-sm font-medium bg-green-500 text-white hover:bg-green-600 h-10 px-4 transition-colors flex-shrink-0">
                  <MessageCircle className="h-4 w-4 mr-2" /> WhatsApp
                </a>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  )
}