import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Verificar autenticación (Refuerzo de seguridad)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session')?.value;
    
    if (!adminSession) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const result = await db.run("DELETE FROM ordenes WHERE estado = 'pendiente'");
    return NextResponse.json({ 
      success: true, 
      message: `Deleted ${result.changes} pending orders.` 
    });
  } catch (error: any) {
    console.error('Cleanup error:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
