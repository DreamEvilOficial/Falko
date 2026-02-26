import { createClient } from '@supabase/supabase-js'
import { NextResponse } from 'next/server'
import db from '@/lib/db'

export async function POST(req: Request) {
  try {
    const { email, producto_id } = await req.json()

    if (!email || !producto_id) {
      return NextResponse.json({ error: 'Email y producto requeridos' }, { status: 400 })
    }

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!supabaseUrl || !supabaseKey) {
      return NextResponse.json({ error: 'Configuración de servidor incompleta' }, { status: 500 })
    }

    const supabase = createClient(supabaseUrl, supabaseKey)

    // Insertar en la tabla proximamente_notificaciones
    const { error } = await supabase
      .from('proximamente_notificaciones')
      .upsert({ email, producto_id }, { onConflict: 'email, producto_id' })

    if (error) {
      console.error('Error insertando notificación:', error)
      
      // Auto-fix: Si la tabla no existe o hay error de schema cache
      if (error.code === '42P01' || error.message.includes('does not exist') || error.message.includes('schema cache') || error.message.includes('Could not find the table')) {
        try {
          console.log('Error de tabla o schema cache. Intentando recuperación directa...')
          
          // Intentar crear tabla por si acaso
          await db.raw(`
            CREATE TABLE IF NOT EXISTS proximamente_notificaciones (
                id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
                email TEXT NOT NULL,
                producto_id TEXT NOT NULL,
                notificado BOOLEAN DEFAULT FALSE,
                created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()),
                UNIQUE(email, producto_id)
            );
            CREATE INDEX IF NOT EXISTS idx_proximamente_email ON proximamente_notificaciones(email);
            CREATE INDEX IF NOT EXISTS idx_proximamente_producto ON proximamente_notificaciones(producto_id);
            ALTER TABLE proximamente_notificaciones ENABLE ROW LEVEL SECURITY;
            DO $$ 
            BEGIN
                IF NOT EXISTS (
                    SELECT FROM pg_policies 
                    WHERE tablename = 'proximamente_notificaciones' 
                    AND policyname = 'Acceso total admin proximamente'
                ) THEN
                    CREATE POLICY "Acceso total admin proximamente" ON proximamente_notificaciones FOR ALL USING (true);
                END IF;
            END $$;
          `)
          
          // Reintentar inserción con DB directo (bypassea PostgREST schema cache)
          await db.run(`
            INSERT INTO proximamente_notificaciones (email, producto_id)
            VALUES (?, ?)
            ON CONFLICT (email, producto_id) DO NOTHING
          `, [email, producto_id])
          
          return NextResponse.json({ message: 'Notificación registrada correctamente (Recuperación exitosa)' })
        } catch (fixError: any) {
          console.error('Error intentando recuperación:', fixError)
          return NextResponse.json({ error: 'Error crítico DB: ' + fixError.message }, { status: 500 })
        }
      }

      return NextResponse.json({ error: 'Error guardando notificación: ' + error.message }, { status: 500 })
    }

    return NextResponse.json({ message: 'Notificación registrada correctamente' })
  } catch (error: any) {
    console.error('Error en API proximamente:', error)
    return NextResponse.json({ error: 'Error interno del servidor: ' + error.message }, { status: 500 })
  }
}
