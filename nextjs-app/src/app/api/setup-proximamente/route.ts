import { NextResponse } from 'next/server'
import db from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  try {
    // SQL para crear la tabla de notificaciones
    const sql = `
      CREATE TABLE IF NOT EXISTS proximamente_notificaciones (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        email TEXT NOT NULL,
        producto_id TEXT NOT NULL,
        notificado BOOLEAN DEFAULT FALSE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
        UNIQUE(email, producto_id)
      );

      -- Crear índice para búsquedas rápidas
      CREATE INDEX IF NOT EXISTS idx_proximamente_email ON proximamente_notificaciones(email);
      CREATE INDEX IF NOT EXISTS idx_proximamente_producto ON proximamente_notificaciones(producto_id);
    `

    // Usar db.raw para ejecutar el DDL directamente
    try {
      await db.raw(sql);
      return NextResponse.json({ message: 'Tabla proximamente_notificaciones creada o verificada correctamente (via Direct SQL)' })
    } catch (dbError: any) {
       console.error('Error con db.raw, intentando fallback RPC...', dbError);
       // Fallback a lógica anterior si db.raw falla (ej. si no hay pool)
       // Pero por ahora asumimos que si hay db pool funciona.
       return NextResponse.json({ error: 'Error creando tabla: ' + dbError.message }, { status: 500 })
    }

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
