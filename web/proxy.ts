import { NextRequest, NextResponse } from 'next/server'
import { decrypt } from '@/lib/session'
import { cookies } from 'next/headers'

const protectedRoutes = ['/library']
const publicRoutes = ['/auth']

export default async function proxy(req: NextRequest) {
  const path = req.nextUrl.pathname
  const isProtectedRoute = protectedRoutes.some((r) => path.startsWith(r))
  const isPublicRoute = publicRoutes.some((r) => path.startsWith(r))

  const cookie = (await cookies()).get('pocketlibrarian.session')?.value
  const session = await decrypt(cookie)

  if (isProtectedRoute && !session) {
    return NextResponse.redirect(new URL('/auth', req.nextUrl))
  }

  if (isPublicRoute && session) {
    return NextResponse.redirect(new URL('/library', req.nextUrl))
  }

  return NextResponse.next()
}

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|.*\\.png$|favicon.ico).*)'],
}
