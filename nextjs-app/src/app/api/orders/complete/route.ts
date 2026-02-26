import { NextRequest, NextResponse } from 'next/server'
import { supabase as db } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const { id } = await request.json()
    if (!id) return NextResponse.json({ error: 'Falta id' }, { status: 400 })

    // Evitar doble descuento: revisar logs
    const { data: already, error: logErr } = await db
      .from('admin_logs')
      .select('id')
      .eq('action', 'ORDER_STOCK_DISCOUNT')
      .eq('record_id', id)
      .maybeSingle()
    if (logErr) console.warn('admin_logs check error', logErr)
    if (already) return NextResponse.json({ ok: true, skipped: true })

    // Traer orden con items (y relación orden_items por si acaso)
    const { data: order, error: orderErr } = await db
      .from('ordenes')
      .select('*, orden_items(*)')
      .eq('id', id)
      .single()
    if (orderErr || !order) return NextResponse.json({ error: 'Orden no encontrada' }, { status: 404 })

    let items: any[] = []
    
    // Intento 1: Leer columna 'items' (JSON)
    try {
      const raw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
      items = Array.isArray(raw) ? raw : []
    } catch {
      items = []
    }

    // Intento 2: Si está vacío, usar relación 'orden_items'
    if (items.length === 0 && order.orden_items && Array.isArray(order.orden_items)) {
      items = order.orden_items.map((oi: any) => ({
        ...oi,
        id: oi.producto_id, // Adaptar para que coincida con la lógica de abajo (it.id)
      }))
    }

    if (!items.length) return NextResponse.json({ error: 'Sin items para descontar' }, { status: 400 })

    let updated = 0
    for (const it of items) {
      if (!it?.id || !it?.cantidad) continue

      // 1. Descontar de variante si existe
      let variantUpdated = false
      const vInfo = typeof it.variante_info === 'string' ? JSON.parse(it.variante_info) : (it.variante_info || it.variante || (it.talle && it.color ? { talle: it.talle, color: it.color } : null))

      if (vInfo?.talle && vInfo?.color) {
         // Buscar variante por talle y color (hex o nombre)
         // Como color puede ser nombre o hex, intentamos ambos o buscamos coincidencia
         // La consulta más segura es buscar por talle y coincidencia flexible en color
         const { data: variants, error: vErr } = await db
           .from('variantes')
           .select('id, stock, color, color_hex')
           .eq('producto_id', it.id)
           .eq('talle', vInfo.talle)
         
         if (!vErr && variants && variants.length > 0) {
             // Encontrar la variante correcta
             const targetVariant = variants.find(v => 
                 v.color === vInfo.color || 
                 v.color_hex === vInfo.color || 
                 v.color === vInfo.color_hex || 
                 v.color_hex === vInfo.color_hex
             )

             if (targetVariant) {
                 const nuevoStockV = Math.max(0, (targetVariant.stock || 0) - Number(it.cantidad))
                 await db
                   .from('variantes')
                   .update({ stock: nuevoStockV })
                   .eq('id', targetVariant.id)
                 variantUpdated = true
             }
         }
      }

      // 2. Descontar de producto global (Siempre, para mantener consistencia total)
      // Leer stock actual
      const { data: prod, error: pErr } = await db
        .from('productos')
        .select('stock_actual')
        .eq('id', it.id)
        .single()
      if (pErr || !prod) continue
      const nuevo = Math.max(0, (prod.stock_actual || 0) - Number(it.cantidad))
      const { error: upErr } = await db
        .from('productos')
        .update({ stock_actual: nuevo })
        .eq('id', it.id)
      if (!upErr) updated += 1
    }

    await db.from('admin_logs').insert({
      action: 'ORDER_STOCK_DISCOUNT',
      table_name: 'productos',
      record_id: id,
      new_data: { updated },
    })

    return NextResponse.json({ ok: true, updated })
  } catch (e) {
    console.error('orders/complete error', e)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
