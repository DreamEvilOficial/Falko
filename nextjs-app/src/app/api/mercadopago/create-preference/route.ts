import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { items, ordenId, payer, shippingCost } = body

    // Obtener Access Token: Primero intentamos desde la DB, luego desde ENV
    const db = (await import('@/lib/db')).default
    let token = process.env.MERCADOPAGO_ACCESS_TOKEN || '';
    
    // Si no está en env, buscar en DB como fallback
    if (!token) {
        const tokenRow = await db.get("SELECT valor FROM configuracion WHERE clave = 'mercadopago_access_token'")
        if (tokenRow && tokenRow.valor) {
            try { token = JSON.parse(tokenRow.valor) } catch { token = tokenRow.valor }
        }
    }

    if (!token) {
      return NextResponse.json(
        { error: 'MercadoPago no configurado. Falta Access Token.' },
        { status: 400 }
      )
    }

    // Obtener la URL base del sitio
    const origin = new URL(request.url).origin
    // Preferir envs (para forzar https) y usar el origen como fallback
    const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || origin
    // Normalizar URLs con la API URL para evitar dobles barras o relativas
    const base = rawSiteUrl.endsWith('/') ? rawSiteUrl : `${rawSiteUrl}/`
    const successUrlObj = new URL('success', base)
    if (ordenId) successUrlObj.searchParams.set('orden', String(ordenId))
    const failureUrlObj = new URL('checkout', base)
    const pendingUrlObj = new URL('checkout', base)
    const notificationUrlObj = new URL('api/mercadopago/webhook', base)
    
    // Validar precios contra la base de datos
    const validatedItems = []
    
    for (const item of items) {
      if (!item.id) continue // Skip invalid items

      const product = await db.get(
        'SELECT id, nombre, precio, activo FROM productos WHERE id = ?',
        [item.id]
      )
        
      if (!product || !product.activo) {
        throw new Error(`Producto no disponible: ${item.title}`)
      }

      // Validar Stock
      const quantity = Number(item.quantity)
      if (item.talle && item.color) {
         // Validar stock de variante
         const variant = await db.get(
           'SELECT stock FROM variantes WHERE producto_id = ? AND talle = ? AND (color = ? OR color_hex = ?)',
           [product.id, item.talle, item.color, item.color]
         )
         
         if (!variant) {
            // Si no existe la variante, fallback a stock global (legacy) o error
            // Asumimos error para ser estrictos
            throw new Error(`Variante no encontrada: ${product.nombre} ${item.talle} ${item.color}`)
         }
         
         if (variant.stock < quantity) {
            throw new Error(`Stock insuficiente para ${product.nombre} (${item.talle} ${item.color}). Disponible: ${variant.stock}`)
         }
      } else {
         // Validar stock global
         if ((product.stock_actual || 0) < quantity) {
            throw new Error(`Stock insuficiente para ${product.nombre}. Disponible: ${product.stock_actual}`)
         }
      }

      // Calcular precio real (aplicando descuento transferencia si corresponde, 
      // aunque MP generalmente se usa para tarjetas, si el usuario eligió MP 
      // asumimos precio de lista o lo que corresponda según lógica de negocio.
      // Aquí usamos el precio de lista base para tarjeta/MP).
      const realPrice = Number(product.precio)

      // Verificar discrepancia mayor a $10 (tolerancia pequeña)
      if (Math.abs(realPrice - Number(item.unit_price)) > 10) {
        console.warn(`Price mismatch for ${product.nombre}. Client: ${item.unit_price}, Server: ${realPrice}`)
        // Force server price
      }

      // Construir título con variante si existe
      let title = product.nombre
      if (item.talle || item.color) {
        const parts = []
        if (item.talle) parts.push(item.talle)
        if (item.color) parts.push(item.color)
        title += ` (${parts.join(' - ')})`
      }

      validatedItems.push({
        title: title, // Usar nombre real de la BD + Variante
        unit_price: realPrice,
        quantity: quantity,
        currency_id: 'ARS'
      })
    }
    
    // Crear preferencia con items validados
    const preference: any = {
      items: validatedItems,
      payer: {
        email: payer.email,
        name: payer.name
      },
      // No excluir medios de pago para evitar errores como
      // "account money cannot be excluded" en algunas cuentas/regiones
      back_urls: {
        success: successUrlObj.toString(),
        failure: failureUrlObj.toString(),
        pending: pendingUrlObj.toString()
      },
      auto_return: 'approved',
      notification_url: notificationUrlObj.toString(),
      external_reference: ordenId
    }

    if (shippingCost && Number(shippingCost) > 0) {
      preference.shipments = {
        cost: Number(shippingCost),
        mode: 'not_specified'
      }
    }

    console.log('MP preference URLs:', {
      base,
      success: preference.back_urls.success,
      failure: preference.back_urls.failure,
      pending: preference.back_urls.pending,
      notification: preference.notification_url
    })

    console.log('MP preference payload:', JSON.stringify(preference))
    const mpResponse = await fetch('https://api.mercadopago.com/checkout/preferences', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(preference)
    })

    const data = await mpResponse.json()

    if (!mpResponse.ok) {
      console.error('Error de MercadoPago:', data)
      throw new Error(data.message || 'Error al crear preferencia')
    }
    
    return NextResponse.json({
      init_point: data.init_point,
      id: data.id
    })
  } catch (error: any) {
    console.error('Error creando preferencia:', error)
    return NextResponse.json(
      { error: error.message || 'Error al crear preferencia de pago' },
      { status: 500 }
    )
  }
}
