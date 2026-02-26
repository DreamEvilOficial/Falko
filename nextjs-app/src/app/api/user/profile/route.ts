import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';
import { sanitizeInput } from '@/lib/security';

const SECRET_KEY = new TextEncoder().encode(process.env.JWT_SECRET || 'secret-key-urban-cdg');

export async function PUT(req: Request) {
  try {
    const sessionToken = cookies().get('session')?.value;
    if (!sessionToken) return NextResponse.json({ error: 'No autorizado' }, { status: 401 });

    const { jwtVerify } = require('jose');
    const { payload } = await jwtVerify(sessionToken, SECRET_KEY);
    const userId = payload.sub;

    const body = await req.json();
    const { nombre } = body;

    if (!nombre) return NextResponse.json({ error: 'Nombre es requerido' }, { status: 400 });
    
    const nombreSanitizado = sanitizeInput(nombre);

    await db.run('UPDATE usuarios SET nombre = ? WHERE id = ?', [nombreSanitizado, userId]);

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Error updating profile:', error);
    return NextResponse.json({ error: 'Error actualizando perfil' }, { status: 500 });
  }
}
