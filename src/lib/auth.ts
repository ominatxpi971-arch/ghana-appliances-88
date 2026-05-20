import { NextRequest, NextResponse } from 'next/server'
import { getSettings } from '@/lib/db'

const COOKIE_NAME = '__Host-admin_auth_token'
const TOKEN_DURATION_MS = 8 * 60 * 60 * 1000 // 8 hours

interface BlacklistEntry {
  token: string
  expiresAt: number
}
const tokenBlacklist: BlacklistEntry[] = []

function getSecret(): string {
  const pass = process.env.ADMIN_PASSWORD
  if (!pass) throw new Error("ADMIN_PASSWORD not configured")
  return `ghana-appliances-admin-auth-v2:${pass}`
}

async function signPayload(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return btoa(String.fromCharCode(...new Uint8Array(sig)))
}

export async function createToken(): Promise<string> {
  const payload = JSON.stringify({
    role: 'admin',
    iat: Date.now(),
    exp: Date.now() + TOKEN_DURATION_MS,
  })
  const encoded = Buffer.from(payload).toString('base64url')
  const sig = await signPayload(encoded)
  return `${encoded}.${sig}`
}

export async function verifyToken(token: string): Promise<boolean> {
  try {
    const [encoded, sig] = token.split('.')
    if (!encoded || !sig) return false
    if (await signPayload(encoded) !== sig) return false
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString())
    if (payload.role !== 'admin') return false
    if (Date.now() > payload.exp) return false

    // Check if token has been revoked
    for (const entry of tokenBlacklist) {
      if (entry.token === token && Date.now() < entry.expiresAt) {
        return false
      }
    }

    // Clean up expired blacklist entries
    for (let i = tokenBlacklist.length - 1; i >= 0; i--) {
      if (Date.now() > tokenBlacklist[i].expiresAt) {
        tokenBlacklist.splice(i, 1)
      }
    }

    return true
  } catch {
    return false
  }
}

export async function setAuthCookie(response: NextResponse): Promise<void> {
  response.cookies.set(COOKIE_NAME, await createToken(), {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: TOKEN_DURATION_MS / 1000,
  })
}

export function clearAuthCookie(response: NextResponse): void {
  response.cookies.set(COOKIE_NAME, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
  })
}

export async function validateAdminRequest(request: NextRequest): Promise<boolean> {
  const token = request.cookies.get(COOKIE_NAME)?.value
  if (!token) return false
  return await verifyToken(token)
}

export function revokeToken(token: string): void {
  tokenBlacklist.push({
    token,
    expiresAt: Date.now() + TOKEN_DURATION_MS
  })
}

export function getCookieName(): string {
  return COOKIE_NAME
}

export async function validateAdminPassword(password: string): Promise<boolean> {
  if (!password || password.length < 3) return false
  // Check DB-stored password first, fall back to env var
  try {
    const settings = await getSettings()
    if (settings?.admin_password && password === settings.admin_password) return true
  } catch {}
  const expected = process.env.ADMIN_PASSWORD
  if (!expected) return false
  return password === expected
}