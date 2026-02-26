import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  // require secret in production to avoid accidental invocation (e.g. during build)
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (process.env.NODE_ENV === 'production' && secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json({ success: true, message: 'Database not configured - skipping database setup' });
  }

  // skip if base table is missing
  const tbl = await db.get("SELECT to_regclass('public.productos') as r");
  if (!tbl?.r) {
    return NextResponse.json({ success: false, message: 'La tabla productos no existe. Ejecuta el esquema inicial primero.' });
  }

  try {
    const columns = [
      'activo BOOLEAN DEFAULT TRUE',
      'destacado BOOLEAN DEFAULT FALSE',
      'top BOOLEAN DEFAULT FALSE',
      'nuevo_lanzamiento BOOLEAN DEFAULT FALSE',
      'proximamente BOOLEAN DEFAULT FALSE',
      'descuento_activo BOOLEAN DEFAULT FALSE',
      'fecha_lanzamiento TIMESTAMP'
    ];

    const results = [];

    for (const colDef of columns) {
      const colName = colDef.split(' ')[0];
      try {
        await db.raw(`ALTER TABLE productos ADD COLUMN IF NOT EXISTS ${colDef}`);
        results.push(`Added ${colName}`);
      } catch (err: any) {
        if (err.message.includes('already exists')) {
          results.push(`${colName} already exists`);
        } else {
          results.push(`Error adding ${colName}: ${err.message}`);
        }
      }
    }

    // 2. Crear tabla de logs si no existe
    try {
        await db.raw(`
            CREATE TABLE IF NOT EXISTS admin_logs (
                id SERIAL PRIMARY KEY,
                action TEXT NOT NULL,
                details TEXT,
                target_id TEXT,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('Table admin_logs verified/created');
    } catch (err: any) {
        results.push(`Error creating admin_logs: ${err.message}`);
    }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
