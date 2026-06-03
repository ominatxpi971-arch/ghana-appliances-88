"use client"

import Link from "next/link"
import { ChevronRight, Home } from "lucide-react"

interface Crumb { label: string; href?: string }

export default function Breadcrumbs({ items }: { items: Crumb[] }) {
  return (
    <nav aria-label="Breadcrumb" itemScope itemType="https://schema.org/BreadcrumbList">
      <ol className="flex items-center gap-1 text-sm text-gray-400 mb-4 flex-wrap list-none p-0 m-0">
        <li itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem">
          <Link href="/" itemProp="item" className="hover:text-amber-600">
            <Home className="h-3.5 w-3.5" />
            <span itemProp="name" className="sr-only">Home</span>
          </Link>
          <meta itemProp="position" content="1" />
        </li>
        {items.map((item, i) => (
          <li key={i} itemProp="itemListElement" itemScope itemType="https://schema.org/ListItem" className="flex items-center gap-1">
            <ChevronRight className="h-3 w-3" />
            {item.href ? (
              <Link href={item.href} itemProp="item" className="hover:text-amber-600">
                <span itemProp="name" className="truncate max-w-[120px] inline-block align-bottom">{item.label}</span>
              </Link>
            ) : (
              <span itemProp="name" className="text-gray-600 font-medium truncate max-w-[180px] inline-block align-bottom">{item.label}</span>
            )}
            <meta itemProp="position" content={String(i + 2)} />
          </li>
        ))}
      </ol>
    </nav>
  )
}
