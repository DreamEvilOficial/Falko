import { NextRequest, NextResponse } from 'next/server';
import db from '@/lib/db';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { orderId } = body;

    if (!orderId) {
      return NextResponse.json({ error: 'Order ID is required' }, { status: 400 });
    }

    // Update order status to cancelled
    await db.run("UPDATE ordenes SET estado = 'cancelado' WHERE id = ? AND estado = 'pendiente'", [orderId]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('[transfer/cancel] Error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
