import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
    try {
        const { searchParams } = new URL(req.url);
        const id = searchParams.get('id');

        if (!id) {
            return NextResponse.json({ error: 'Falta el ID de la orden' }, { status: 400 });
        }

        // Buscar por numero_orden o por id (UUID)
        const order = await db.get(
            'SELECT id, numero_orden, estado, total, created_at, tracking_code, tracking_url FROM ordenes WHERE numero_orden = $1 OR id = $1',
            [id]
        );

        if (!order) {
            return NextResponse.json({ error: 'No se encontró la orden' }, { status: 404 });
        }

        return NextResponse.json(order);
    } catch (err: any) {
        console.error('[orders/track] Error:', err.message);
        return NextResponse.json({ error: 'Error interno del servidor' }, { status: 500 });
    }
}
