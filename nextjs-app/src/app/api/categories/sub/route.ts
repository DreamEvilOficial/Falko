
import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const categoria_id = searchParams.get('categoria_id');

        let sql = 'SELECT * FROM subcategorias';
        const params = [];

        if (categoria_id) {
            sql += ' WHERE categoria_id = ?';
            params.push(categoria_id);
        }

        sql += ' ORDER BY orden ASC';
        const subs = await db.all(sql, params);
        return NextResponse.json(subs);
    } catch (err: any) {
        console.error('Error fetching subcategories:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        const { categoria_id, nombre, slug, orden, activo } = body;

        if (!categoria_id || !nombre || !slug) {
            return NextResponse.json({ error: 'categoria_id, nombre y slug son requeridos' }, { status: 400 });
        }

        const sql = `
            INSERT INTO subcategorias (categoria_id, nombre, slug, orden, activo) 
            VALUES (?, ?, ?, ?, ?)
            RETURNING id
        `;

        const result = await db.run(sql, [
            categoria_id,
            nombre,
            slug,
            orden || 0,
            activo ?? true
        ]);

        return NextResponse.json({ success: true, id: result.id });
    } catch (err: any) {
        console.error('Error creating subcategory:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, categoria_id, nombre, slug, orden, activo } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
        }

        const sql = `
            UPDATE subcategorias 
            SET categoria_id = ?, nombre = ?, slug = ?, orden = ?, activo = ?, updated_at = NOW()
            WHERE id = ?
        `;

        await db.run(sql, [categoria_id, nombre, slug, orden, activo, id]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error updating subcategory:', err);
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

        await db.run('DELETE FROM subcategorias WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('Error deleting subcategory:', err);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
