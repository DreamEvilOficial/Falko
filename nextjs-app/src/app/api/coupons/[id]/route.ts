import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sanitizeInput } from '@/lib/security';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  try {
    const { id } = params;
    const body = await req.json();
    
    // Construir query dinámica
    const updates: string[] = [];
    const values: any[] = [];

    if (body.codigo !== undefined) {
        updates.push('codigo = ?');
        values.push(sanitizeInput(body.codigo).toUpperCase());
    }
    if (body.tipo !== undefined) {
        updates.push('tipo = ?');
        values.push(body.tipo);
    }
    if (body.valor !== undefined) {
        updates.push('valor = ?');
        values.push(body.valor);
    }
    if (body.descripcion !== undefined) {
        updates.push('descripcion = ?');
        values.push(sanitizeInput(body.descripcion));
    }
    if (body.valido_hasta !== undefined) {
        updates.push('valido_hasta = ?');
        values.push(body.valido_hasta);
    }
    if (body.max_uso_total !== undefined) {
        updates.push('max_uso_total = ?');
        values.push(body.max_uso_total);
    }
    if (body.minimo_compra !== undefined) {
        updates.push('minimo_compra = ?');
        values.push(body.minimo_compra);
    }
    if (body.activo !== undefined) {
        updates.push('activo = ?');
        values.push(body.activo);
    }

    if (updates.length === 0) {
        return NextResponse.json({ error: 'No data to update' }, { status: 400 });
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    
    // Add ID at the end
    values.push(id);

    const query = `UPDATE cupones SET ${updates.join(', ')} WHERE id = ?`;
    await db.run(query, values);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating coupon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  try {
    // 1. Verificar autenticación (Refuerzo de seguridad)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session')?.value;
    
    if (!adminSession) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const { id } = params;
    await db.run('DELETE FROM cupones WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting coupon:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
