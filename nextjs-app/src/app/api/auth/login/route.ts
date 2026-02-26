import { cookies } from 'next/headers'
import { NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'
import { sanitizeInput } from '@/lib/security'

export const dynamic = 'force-dynamic'

// Función para firmar datos (HMAC-SHA256)
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
  try {
    const { username, password } = await request.json()
    const secret = process.env.SUPABASE_SERVICE_ROLE_KEY || 'urban-fallback-secret-2024'
    
    // Warn if using fallback secret in production
    if (process.env.NODE_ENV === 'production' && !process.env.SUPABASE_SERVICE_ROLE_KEY) {
       console.error('CRITICAL: Using fallback secret in production!');
    }

    const cleanUsername = sanitizeInput(username);
    console.log('Intento de login para:', cleanUsername)

    // Autenticación usando lib/db (con pool de PostgreSQL o fallback)
    const user = await db.get('SELECT * FROM usuarios WHERE (email = ? OR usuario = ?) AND activo = TRUE', [cleanUsername, cleanUsername]) as any

    if (!user) {
      console.warn('❌ Usuario no encontrado o inactivo:', cleanUsername)
      return NextResponse.json({ error: 'Usuario no encontrado' }, { status: 401 })
    }

    // Verificar contraseña (bcrypt o texto plano legacy para migración)
    let validPassword = false
    let shouldMigratePassword = false;

    if (user.contrasena) {
      if (user.contrasena.startsWith('$2a$') || user.contrasena.startsWith('$2b$')) {
        validPassword = bcrypt.compareSync(password, user.contrasena)
      } else {
        // Texto plano (solo para desarrollo/migración inicial)
        validPassword = (password === user.contrasena)
        if (validPassword) {
            shouldMigratePassword = true;
        }
      }
    }

    if (!validPassword) {
      console.warn('❌ Contraseña inválida para:', cleanUsername)
      return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
    }
    
    // Migrar contraseña a Bcrypt si estaba en texto plano
    if (shouldMigratePassword) {
        try {
            const hashedPassword = bcrypt.hashSync(password, 10);
            await db.run('UPDATE usuarios SET contrasena = ? WHERE id = ?', [hashedPassword, user.id]);
            console.log('🔒 Contraseña migrada a Bcrypt para usuario:', cleanUsername);
        } catch (err) {
            console.error('Error migrando contraseña:', err);
        }
    }
    
    const sessionUser = {
      id: user.id,
      email: user.email,
      usuario: user.usuario,
      nombre: user.nombre,
      rol: user.rol,
      admin: user.rol === 'admin' || user.rol === 'superadmin' || !!user.admin,
      permiso_categorias: !!user.permiso_categorias,
      permiso_productos: !!user.permiso_productos,
      permiso_configuracion: !!user.permiso_configuracion,
      permiso_ordenes: !!user.permiso_ordenes,
    }
    
    const sessionPayload = {
      user: sessionUser,
      expiresAt: Date.now() + 7 * 24 * 60 * 60 * 1000
    }

    const sessionString = JSON.stringify(sessionPayload)
    const signature = await signData(sessionString, secret)
    
    // Usamos Buffer en Node para asegurar b64 limpio
    const payloadB64 = Buffer.from(sessionString).toString('base64');
    const cookieValue = payloadB64 + '.' + signature

    const response = NextResponse.json({ success: true, user: sessionUser })
    
    response.cookies.set({
      name: 'admin-session',
      value: cookieValue,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    // Cookie de ayuda para el frontend (no crítica)
    response.cookies.set({
      name: 'admin-auth',
      value: '1',
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    })

    return response
  } catch (error: any) {
    console.error('Login route error:', error)
    return NextResponse.json(
      { error: 'Error interno del servidor' },
      { status: 500 }
    )
  }
}
