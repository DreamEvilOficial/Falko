import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  const results = [];
  try {
    // 1. Add columns to ordenes
    try {
        await db.raw('ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS total_transferencia NUMERIC(15,2)');
        results.push('Added total_transferencia to ordenes');
    } catch (e: any) { results.push('total_transferencia: ' + e.message); }

    try {
        await db.raw('ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS transferencia_expiracion TIMESTAMP');
        results.push('Added transferencia_expiracion to ordenes');
    } catch (e: any) { results.push('transferencia_expiracion: ' + e.message); }
    
    // 2. Ensure configuracion table exists (it should, but just in case)
    try {
        await db.raw(`
            CREATE TABLE IF NOT EXISTS configuracion (
                id TEXT PRIMARY KEY, 
                clave TEXT UNIQUE NOT NULL, 
                valor TEXT, 
                updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        `);
        results.push('Checked configuracion table');
    } catch (e: any) { results.push('configuracion table: ' + e.message); }

    return NextResponse.json({ results });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
