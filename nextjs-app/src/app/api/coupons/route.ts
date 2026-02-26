import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sanitizeInput } from '@/lib/security';
import { v4 as uuidv4 } from 'uuid';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const cupones = await db.all('SELECT * FROM cupones ORDER BY created_at DESC');
    return NextResponse.json(cupones);
  } catch (error: any) {
    console.error('Error fetching coupons:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { codigo, tipo, valor, descripcion, valido_hasta, max_uso_total, minimo_compra, activo } = body;

    if (!codigo || !valor) {
        return NextResponse.json({ error: 'Faltan datos obligatorios' }, { status: 400 });
    }

    const id = uuidv4();
    const codigoSafe = sanitizeInput(codigo).toUpperCase();
    const descripcionSafe = sanitizeInput(descripcion || '');

    await db.run(`
        INSERT INTO cupones (
            id, codigo, tipo, valor, descripcion, valido_hasta, 
            max_uso_total, minimo_compra, activo, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    `, [
        id, codigoSafe, tipo, valor, descripcionSafe, 
        valido_hasta || null, max_uso_total || null, 
        minimo_compra || 0, activo !== undefined ? activo : true
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating coupon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
