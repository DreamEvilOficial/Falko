import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const filters = await db.all('SELECT * FROM filtros_especiales ORDER BY orden ASC');
    return NextResponse.json(filters || []);
  } catch (err: any) {
    console.error('Error getting filters:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { nombre, clave, imagen_url, icono, config, activo, orden } = body;

    if (!nombre || !clave) {
      return NextResponse.json({ error: 'Nombre y clave son requeridos' }, { status: 400 });
    }

    const sql = `
      INSERT INTO filtros_especiales (nombre, clave, imagen_url, icono, config, activo, orden) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const result = await db.run(sql, [
      nombre, 
      clave, 
      imagen_url || null, 
      icono || null, 
      config ? JSON.stringify(config) : '{}',
      activo ?? true, 
      orden || 0
    ]);

    return NextResponse.json({ success: true, id: result.id });
  } catch (err: any) {
    console.error('Error creating filter:', err);
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, nombre, clave, imagen_url, icono, config, activo, orden } = body;
        
        if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

        const sql = `
            UPDATE filtros_especiales 
            SET nombre = ?, clave = ?, imagen_url = ?, icono = ?, 
                config = ?, activo = ?, orden = ?
            WHERE id = ?
        `;

        await db.run(sql, [
            nombre, clave, imagen_url, icono, 
            config ? JSON.stringify(config) : '{}', 
            activo, orden, id
        ]);
        
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating filter:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

        await db.run('DELETE FROM filtros_especiales WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error deleting filter:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
