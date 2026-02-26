import { NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const limitParam = searchParams.get('limit');
    const limit = limitParam === 'all' ? 1000 : parseInt(limitParam || '50');
    const productId = searchParams.get('productId');
    const approvedOnly = searchParams.get('approved') !== 'false';

    console.log('[Reviews API] Fetching reviews with params:', { limit, productId, approvedOnly });

    // Intento 1: Consulta optimizada con Join (si la FK existe)
    try {
      let query = supabase
        .from('resenas')
        .select(`
          id,
          calificacion,
          comentario,
          created_at,
          producto_id,
          cliente_nombre,
          cliente_email,
          aprobado,
          productos (
            nombre,
            imagen_url
          )
        `)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) {
        query = query.eq('producto_id', productId);
      }
      
      if (approvedOnly) {
        query = query.eq('aprobado', true);
      }

      const { data, error } = await query;

      if (!error && data) {
        const formatted = data.map((r: any) => ({
          id: r.id,
          rating: r.calificacion,
          comentario: r.comentario,
          created_at: r.created_at,
          producto_id: r.producto_id,
          usuario_nombre: r.cliente_nombre,
          usuario_email: r.cliente_email,
          aprobado: r.aprobado,
          producto_nombre: r.productos?.nombre || 'Producto desconocido',
          producto_imagen: r.productos?.imagen_url || null
        }));
        return NextResponse.json(formatted);
      }
      
      if (error) {
        console.warn('[Reviews API] Join query failed, attempting fallback:', error.message);
        throw error; // Ir al catch para usar fallback
      }
    } catch (joinError) {
      // Intento 2: Consultas separadas (Manual Join) - A prueba de fallos
      console.log('[Reviews API] Executing manual join fallback...');
      
      // 1. Obtener reseñas
      let query = supabase
        .from('resenas')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);

      if (productId) query = query.eq('producto_id', productId);
      if (approvedOnly) query = query.eq('aprobado', true);

      const { data: reviews, error: reviewsError } = await query;

      if (reviewsError) throw reviewsError;
      if (!reviews || reviews.length === 0) return NextResponse.json([]);

      // 2. Obtener productos relacionados
      const productIds = Array.from(new Set(reviews.map((r: any) => r.producto_id).filter(Boolean)));
      
      let productsMap: Record<string, any> = {};
      
      if (productIds.length > 0) {
        const { data: products, error: productsError } = await supabase
          .from('productos')
          .select('id, nombre, imagen_url')
          .in('id', productIds);
          
        if (!productsError && products) {
          productsMap = products.reduce((acc: any, p: any) => {
            acc[p.id] = p;
            return acc;
          }, {});
        }
      }

      // 3. Combinar resultados
      const combined = reviews.map((r: any) => ({
        id: r.id,
        rating: r.calificacion,
        comentario: r.comentario,
        created_at: r.created_at,
        producto_id: r.producto_id,
        usuario_nombre: r.cliente_nombre,
        usuario_email: r.cliente_email,
        aprobado: r.aprobado,
        producto_nombre: productsMap[r.producto_id]?.nombre || 'Producto no encontrado',
        producto_imagen: productsMap[r.producto_id]?.imagen_url || null
      }));

      return NextResponse.json(combined);
    }

    return NextResponse.json([]);
  } catch (error: any) {
    console.error('[Reviews API] Critical error:', error);
    // Retornar array vacío en caso de error de tabla no encontrada para no romper el frontend
    if (error.message?.includes('relation') || error.message?.includes('does not exist')) {
        return NextResponse.json([]);
    }
    return NextResponse.json({ error: error.message || 'Error desconocido' }, { status: 500 });
  }
}

export async function PUT(req: Request) {
  try {
    const body = await req.json();
    const { id, aprobado, destacado } = body;

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const updates: any = {};
    if (aprobado !== undefined) updates.aprobado = aprobado;
    if (destacado !== undefined) updates.destacado = destacado;

    const { error } = await supabase
      .from('resenas')
      .update(updates)
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error updating review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ error: 'ID requerido' }, { status: 400 });

    const { error } = await supabase
      .from('resenas')
      .delete()
      .eq('id', id);

    if (error) throw error;

    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('Error deleting review:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
