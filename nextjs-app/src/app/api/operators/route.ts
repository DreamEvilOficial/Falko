import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const operators = await db.all('SELECT * FROM usuarios ORDER BY nombre');
    
    const parsed = operators.map((op: any) => ({
      ...op,
      activo: !!op.activo,
      permiso_categorias: !!op.permiso_categorias,
      permiso_productos: !!op.permiso_productos,
      permiso_configuracion: !!op.permiso_configuracion,
      permiso_ordenes: !!op.permiso_ordenes,
      admin: !!op.admin
    }));

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error loading operators:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, usuario, contrasena, rol, permiso_categorias, permiso_productos, permiso_configuracion, permiso_ordenes } = body;
    
    // Check if user exists
    const exists = await db.get('SELECT id FROM usuarios WHERE usuario = ?', [usuario]);
    if (exists) {
      return NextResponse.json({ error: 'El usuario ya existe' }, { status: 400 });
    }

    const id = uuidv4();
    
    // Insert using db.run (handles PostgreSQL normalization)
    await db.run(`
      INSERT INTO usuarios (
        id, nombre, usuario, contrasena, rol, 
        permiso_categorias, permiso_productos, permiso_configuracion, permiso_ordenes, 
        activo, admin
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, nombre, usuario, contrasena, rol || 'staff',
      !!permiso_categorias, !!permiso_productos, !!permiso_configuracion, !!permiso_ordenes, 
      true, (rol === 'admin')
    ]);

    return NextResponse.json({ success: true, id });
  } catch (error: any) {
    console.error('Error creating operator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, ...updates } = body;

    if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

    const fields = Object.keys(updates).filter(k => k !== 'id');
    if (fields.length === 0) return NextResponse.json({ success: true });

    const clauses = fields.map(f => `${f} = ?`).join(', ');
    const values = fields.map(f => updates[f]);

    await db.run(`UPDATE usuarios SET ${clauses}, updated_at = NOW() WHERE id = ?`, [...values, id]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating operator:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.run('DELETE FROM usuarios WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting operator:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
