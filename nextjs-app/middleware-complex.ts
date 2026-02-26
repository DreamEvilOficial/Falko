import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  })

  // Añadir headers de performance
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')

  // Redirigir www -> apex (urban)
  const host = request.headers.get('host') || ''
  if (host.startsWith('www.')) {
    const url = new URL(request.url)
    url.host = host.replace(/^www\./, '')
    return NextResponse.redirect(url, 308)
  }

  // ⚠️ SEGURIDAD: Proteger rutas /admin
  if (request.nextUrl.pathname.startsWith('/admin') && !request.nextUrl.pathname.startsWith('/admin/login')) {
    // Mostrar todas las cookies para debug
    const allCookies = request.cookies.getAll()
    console.log('=== MIDDLEWARE DEBUG ===')
    console.log('Path:', request.nextUrl.pathname)
    console.log('Todas las cookies:', allCookies.map(c => `${c.name}=${c.value.substring(0,30)}...`))
    
    const sessionCookie = request.cookies.get('admin-session')
    const fallbackAuth = request.cookies.get('admin-auth')?.value === '1'
    console.log('Cookie admin-session encontrada:', sessionCookie ? 'Sí' : 'No', 'fallback admin-auth:', fallbackAuth)
    
    if (!sessionCookie && !fallbackAuth) {
      console.warn('No hay sesión, redirigiendo a login')
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }

    try {
      if (fallbackAuth && !sessionCookie) {
        console.log('✓ Fallback admin-auth presente, permitiendo acceso')
        return response
      }
      if (!sessionCookie) {
        console.warn('No hay cookie de sesión, redirigiendo a login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      const session = JSON.parse(sessionCookie.value)
      console.log('Sesión parseada:', { user: session.user?.username, expiresAt: new Date(session.expiresAt) })
      
      // Verificar si la sesión expiró
      if (session.expiresAt < Date.now()) {
        console.warn('Sesión expirada, redirigiendo a login')
        return NextResponse.redirect(new URL('/admin/login', request.url))
      }
      
      console.log('✓ Sesión válida, permitiendo acceso')
    } catch (error) {
      console.warn('Error al validar sesión:', error)
      return NextResponse.redirect(new URL('/admin/login', request.url))
    }
  }
  
  // Security Headers
  response.headers.set('X-DNS-Prefetch-Control', 'on')
  response.headers.set('Strict-Transport-Security', 'max-age=63072000; includeSubDomains; preload')
  response.headers.set('X-Frame-Options', 'SAMEORIGIN')
  response.headers.set('X-Content-Type-Options', 'nosniff')
  response.headers.set('X-XSS-Protection', '1; mode=block')
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin')
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=()'
  )
  
  // Content Security Policy
  response.headers.set(
    'Content-Security-Policy',
    [
      "default-src 'self'",
      "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://sdk.mercadopago.com https://www.mercadopago.com",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: https: blob:",
      "font-src 'self' data:",
      "connect-src 'self' https://*.supabase.co https://api.mercadopago.com",
      "frame-src https://www.mercadopago.com",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'self'"
    ].join('; ')
  )
  
  return response
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
