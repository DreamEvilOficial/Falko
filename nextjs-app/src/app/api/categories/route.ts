import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const categories = await db.all('SELECT * FROM categorias ORDER BY orden ASC');
    const subcategories = await db.all('SELECT * FROM subcategorias ORDER BY orden ASC');
    
    // Anidar subcategorías
    const result = categories.map((cat: any) => ({
        ...cat,
        activo: !!cat.activo,
        subcategorias: subcategories
            .filter((sub: any) => sub.categoria_id === cat.id)
            .map((sub: any) => ({ ...sub, activo: !!sub.activo }))
    }));
    
    return NextResponse.json(result);
  } catch (err: any) {
    console.error('Error fetching categories:', err);
    return NextResponse.json({ error: 'Database error: ' + err.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { nombre, slug, orden, activo } = body;

        if (!nombre || !slug) {
            return NextResponse.json({ error: 'Nombre y slug son requeridos' }, { status: 400 });
        }
        
        const nombreSanitizado = sanitizeInput(nombre);
        const slugSanitizado = sanitizeInput(slug);

        const sql = `
            INSERT INTO categorias (nombre, slug, orden, activo) 
            VALUES (?, ?, ?, ?)
            RETURNING id
        `;
        
        const result = await db.run(sql, [
            nombreSanitizado, 
            slugSanitizado, 
            orden || 0, 
            activo ?? true
        ]);

        return NextResponse.json({ success: true, id: result.id });
    } catch(err: any) {
        console.error('Error creating category:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, nombre, slug, orden, activo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }
        
        const nombreSanitizado = nombre ? sanitizeInput(nombre) : nombre;
        const slugSanitizado = slug ? sanitizeInput(slug) : slug;

        const sql = `
            UPDATE categorias 
            SET nombre = ?, slug = ?, orden = ?, activo = ?, updated_at = NOW()
            WHERE id = ?
        `;

        await db.run(sql, [nombreSanitizado, slugSanitizado, orden, activo, id]);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating category:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function DELETE(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        // El esquema tiene ON DELETE CASCADE para subcategorías y productos
        await db.run('DELETE FROM categorias WHERE id = ?', [id]);

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error deleting category:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
