import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Lista de rutas protegidas que requieren autenticación
const protectedRoutes = ['/admin', '/panel', '/checkout', '/payment'];

// Lista de IPs bloqueadas (puedes agregar más)
const blockedIPs: string[] = [];

// Rate limiting simple (en producción usar Redis o similar)
const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

// Configuración de rate limiting
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS = 100; // máximo de requests por ventana

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();
  
  // ===== 1. PROTECCIÓN CONTRA ATAQUES DE RATE LIMITING =====
  const ip = request.ip || request.headers.get('x-forwarded-for') || 'unknown';
  
  if (!isRateLimitOk(ip)) {
    return new NextResponse('Too Many Requests', { 
      status: 429,
      headers: {
        'Retry-After': '60'
      }
    });
  }
  
  // ===== 2. BLOQUEO DE IPS MALICIOSAS =====
  if (blockedIPs.includes(ip)) {
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // ===== 3. PROTECCIÓN CONTRA INYECCIÓN SQL Y XSS =====
  const suspiciousPatterns = [
    /(\%27)|(\')|(\-\-)|(\%23)|(#)/gi, // SQL injection
    /<script[^>]*>.*?<\/script>/gi,     // XSS básico
    /javascript:/gi,                     // XSS en URLs
    /on\w+\s*=/gi,                      // Event handlers
    /eval\(/gi,                         // eval injection
    /expression\(/gi,                   // CSS expression
  ];
  
  const queryString = request.nextUrl.search;
  const isSuspicious = suspiciousPatterns.some(pattern => pattern.test(queryString));
  
  if (isSuspicious) {
    console.warn(`[SECURITY] Suspicious request blocked from ${ip}: ${pathname}${queryString}`);
    return new NextResponse('Bad Request', { status: 400 });
  }
  
  // ===== 4. HEADERS DE SEGURIDAD ADICIONALES =====
  // Content Security Policy
  const csp = `
    default-src 'self';
    script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://*.supabase.co https://*.stripe.com;
    style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
    img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://*.stripe.com https://media.discordapp.net https://*.discordapp.net https://cdn.discordapp.com https://static.wattpad.com https://*.wattpad.com;
    font-src 'self' data: https://fonts.gstatic.com;
    connect-src 'self' https://*.supabase.co wss://*.supabase.co https://*.stripe.com;
    frame-src 'self' https://www.youtube.com https://youtube.com;
    child-src 'self' https://www.youtube.com https://youtube.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
    object-src 'none';
    upgrade-insecure-requests;
  `.replace(/\s{2,}/g, ' ').trim();

  response.headers.set('Content-Security-Policy', csp);
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('X-XSS-Protection', '1; mode=block');
  response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
  response.headers.set(
    'Permissions-Policy',
    'camera=(), microphone=(), geolocation=(), interest-cohort=()'
  );
  
  // HSTS (solo en HTTPS)
  if (request.nextUrl.protocol === 'https:') {
    response.headers.set(
      'Strict-Transport-Security',
      'max-age=31536000; includeSubDomains; preload'
    );
  }
  
  // ===== 5. PROTECCIÓN DE RUTAS ADMIN / PANEL =====
  
  // Redireccionar /admin a /panel (logic from remote)
  if (pathname.startsWith('/admin')) {
    return NextResponse.redirect(new URL('/panel', request.url));
  }

  // Auth logic for /panel (logic from remote)
  if (pathname.startsWith('/panel/')) {
    const adminSession = request.cookies.get('admin-session')?.value;
    
    if (!adminSession) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }

    try {
      const payload = adminSession.split('.')[0];
      const json = atob(payload);
      const session = JSON.parse(json);
      
      if (!session?.expiresAt || Number(session.expiresAt) < Date.now()) {
        return NextResponse.redirect(new URL('/panel', request.url));
      }
    } catch (e) {
      return NextResponse.redirect(new URL('/panel', request.url));
    }
  }

  // Legacy auth check for other protected routes if any
  if (pathname.startsWith('/checkout') || pathname.startsWith('/payment')) {
    const token = request.cookies.get('auth-token')?.value;
    if (!token) {
      // For now redirecting to home, but could be specific login
      // return NextResponse.redirect(new URL('/', request.url));
    }
  }
  
  // ===== 6. PROTECCIÓN CONTRA BOTS MALICIOSOS =====
  const userAgent = request.headers.get('user-agent') || '';
  const suspiciousBots = [
    'masscan',
    'nmap',
    'nikto',
    'sqlmap',
    'havij',
    'acunetix',
  ];
  
  const isSuspiciousBot = suspiciousBots.some(bot => 
    userAgent.toLowerCase().includes(bot)
  );
  
  if (isSuspiciousBot) {
    console.warn(`[SECURITY] Suspicious bot blocked from ${ip}: ${userAgent}`);
    return new NextResponse('Forbidden', { status: 403 });
  }
  
  // ===== 7. ANTI-SCRAPING HEADERS =====
  response.headers.set('X-Robots-Tag', 'noarchive, nosnippet');
  
  return response;
}

// Función helper para rate limiting
function isRateLimitOk(identifier: string): boolean {
  const now = Date.now();
  const userLimit = rateLimitMap.get(identifier);
  
  if (!userLimit || now > userLimit.resetTime) {
    rateLimitMap.set(identifier, {
      count: 1,
      resetTime: now + RATE_LIMIT_WINDOW
    });
    return true;
  }
  
  if (userLimit.count >= MAX_REQUESTS) {
    return false;
  }
  
  userLimit.count++;
  return true;
}

// Limpiar el mapa periódicamente (evitar memory leaks)
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    const now = Date.now();
    for (const [key, value] of rateLimitMap.entries()) {
      if (now > value.resetTime) {
        rateLimitMap.delete(key);
      }
    }
  }, RATE_LIMIT_WINDOW);
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
};
