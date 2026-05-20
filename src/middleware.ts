import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/auth'

// API routes that accept POST from public (non-admin)
const PUBLIC_POST_ROUTES = new Set([
  '/api/orders',
  '/api/contact',
  '/api/reviews',
  '/api/auth/login',
  '/api/auth/logout',
  '/api/analytics/track',
])

// GET routes that require admin auth
const SENSITIVE_GET_ROUTES = new Set([
  '/api/export-orders',
  '/api/gsc',
  '/api/settings',
  '/api/coupons',
])

// In-memory rate limiter for login
interface RateLimitEntry {
  count: number
  resetAt: number
}
const loginAttempts = new Map<string, RateLimitEntry>()
const LOGIN_MAX_ATTEMPTS = 5
const LOGIN_WINDOW_MS = 15 * 60 * 1000 // 15 minutes

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const method = request.method

  // Protect admin page routes - redirect to login if not authenticated
  if (pathname.startsWith('/admin/') && pathname !== '/admin/login') {
    const isAdmin = await validateAdminRequest(request)
    if (!isAdmin) {
      const loginUrl = new URL('/admin/login', request.url)
      return NextResponse.redirect(loginUrl)
    }
  }

  if (!pathname.startsWith('/api/')) return NextResponse.next()

  // Rate limit on login
  if (pathname === '/api/auth/login' && method === 'POST') {
    const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
               request.headers.get('x-real-ip') || 
               'unknown'
    const now = Date.now()

    const existing = loginAttempts.get(ip)
    if (existing) {
      if (now > existing.resetAt) {
        loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
      } else if (existing.count >= LOGIN_MAX_ATTEMPTS) {
        return NextResponse.json(
          { error: 'Too many login attempts. Try again in 15 minutes.' },
          { status: 429 }
        )
      } else {
        existing.count++
      }
    } else {
      loginAttempts.set(ip, { count: 1, resetAt: now + LOGIN_WINDOW_MS })
    }

    // Occasional cleanup of expired entries
    for (const [key, entry] of loginAttempts) {
      if (now > entry.resetAt) {
        loginAttempts.delete(key)
      }
    }
  }

  // GET requests a check sensitive routes first
  if (method === 'GET') {
    if (
      SENSITIVE_GET_ROUTES.has(pathname) ||
      pathname === '/api/analytics' ||
      pathname.startsWith('/api/analytics/')
    ) {
      if (!(await validateAdminRequest(request))) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }
    return NextResponse.next()
  }

  // Check if this is a public POST route
  if (PUBLIC_POST_ROUTES.has(pathname)) return NextResponse.next()

  // CSRF origin check for admin mutations (POST/PUT/DELETE)
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://ghanaappliance.cc'
  const origin = request.headers.get('origin')
  const referer = request.headers.get('referer')
  let requestOrigin = origin || ''
  if (!requestOrigin && referer) {
    try {
      requestOrigin = new URL(referer).origin
    } catch {
      // Invalid referer, ignore
    }
  }

  if (requestOrigin) {
    const allowedOrigins = [siteUrl]
    if (process.env.NODE_ENV === 'development') {
      allowedOrigins.push('http://localhost:3000')
    }
    if (!allowedOrigins.includes(requestOrigin)) {
      return NextResponse.json({ error: 'Invalid origin' }, { status: 403 })
    }
  }

  // All other POST/PUT/DELETE require admin auth
  if (!(await validateAdminRequest(request))) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/api/:path*', '/admin/:path*'],
}
