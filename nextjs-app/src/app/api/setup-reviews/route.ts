import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const secret = searchParams.get('secret');
  if (process.env.NODE_ENV === 'production' && secret !== process.env.SETUP_SECRET) {
    return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
  }

  if (!process.env.DATABASE_URL && !process.env.POSTGRES_URL) {
    return NextResponse.json({ success: true, message: 'Database not configured - skipping reviews setup' });
  }
  // ensure reviews base table exists
  const tbl = await db.get("SELECT to_regclass('public.resenas') as r");
  if (!tbl?.r) {
    return NextResponse.json({ success: false, message: 'La tabla resenas no existe.' });
  }

  try {
    const results = [];

    // 1. Asegurar columnas en tabla resenas
    const columns = [
      'verificado BOOLEAN DEFAULT FALSE',
      'aprobado BOOLEAN DEFAULT FALSE',
      'numero_orden TEXT'
    ];

    for (const colDef of columns) {
      const colName = colDef.split(' ')[0];
      try {
        await db.raw(`ALTER TABLE resenas ADD COLUMN IF NOT EXISTS ${colDef}`);
        results.push(`Resenas: Added/Verified ${colName}`);
      } catch (err: any) {
        results.push(`Resenas Error (${colName}): ${err.message}`);
      }
    }

    return NextResponse.json({ 
      success: true,
      results,
      message: "Si el error 'column not found' persiste, accede a tu panel de Supabase SQL Editor y ejecuta: NOTIFY pgrst, 'reload schema';"
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
