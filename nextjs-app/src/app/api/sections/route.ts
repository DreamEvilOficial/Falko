import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sanitizeInput } from '@/lib/security';

export async function GET() {
  try {
    const sections = await db.all('SELECT * FROM homepage_sections ORDER BY orden ASC');
    return NextResponse.json(sections || []);
  } catch (error: any) {
    console.error('Error fetching sections:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { tipo, referencia_id, titulo, subtitulo, gif_url, orden, activo } = body;

    // Validación más flexible: solo tipo y titulo son estrictamente obligatorios
    if (!tipo || !titulo) {
      return NextResponse.json({ error: 'Tipo y título son obligatorios' }, { status: 400 });
    }

    const tituloSanitizado = sanitizeInput(titulo);
    const subtituloSanitizado = subtitulo ? sanitizeInput(subtitulo) : '';
    const gifUrlSanitizado = gif_url ? sanitizeInput(gif_url) : '';

    const sql = `
      INSERT INTO homepage_sections (tipo, referencia_id, titulo, subtitulo, gif_url, orden, activo) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const result = await db.run(sql, [
      tipo, 
      referencia_id || '', // Evitar nulos si no se envía
      tituloSanitizado, 
      subtituloSanitizado, 
      gifUrlSanitizado, 
      orden || 0, 
      activo ?? true
    ]);

    return NextResponse.json({ success: true, id: result.id });
  } catch (error: any) {
    console.error('Error creating section:', error);
    return NextResponse.json({ error: 'Error en el servidor: ' + error.message }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, tipo, referencia_id, titulo, subtitulo, gif_url, orden, activo } = body;
    
    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    const tituloSanitizado = titulo ? sanitizeInput(titulo) : titulo;
    const subtituloSanitizado = subtitulo ? sanitizeInput(subtitulo) : subtitulo;
    // gif_url is a URL, sanitizeInput might break it if it has weird chars, but usually URLs are safe from <script>
    // but better to be safe or validate URL format. For now, strict sanitize as it shouldn't have HTML.
    // wait, sanitizeInput removes ALL HTML tags. A URL like "https://example.com/image.gif" is fine.
    // A URL like "javascript:alert(1)" is handled by sanitizeInput (removes javascript:).
    const gifUrlSanitizado = gif_url ? sanitizeInput(gif_url) : gif_url;

    const sql = `
      UPDATE homepage_sections 
      SET tipo = ?, referencia_id = ?, titulo = ?, subtitulo = ?, 
          gif_url = ?, orden = ?, activo = ?
      WHERE id = ?
    `;

    await db.run(sql, [
      tipo, referencia_id, tituloSanitizado, subtituloSanitizado, 
      gifUrlSanitizado, orden, activo, id
    ]);

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating section:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });

    await db.run('DELETE FROM homepage_sections WHERE id = ?', [id]);
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting section:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
