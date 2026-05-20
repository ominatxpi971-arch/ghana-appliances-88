import { NextRequest, NextResponse } from 'next/server'
import { validateAdminRequest } from '@/lib/auth'

export async function GET(request: NextRequest) {
  const valid = await validateAdminRequest(request)
  return NextResponse.json({ authenticated: valid })
}
