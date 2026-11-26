import { NextRequest, NextResponse } from 'next/server'

export function sameOrigin(request: NextRequest) {
  try {
    const origin = new URL(request.headers.get('origin') ?? '')
    const loopback = process.env.MERQLOOM_LOOPBACK_HTTP === 'true' && origin.hostname === '127.0.0.1'
    return origin.host === request.headers.get('host') && (origin.protocol === 'https:' || (loopback && origin.protocol === 'http:'))
  } catch {
    return false
  }
}
export function redirectForm(request: NextRequest, path: string) {
  return NextResponse.redirect(new URL(path, request.headers.get('origin')!), 303)
}
