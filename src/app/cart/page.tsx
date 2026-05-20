"use client"

import { formatPrice } from "@/lib/utils";
import Link from "next/link"
import { ShoppingCart, Trash2, Minus, Plus, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { useCartContext } from "@/components/shop/cart-context"

function StyledLink({ href, className, children }: { href: string; className?: string; children: React.ReactNode }) {
  return (
    <Link href={href} className={`inline-flex items-center justify-center rounded-lg text-sm font-medium transition-colors ${className || ""}`}>
      {children}
    </Link>
  )
}

export default function CartPage() {
  const { items, itemCount, total, removeItem, updateQuantity } = useCartContext()

  if (items.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center max-w-md">
        <ShoppingCart className="h-16 w-16 text-gray-300 mx-auto mb-4" />
        <h1 className="text-2xl font-bold mb-2">Your cart is empty</h1>
        <p className="text-gray-500 mb-6">Looks like you have not added anything to your cart yet.</p>
        <StyledLink href="/products" className="bg-amber-500 text-white hover:bg-amber-600 h-10 px-4">Start Shopping</StyledLink>
      </div>
    )
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Shopping Cart ({itemCount} items)</h1>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          {items.map(item => (
            <div key={item.product.id} className="flex gap-4 bg-white border rounded-xl p-4">
              <Link href={`/products/${item.product.slug}`} className="h-24 w-24 bg-gray-100 rounded-lg flex items-center justify-center text-4xl flex-shrink-0">
                {item.product.images?.[0] ? (
                  <img src={item.product.images[0]} alt={item.product.name} className="h-full w-full object-cover rounded-lg" />
                ) : "ð¦"}
              </Link>
              <div className="flex-1 min-w-0">
                <Link href={`/products/${item.product.slug}`} className="font-semibold hover:text-amber-600 line-clamp-1">
                  {item.product.name}
                </Link>
                <p className="text-sm text-gray-500 capitalize">{item.product.category}</p>
                <p className="font-bold text-amber-600 mt-1"> {formatPrice(item.product.price_ghs)}</p>
              </div>
              <div className="flex flex-col items-end justify-between">
                <button onClick={() => removeItem(item.product.id)} className="text-gray-400 hover:text-red-500">
                  <Trash2 className="h-4 w-4" />
                </button>
                <div className="flex items-center border rounded">
                  <button onClick={() => updateQuantity(item.product.id, item.quantity - 1)} className="px-2 py-1 hover:bg-gray-100"><Minus className="h-3 w-3" /></button>
                  <span className="px-3 py-1 text-sm font-medium">{item.quantity}</span>
                  <button onClick={() => updateQuantity(item.product.id, item.quantity + 1)} className="px-2 py-1 hover:bg-gray-100"><Plus className="h-3 w-3" /></button>
                </div>
                <p className="font-bold text-sm"> {formatPrice((item.product.price_ghs * item.quantity))}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white border rounded-xl p-6 sticky top-24">
            <h2 className="font-semibold text-lg mb-4">Order Summary</h2>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Subtotal ({itemCount} items)</span>
              <span>{formatPrice(total)}</span>
            </div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-gray-500">Delivery</span>
              <span className="text-green-600">Cash on Delivery</span>
            </div>
            <Separator className="my-3" />
            <div className="flex justify-between font-bold text-lg">
              <span>Total</span>
              <span className="text-amber-600">{formatPrice(total)}</span>
            </div>
            <StyledLink href="/checkout" className="w-full mt-4 bg-amber-500 text-white hover:bg-amber-600 h-10 px-4">
              Proceed to Checkout <ArrowRight className="ml-2 h-4 w-4" />
            </StyledLink>
            <StyledLink href="/products" className="w-full mt-2 border border-gray-200 bg-white text-gray-700 hover:bg-gray-50 h-10 px-4">
              Continue Shopping
            </StyledLink>
          </div>
        </div>
      </div>
    </div>
  )
}
