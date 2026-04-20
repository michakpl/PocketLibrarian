import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { isAccessTokenExpired } from '@/lib/session-utils'

const protectedRoutes = ['/library']
const publicRoutes = ['/auth']
const alwaysAllowedRoutes = ['/auth/refresh']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r))
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r))
  const isAlwaysAllowed = alwaysAllowedRoutes.some((r) => path.startsWith(r))

  const cookie = req.cookies.get('pocketlibrarian.session')?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth', req.nextUrl))
  }

  if (isProtectedRoute && session && isAccessTokenExpired(session)) {
    const refreshUrl = new URL('/auth/refresh', req.nextUrl)
    refreshUrl.searchParams.set('callbackUrl', req.nextUrl.pathname + req.nextUrl.search)
    return NextResponse.redirect(refreshUrl)
  }

  if (isPublicRoute && !isAlwaysAllowed && session && !isAccessTokenExpired(session)) {
    return NextResponse.redirect(new URL('/library', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
}
