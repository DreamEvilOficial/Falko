import { NextRequest, NextResponse } from 'next/server'
import { supabase, supabaseAdmin } from '@/lib/supabase'
import { sanitizeInput, sanitizeRichText } from '@/lib/security'

export async function POST(req: NextRequest) {
  try {
    const { productoId, numeroOrden, nombre, email, comentario, rating } = await req.json()
    
    if (!productoId || !rating) {
      return NextResponse.json({ error: 'Datos incompletos' }, { status: 400 })
    }

    if (!numeroOrden) {
        return NextResponse.json({ error: 'El número de orden es obligatorio para verificar tu compra.' }, { status: 400 })
    }
    
    const cleanRating = Number(rating)
    if (!Number.isFinite(cleanRating) || cleanRating < 1 || cleanRating > 5) {
      return NextResponse.json({ error: 'Calificación inválida' }, { status: 400 })
    }
    
    // Sanitización de seguridad
    const text = sanitizeRichText(String(comentario || ''));
    const cleanNombre = sanitizeInput(String(nombre || 'Cliente'));
    const cleanEmail = sanitizeInput(String(email || ''));
    const cleanOrden = sanitizeInput(String(numeroOrden));

    if (text.length > 500) { 
      return NextResponse.json({ error: 'Comentario demasiado largo' }, { status: 400 })
    }

    // Verificar si el producto existe
    const { data: product, error: productError } = await (supabaseAdmin || supabase)
      .from('productos')
      .select('id')
      .eq('id', productoId)
      .single();
      
    if (productError || !product) {
      console.error('[reviews/submit] Product not found:', productoId);
      return NextResponse.json({ error: 'Producto no encontrado' }, { status: 404 })
    }

    // Verificar orden con supabaseAdmin para evitar problemas de RLS
    const client = supabaseAdmin || supabase;
    
    // Búsqueda flexible del número de orden
    // Intentamos match exacto, luego ignorando prefijos comunes
    const possibleNumbers = [
        numeroOrden,
        `ORDEN-${numeroOrden}`,
        `ORD-${numeroOrden}`,
        `#${numeroOrden}`,
        numeroOrden.replace(/^ORD-|^ORDEN-|^#/i, '')
    ].filter((v, i, a) => a.indexOf(v) === i); // Unicos

    console.log(`[reviews/submit] Checking possible order numbers:`, possibleNumbers);

    const { data: orders, error: orderError } = await client
      .from('ordenes')
      .select('id, numero_orden, estado')
      .or(`numero_orden.ilike.%${numeroOrden}%,numero_orden.eq.${numeroOrden}`);
    
    // Buscar la mejor coincidencia
    const order = orders?.find((o: any) => 
        possibleNumbers.some(n => o.numero_orden.toUpperCase() === n.toUpperCase())
    ) || orders?.[0]; // Fallback al primero que encontró por ilike si no hay match exacto en la lista
    
    if (orderError || !order) {
        console.warn(`[reviews/submit] Order not found: ${numeroOrden}`);
        return NextResponse.json({ error: 'Número de orden no encontrado. Por favor verificá que esté escrito correctamente.' }, { status: 404 })
    }

    console.log(`[reviews/submit] Found order: ${order.numero_orden} (ID: ${order.id}) Status: ${order.estado}`);

    // 2. Verificar que el producto esté en la orden
    const { data: item, error: itemError } = await client
      .from('orden_items')
      .select('id')
      .eq('orden_id', order.id)
      .eq('producto_id', productoId)
      .maybeSingle();

    if (!item) {
        console.warn(`[reviews/submit] Product ${productoId} not in order ${order.id}`);
        return NextResponse.json({ error: 'Este producto no figura en la orden indicada.' }, { status: 400 })
    }

    const verificado = true;
    const aprobado = true; // Auto-aprobar si verificado

    const { error: insertError } = await supabase
      .from('resenas')
      .insert({
        producto_id: productoId,
        cliente_nombre: cleanNombre,
        cliente_email: cleanEmail || null,
        calificacion: cleanRating,
        comentario: text,
        numero_orden: cleanOrden,
        verificado,
        aprobado
      });

    if (insertError) throw insertError;

    return NextResponse.json({ 
      success: true, 
      message: '¡Reseña enviada con éxito! Será publicada en breve.' 
    });
  } catch (e: any) {
    console.error('reviews/submit error', e)
    return NextResponse.json({ error: 'Error interno: ' + e.message }, { status: 500 })
  }
}
