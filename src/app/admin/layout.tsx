'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { LayoutDashboard, Package, ShoppingBag, Settings, LogOut, Menu, X, User, PenLine, Tag, MessageSquare, BarChart3 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { AdminProvider, useAdmin } from '@/components/shop/admin-context'
import { useState } from 'react'
import AdminErrorBoundary from '@/components/AdminErrorBoundary'

const NAV_ITEMS = [
  { href: '/admin/analytics', label: 'Analytics', icon: BarChart3 },
  { href: '/admin', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/admin/products', label: 'Products', icon: Package },
  { href: '/admin/orders', label: 'Orders', icon: ShoppingBag },
  { href: '/admin/customers', label: 'Customers', icon: User },
  { href: '/admin/blog', label: 'Blog', icon: PenLine },  { href: '/admin/coupons', label: 'Coupons', icon: Tag },
  { href: '/admin/reviews', label: 'Reviews', icon: MessageSquare },
  { href: '/admin/settings', label: 'Settings', icon: Settings },
]

function AdminSidebar({ mobileOpen, onClose }: { mobileOpen: boolean; onClose: () => void }) {
  const pathname = usePathname()
  const { logout } = useAdmin()
  

  const links = (
    <div className="flex flex-col h-full">
      <div className="p-4 font-bold text-lg">
        Admin
      </div>
      <nav className="flex-1 px-2 space-y-1">
        {NAV_ITEMS.map(item => {
          const active = pathname === item.href
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={onClose}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm transition-colors ${
                active ? 'bg-amber-100 text-amber-900 font-medium' : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-2 border-t">
        <button onClick={logout} className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50 w-full">
          <LogOut className="h-4 w-4" /> Logout
        </button>
      </div>
    </div>
  )
  return (
    <>
      <aside className="hidden lg:flex w-60 border-r bg-white flex-col h-screen sticky top-0">{links}</aside>
      {mobileOpen && (
        <div className="lg:hidden fixed inset-0 z-50">
          <div className="absolute inset-0 bg-black/50" onClick={onClose} />
          <div className="absolute left-0 top-0 bottom-0 w-64 bg-white border-r">{links}</div>
        </div>
      )}
    </>
  )
}

function AdminLayoutInner({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false)
  return (
    <div className="flex min-h-screen">
      <AdminSidebar mobileOpen={mobileOpen} onClose={() => setMobileOpen(false)} />
      <div className="flex-1 min-w-0">
        <div className="lg:hidden flex items-center gap-3 p-4 border-b bg-white">
          <Button variant="ghost" size="icon" onClick={() => setMobileOpen(true)}>
            <Menu className="h-5 w-5" />
          </Button>
          <span className="font-bold">Admin</span>
        </div>
        <div className="p-4 lg:p-8 notranslate" translate="no"><AdminErrorBoundary>{children}</AdminErrorBoundary></div>
      </div>
    </div>
  )
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminProvider>
        <AdminLayoutInner>{children}</AdminLayoutInner>
      </AdminProvider>
    
  )
}

