import type { Metadata } from "next"
import Link from "next/link"

export const metadata: Metadata = {
  title: "404 - Page Not Found | Ghana Appliances",
  robots: { index: false, follow: false },
}

export default function NotFound() {
  return (
    <div className="container mx-auto px-4 py-20 text-center max-w-md">
      <span className="text-7xl">??</span>
      <h1 className="text-4xl font-bold mt-4 mb-2">404</h1>
      <p className="text-gray-500 mb-2">Page not found</p>
      <p className="text-sm text-gray-400 mb-6">The page you are looking for might have been removed or is temporarily unavailable.</p>
      <Link href="/" className="inline-flex items-center justify-center bg-amber-500 text-white px-6 py-2.5 rounded-lg font-medium hover:bg-amber-600">Back to Home</Link>
    </div>
  )
}