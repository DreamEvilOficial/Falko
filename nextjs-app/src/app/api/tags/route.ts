import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    const tags = await db.all('SELECT * FROM etiquetas ORDER BY nombre ASC');
    return NextResponse.json(tags);
  } catch (err) {
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}
