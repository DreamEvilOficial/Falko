import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

// Función para firmar datos (HMAC-SHA256) - Debe coincidir con login/route.ts
async function signData(data: string, secret: string) {
  const encoder = new TextEncoder()
  const keyData = encoder.encode(secret)
  const dataData = encoder.encode(data)
  
  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  
  const signature = await crypto.subtle.sign('HMAC', cryptoKey, dataData)
  return btoa(String.fromCharCode(...new Uint8Array(signature)))
}

export async function GET(request: Request) {
  try {
    const cookieStore = cookies()
    const sessionCookie = cookieStore.get('admin-session')

    if (!sessionCookie || !sessionCookie.value) {
      return NextResponse.json({ error: 'No session' }, { status: 401 })
    }

    const [payloadB64, signature] = sessionCookie.value.split('.')
    if (!payloadB64 || !signature) {
      return NextResponse.json({ error: 'Invalid session format' }, { status: 401 })
    }

    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'urban-fallback-secret-2024'
    
    // Decodificar payload
    const sessionString = Buffer.from(payloadB64, 'base64').toString('utf-8')
    
    // Verificar firma
    const expectedSignature = await signData(sessionString, secret)
    
    if (signature !== expectedSignature) {
      console.warn('Invalid session signature')
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 })
    }

    const session = JSON.parse(sessionString)
    
    // Verificar expiración
    if (!session.expiresAt || session.expiresAt < Date.now()) {
      return NextResponse.json({ error: 'Session expired' }, { status: 401 })
    }

    return NextResponse.json({ 
      user: session.user,
      expiresAt: session.expiresAt
    })

  } catch (error: any) {
    console.error('Session check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
