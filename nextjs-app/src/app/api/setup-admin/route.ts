import { NextResponse } from 'next/server'
import db from '@/lib/db'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json({ success: true, message: 'Database not configured - skipping admin setup' });
  }
  try {
    // Prevent running in production if admin already exists
    // Require a special header secret or check if it's the first run
    const { searchParams } = new URL(request.url);
    const secret = searchParams.get('secret');
    const expectedSecret = process.env.SETUP_SECRET || 'urban-setup-secret'; // Fallback only for dev

    // If production, enforce secret
    if (process.env.NODE_ENV === 'production') {
        if (secret !== expectedSecret) {
             return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }
    }

    const username = 'admin'
    const password = searchParams.get('password') || 'Omega10'
    const hashedPassword = bcrypt.hashSync(password, 10)
    
    // ensure table exists - if not, either create minimal structure or abort
    const tbl = await db.get("SELECT to_regclass('public.usuarios') AS r")
    if (!tbl?.r) {
      // try to create minimal users table so setup can proceed; schema migration should handle full structure later
      await db.raw(`
        CREATE TABLE public.usuarios (
          id uuid NOT NULL DEFAULT uuid_generate_v4(),
          email character varying UNIQUE,
          usuario character varying UNIQUE,
          contrasena text,
          nombre character varying,
          rol character varying DEFAULT 'operador'::character varying,
          permiso_categorias boolean DEFAULT false,
          permiso_productos boolean DEFAULT false,
          permiso_configuracion boolean DEFAULT false,
          permiso_ordenes boolean DEFAULT false,
          activo boolean DEFAULT true,
          admin boolean DEFAULT false,
          created_at timestamp with time zone DEFAULT now(),
          updated_at timestamp with time zone DEFAULT now(),
          CONSTRAINT usuarios_pkey PRIMARY KEY (id)
        );
      `)
    }

    // Check if user exists
    const existing = await db.get('SELECT * FROM usuarios WHERE usuario = ?', [username])
    
    if (existing) {
      // Update password in both fields and role
      await db.run('UPDATE usuarios SET password_hash = ?, contrasena = ? WHERE usuario = ?', [hashedPassword, password, username])
      await db.run('UPDATE usuarios SET rol = ? WHERE usuario = ?', ['admin', username])
      
      return NextResponse.json({ message: 'Usuario admin actualizado correctamente', user: username })
    }
    
    // Create
    await db.run(
      'INSERT INTO usuarios (usuario, email, password_hash, contrasena, rol, nombre, fecha_registro, activo) VALUES (?, ?, ?, ?, ?, ?, ?, ?)',
      [username, 'admin@urban.com', hashedPassword, password, 'admin', 'Administrador', new Date().toISOString(), true]
    )
    
    return NextResponse.json({ message: 'Usuario admin creado correctamente', user: username })
  } catch (error: any) {
    console.error(error)
    return NextResponse.json({ error: error.message, stack: error.stack }, { status: 500 })
  }
}
