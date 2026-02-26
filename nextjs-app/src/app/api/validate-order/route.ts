import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db' // Changed from supabase to db for consistency with variants table
import { sanitizePrice } from '@/lib/security'

/**
 * API ROUTE: Validación Server-Side de Orden
 * 
 * ⚠️ CRÍTICO: Este endpoint DEBE ser llamado antes de crear la preferencia de pago
 * para evitar que el cliente manipule precios desde el navegador.
 */

export async function POST(request: NextRequest) {
  try {
    const { items, total, tipoPago } = await request.json()
    
    // Validar que lleguen items
    if (!items || !Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items requeridos' },
        { status: 400 }
      )
    }

    // Recalcular total en servidor usando precios reales de la BD
    let serverTotal = 0
    const validatedItems = []

    for (const item of items) {
      // Obtener precio REAL desde la base de datos
      const producto = await db.get(
        'SELECT id, nombre, precio, activo, stock_actual FROM productos WHERE id = ?',
        [item.id]
      )
      
      if (!producto) {
        return NextResponse.json(
          { error: `Producto ${item.id} no encontrado` },
          { status: 404 }
        )
      }

      // Verificar que el producto esté activo
      if (!producto.activo) {
        return NextResponse.json(
          { error: `El producto "${producto.nombre}" ya no está disponible` },
          { status: 400 }
        )
      }

      // Calcular stock disponible
      let stockDisponible = producto.stock_actual || 0
      
      // Si tiene variantes, verificar stock de la variante específica en tabla variantes
      if (item.talle && item.color) {
        // Buscar en tabla variantes
        const variante = await db.get(
            `SELECT stock FROM variantes 
             WHERE producto_id = ? AND talle = ? AND (color = ? OR color_hex = ?)`,
            [item.id, item.talle, item.color, item.color]
        );
        
        if (variante) {
            stockDisponible = variante.stock;
        } else {
            // Fallback legacy check if not in variants table
             // This might happen if migration didn't cover this product yet or it's a legacy structure
             // We'll stick to global stock if variant not found, or strict check?
             // Let's be strict but safe: if we implemented variants, we expect them. 
             // But for now, let's assume if not found, it might be an error or just global stock applies.
             // Actually, returning error is safer to prevent overselling.
             // But to be safe with partial migrations, let's check if the product *should* have variants.
             // For now, let's fallback to global stock but warn.
             console.warn(`Variant not found in table for validation: ${item.id} ${item.talle} ${item.color}`);
             // Try checking JSON column as last resort? No, let's just use global stock for now to avoid blocking, 
             // OR return error if we are sure everything is migrated.
             // Given the user wants "Corrección", let's be stricter.
             // If the user selected a variant, it MUST exist.
             return NextResponse.json(
                { error: `Variante no disponible: ${item.talle} - ${item.color}` },
                { status: 400 }
             )
        }
      }

      // Verificar stock disponible
      if (stockDisponible < item.cantidad) {
        return NextResponse.json(
          { error: `Stock insuficiente para "${producto.nombre}". Disponible: ${stockDisponible}` },
          { status: 400 }
        )
      }

      // Calcular precio según tipo de pago
      let precioFinal = sanitizePrice(producto.precio)
      
      if (tipoPago === 'transferencia') {
        // 10% de descuento en transferencia
        precioFinal = Math.round(precioFinal * 0.9)
      }
      
      // Acumular total
      const itemTotal = precioFinal * item.cantidad
      serverTotal += itemTotal

      validatedItems.push({
        id: producto.id,
        nombre: producto.nombre,
        precio: precioFinal,
        cantidad: item.cantidad,
        talle: item.talle || null,
        color: item.color || null,
        subtotal: itemTotal
      })
    }

    // Sanitizar y redondear total del servidor
    serverTotal = Math.round(serverTotal)

    // Verificar que el total coincida (tolerancia de 5 pesos por redondeos)
    const diferencia = Math.abs(serverTotal - total)
    
    if (diferencia > 5) {
      console.warn(`⚠️ Price mismatch detected! Client: ${total}, Server: ${serverTotal}`)
      return NextResponse.json(
        { 
          error: 'El total no coincide con los precios actuales',
          serverTotal,
          clientTotal: total,
          diferencia 
        },
        { status: 400 }
      )
    }

    // ✅ Validación exitosa
    return NextResponse.json({ 
      valid: true,
      serverTotal,
      items: validatedItems,
      message: 'Orden validada correctamente'
    })

  } catch (error: any) {
    console.error('Error validating order:', error)
    return NextResponse.json(
      { error: 'Error de validación', details: error.message },
      { status: 500 }
    )
  }
}
