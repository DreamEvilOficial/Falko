import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET() {
  try {
    // 1. Crear tabla drops
    await db.raw(`
      CREATE TABLE IF NOT EXISTS drops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        slug TEXT UNIQUE NOT NULL,
        fecha_lanzamiento TIMESTAMP WITH TIME ZONE,
        descripcion TEXT,
        imagen_url TEXT,
        activo BOOLEAN DEFAULT TRUE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)

    // 2. Crear tabla intermedia producto_drops
    await db.raw(`
      CREATE TABLE IF NOT EXISTS producto_drops (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        producto_id UUID NOT NULL REFERENCES productos(id) ON DELETE CASCADE,
        drop_id UUID NOT NULL REFERENCES drops(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(producto_id, drop_id)
      );
    `)
    
    // 3. Agregar columnas a productos si es necesario (aunque usaremos la tabla intermedia, 
    // tal vez queramos denormalizar o simplemente usar la relación).
    // Por ahora con la tabla intermedia es suficiente para many-to-many.

    return NextResponse.json({ success: true, message: 'Tablas de Drops creadas correctamente' })
  } catch (error: any) {
    console.error('Error setting up drops tables:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
