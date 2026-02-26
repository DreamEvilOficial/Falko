import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const activoOnly = searchParams.get('activo') !== 'false';
    const tipo = searchParams.get('tipo');

    let sql = `SELECT * FROM banners WHERE 1=1`;
    const params: any[] = [];

    if (activoOnly) {
      sql += ` AND activo = TRUE`;
    }
    if (tipo) {
      sql += ` AND tipo = ?`;
      params.push(tipo);
    }

    sql += ` ORDER BY orden ASC, created_at DESC`;

    const banners = await db.all(sql, params);
    
    // Transformar al formato que esperaba el frontend si es necesario
    const topBanner = banners.find(b => b.tipo === 'top');
    const heroBanners = banners.filter(b => b.tipo === 'hero');

    return NextResponse.json({
      success: true,
      banners,
      config: {
        topBanner: topBanner ? { enabled: topBanner.activo, image: topBanner.imagen_url, link: topBanner.link_url } : { enabled: false, image: '', link: '' },
        heroBanners: heroBanners.map(b => ({ image: b.imagen_url, link: b.link_url, id: b.id }))
      }
    })
  } catch (error: any) {
    console.error('Error getting banners:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tipo, titulo, subtitulo, imagen_url, imagen_mobile_url, link_url, link_texto, activo, orden } = body;

    if (!imagen_url) {
      return NextResponse.json({ error: 'Imagen URL es requerida' }, { status: 400 });
    }

    const sql = `
      INSERT INTO banners (
        tipo, titulo, subtitulo, imagen_url, imagen_mobile_url, 
        link_url, link_texto, activo, orden
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      RETURNING id
    `;

    const result = await db.run(sql, [
      tipo || 'hero',
      titulo || null,
      subtitulo || null,
      imagen_url,
      imagen_mobile_url || null,
      link_url || null,
      link_texto || null,
      activo ?? true,
      orden || 0
    ]);

    return NextResponse.json({
      success: true,
      message: 'Banner creado exitosamente',
      id: result.id
    });
  } catch (error: any) {
    console.error('Error creating banner:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tipo, titulo, subtitulo, imagen_url, imagen_mobile_url, link_url, link_texto, activo, orden } = body;

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    const sql = `
      UPDATE banners 
      SET tipo = ?, titulo = ?, subtitulo = ?, imagen_url = ?, 
          imagen_mobile_url = ?, link_url = ?, link_texto = ?, 
          activo = ?, orden = ?, updated_at = NOW()
      WHERE id = ?
    `;

    await db.run(sql, [
      tipo, titulo, subtitulo, imagen_url, imagen_mobile_url, 
      link_url, link_texto, activo, orden, id
    ]);

    return NextResponse.json({ success: true, message: 'Banner actualizado' });
  } catch (error: any) {
    console.error('Error updating banner:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'ID es requerido' }, { status: 400 });
    }

    await db.run(`DELETE FROM banners WHERE id = ?`, [id]);
    return NextResponse.json({ success: true, message: 'Banner eliminado' });
  } catch (error: any) {
    console.error('Error deleting banner:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
