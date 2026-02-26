import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // Añadir columna direccion_envio
    // Usamos db.run para ejecutar comandos SQL directos (DDL)
    // Nota: db.raw no existe, usamos db.run que ejecuta query() internamente
    await db.run("ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS direccion_envio TEXT;");

    // Opcional: Añadir otras columnas útiles si faltan (basado en lo que vi en OrderManagement)
    await db.run("ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS ciudad TEXT;");
    await db.run("ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS provincia TEXT;");
    await db.run("ALTER TABLE ordenes ADD COLUMN IF NOT EXISTS codigo_postal TEXT;");

    // Verificar el resultado
    // Usamos db.all para obtener resultados
    const rows = await db.all("SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'ordenes';");
    
    return NextResponse.json({ success: true, columns: rows });
  } catch (err: any) {
    return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 });
  }
}
