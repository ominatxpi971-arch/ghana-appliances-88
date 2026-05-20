
"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Home, Search, ShoppingCart, User, MapPin } from "lucide-react"
import { useAuth } from "@/components/shop/auth-context"
import { useCartContext } from "@/components/shop/cart-context"

export default function MobileNav() {
  const pathname = usePathname()
  const { itemCount } = useCartContext(); const { user: authUser } = useAuth()

  const links = [
    { href: "/", label: "Home", icon: Home },
    { href: "/products", label: "Shop", icon: Search },
        { href: "/track", label: "Track", icon: MapPin },
    { href: authUser ? "/auth/account" : "/auth/login", label: authUser ? "Account" : "Sign In", icon: User },
    { href: "/cart", label: "Cart", icon: ShoppingCart, badge: itemCount },
  ]

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white border-t safe-area-bottom">
      <div className="flex items-center justify-around h-14">
        {links.map(link => {
          const active = pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))
          return (
            <Link key={link.href} href={link.href}
              className={`flex flex-col items-center justify-center gap-0.5 flex-1 h-full text-xs transition-colors ${active ? "text-amber-600" : "text-gray-400"}`}>
              <div className="relative">
                <link.icon className="h-5 w-5" />
                {(link.badge ?? 0) > 0 && (
                  <span className="absolute -top-1.5 -right-2 h-4 w-4 rounded-full bg-amber-500 text-white text-[10px] flex items-center justify-center font-bold">{link.badge}</span>
                )}
              </div>
              <span>{link.label}</span>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
