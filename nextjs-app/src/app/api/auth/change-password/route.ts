import { NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { jwtVerify } from 'jose'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-urban-cdg');

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

export async function POST(request: Request) {
  const cookieStore = cookies()
  const sessionToken = cookieStore.get('session')?.value
  const adminSessionToken = cookieStore.get('admin-session')?.value
  
  let userId: string | null = null;

  try {
    // 1. Intentar validar sesión normal (JWT)
    if (sessionToken) {
      try {
        const { payload } = await jwtVerify(sessionToken, SECRET_KEY)
        userId = payload.sub as string
      } catch (e) {
        console.warn('Session JWT invalid:', e)
      }
    }

    // 2. Si no hay usuario aún, intentar validar sesión de admin (Custom HMAC)
    if (!userId && adminSessionToken) {
      try {
        const [payloadB64, signature] = adminSessionToken.split('.')
        if (payloadB64 && signature) {
          const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'urban-fallback-secret-2024'
          const sessionString = Buffer.from(payloadB64, 'base64').toString('utf-8')
          
          const expectedSignature = await signData(sessionString, secret)
          
          if (signature === expectedSignature) {
            const session = JSON.parse(sessionString)
            if (session.expiresAt && session.expiresAt > Date.now()) {
              userId = session.user.id
            }
          }
        }
      } catch (e) {
        console.warn('Admin session invalid:', e)
      }
    }

    if (!userId) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { currentPassword, newPassword } = await request.json()
    if (!currentPassword || !newPassword) {
      return NextResponse.json({ error: 'Datos inválidos' }, { status: 400 })
    }

    // Verify current password
    const user = await db.get('SELECT password_hash, contrasena FROM usuarios WHERE id = ?', [userId]) as any;
    if (!user) return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 404 })

    let valid = false;
    if (user.password_hash) {
        valid = bcrypt.compareSync(currentPassword, user.password_hash);
    } else if (user.contrasena) {
        // Fallback para usuarios legacy o dev
        if (user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$')) {
             valid = bcrypt.compareSync(currentPassword, user.contrasena);
        } else {
             valid = (currentPassword === user.contrasena);
        }
    }

    if (!valid) {
       return NextResponse.json({ error: 'Contraseña actual incorrecta' }, { status: 401 })
    }

    // Update password
    const newHash = bcrypt.hashSync(newPassword, 10);
    
    // Actualizamos tanto password_hash (nuevo estándar) como contrasena (legacy compatibility)
    // O mejor, solo password_hash y limpiamos contrasena para migrar.
    // Pero para asegurar compatibilidad total por ahora, guardamos el hash en contrasena también si se usaba.
    
    // Estrategia segura: Usar password_hash como fuente de verdad.
    // Si el usuario tenía 'contrasena' (legacy), la actualizamos a NULL o al hash para evitar confusiones.
    
    await db.run('UPDATE usuarios SET password_hash = ?, contrasena = ? WHERE id = ?', [newHash, newHash, userId]);

    return NextResponse.json({ success: true })
  } catch (e: any) {
    console.error('change-password route error:', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
