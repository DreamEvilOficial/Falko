import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  // Configuración mínima de middleware
  const response = NextResponse.next()
  
  // Solo proteger rutas admin de forma simple
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    const sessionCookie = request.cookies.get('admin-session')
    const fallbackAuth = request.cookies.get('admin-auth')?.value === '1'
    
    if (!sessionCookie && !fallbackAuth) {
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    if (sessionCookie && !fallbackAuth) {
      try {
        const session = JSON.parse(sessionCookie.value)
        if (session.expiresAt < Date.now()) {
          return NextResponse.redirect(new URL('/admin/login', request.url))
        }
      } catch (error) {
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
    }
  }

  return response
}

export const config = {
  matcher: [
    '/((?!api|_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)',
  ],
}