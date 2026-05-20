
"use client"

import { Share2 } from "lucide-react"

interface Props { productName: string; productUrl: string }

export default function ShareButtons({ productName, productUrl }: Props) {
  const whatsappShare = `https://wa.me/?text=${encodeURIComponent(`Check out this product: ${productName} — ${productUrl}`)}`
  const facebookShare = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(productUrl)}`
  const copyLink = () => { navigator.clipboard.writeText(productUrl); alert("Link copied!") }

  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-gray-400 flex items-center gap-1"><Share2 className="h-3 w-3" /> Share:</span>
      <a href={whatsappShare} target="_blank" rel="noopener noreferrer" className="text-xs bg-green-500 text-white px-2 py-1 rounded hover:bg-green-600">WhatsApp</a>
      <a href={facebookShare} target="_blank" rel="noopener noreferrer" className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">Facebook</a>
      <button onClick={copyLink} className="text-xs bg-gray-200 text-gray-700 px-2 py-1 rounded hover:bg-gray-300">Copy Link</button>
    </div>
  )
}
