import { NextRequest, NextResponse } from 'next/server'
import { validateAdminPassword, setAuthCookie } from '@/lib/auth'

export async function POST(request: NextRequest) {
  const body = await request.json()
  const { password } = body

  if (!(await validateAdminPassword(password))) {
    return NextResponse.json({ error: 'Invalid password' }, { status: 401 })
  }

  const response = NextResponse.json({ success: true })
  await setAuthCookie(response)
  return response
}
