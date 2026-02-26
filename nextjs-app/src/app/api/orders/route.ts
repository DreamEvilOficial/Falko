import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput } from '@/lib/security';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get('email');
    const id = searchParams.get('id');

    try {
        if (id) {
            const order = await db.get('SELECT * FROM ordenes WHERE id = ?', [id]);
            if (order) {
                const items = await db.all('SELECT * FROM orden_items WHERE orden_id = ?', [id]);

                const enrichedItems = [];

                for (const rawItem of items as any[]) {
                    const productoId = (rawItem as any).producto_id;
                    let nombre = '';
                    let imagenUrl: string | null = null;

                    if (productoId) {
                        const productRow: any = await db.get(
                            'SELECT nombre, imagen_url, imagenes FROM productos WHERE id = ?',
                            [productoId]
                        );

                        if (productRow) {
                            nombre = productRow.nombre || '';
                            if (productRow.imagen_url) {
                                imagenUrl = productRow.imagen_url;
                            } else if (productRow.imagenes) {
                                try {
                                    const arr = typeof productRow.imagenes === 'string'
                                        ? JSON.parse(productRow.imagenes)
                                        : productRow.imagenes;
                                    if (Array.isArray(arr) && arr.length > 0) {
                                        imagenUrl = arr[0];
                                    }
                                } catch {
                                    imagenUrl = null;
                                }
                            }
                        }
                    }

                    let varianteInfo: any = {};
                    if (rawItem.variante_info) {
                        try {
                            varianteInfo = typeof rawItem.variante_info === 'string'
                                ? JSON.parse(rawItem.variante_info)
                                : rawItem.variante_info;
                        } catch {
                            varianteInfo = {};
                        }
                    }

                    const enriched = {
                        ...rawItem,
                        nombre: nombre || varianteInfo.nombre || '',
                        imagen_url: imagenUrl,
                        talle: varianteInfo.talle || rawItem.talle || null,
                        color: varianteInfo.color || varianteInfo.color_hex || rawItem.color || null,
                        precio: rawItem.precio_unitario,
                        cantidad: rawItem.cantidad
                    };

                    enrichedItems.push(enriched);
                }

                (order as any).items = enrichedItems;
            }
            return NextResponse.json(order || null);
        }
        
        let query = 'SELECT * FROM ordenes WHERE 1=1';
        let params: any[] = [];

        if (email) {
            query += ' AND cliente_email = ?';
            params.push(email);
        }

        query += ' ORDER BY created_at DESC';

        const orders = await db.all(query, params);
        return NextResponse.json(orders);
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
    try {
        const body = await req.json();
        console.log('[orders:POST] Received body:', JSON.stringify(body, null, 2));

        const { items, total, subtotal, envio, descuento, notas, metodo_pago, cliente_nombre, cliente_email, cliente_telefono, direccion_envio, coupon_code } = body;

        // 1. Validaciones básicas
        if (!items || !Array.isArray(items) || items.length === 0) {
            return NextResponse.json({ error: 'La orden debe tener al menos un producto.' }, { status: 400 });
        }

        // 🔒 SEGURIDAD: Validación estricta de precios y totales en servidor
        let calculatedSubtotal = 0;
        const validatedItems = [];

        // Fetch de todos los productos para validar precios
        for (const item of items) {
             const pid = item.producto_id || item.id;
             if (!pid) continue;
             
             // Obtener precio real DB
             const dbProd = await db.get('SELECT precio, activo, nombre FROM productos WHERE id = ?', [pid]);
             if (!dbProd) throw new Error(`Producto no encontrado: ${pid}`);
             if (!dbProd.activo) throw new Error(`Producto inactivo: ${dbProd.nombre}`);
             
             const qty = Number(item.cantidad) || 1;
             const realPrice = Number(dbProd.precio);
             
             calculatedSubtotal += realPrice * qty;
             validatedItems.push({ ...item, precio_unitario: realPrice });
        }

        // Validar Subtotal (permitir pequeña diferencia por redondeo)
        if (Math.abs(calculatedSubtotal - Number(subtotal)) > 10) {
             console.warn(`[Security] Subtotal mismatch. Client: ${subtotal}, Server: ${calculatedSubtotal}`);
             // Rechazar si la diferencia es significativa
             // throw new Error('Error de validación de precios: El subtotal no coincide.');
             // Por ahora, forzar el uso del subtotal calculado por el servidor para la orden
        }
        
        // Recalcular descuentos
        let serverDiscount = 0;
        
        // 1. Cupón
        if (coupon_code) {
             const coupon = await db.get('SELECT * FROM cupones WHERE codigo = ? AND activo = true', [coupon_code]);
             if (coupon) {
                 // Validar expiración y usos
                 const now = new Date();
                 if (coupon.valido_hasta && new Date(coupon.valido_hasta) < now) {
                     throw new Error(`El cupón ${coupon_code} ha expirado`);
                 }
                 if (coupon.max_uso_total && (coupon.usos_actuales || 0) >= coupon.max_uso_total) {
                     throw new Error(`El cupón ${coupon_code} se ha agotado`);
                 }

                 if (coupon.tipo === 'porcentaje') {
                     serverDiscount += calculatedSubtotal * (Number(coupon.valor) / 100);
                 } else {
                     serverDiscount += Number(coupon.valor);
                 }
                 
                 // Increment usage count (should be done in transaction later)
             }
        }
        
        // 2. Descuento Transferencia (10% sobre el total con envío incluido, según lógica frontend)
        // Frontend logic: (total - coupon + shipping) * 0.1
        // Wait, frontend applies transfer discount on final total?
        // PaymentPage.tsx: discountAmount = isBank ? Math.round(deliveryData?.finalTotal * 0.1) : 0
        // deliveryData.finalTotal includes shipping.
        // Let's replicate this policy or trust the client ONLY if it's within 10% range.
        
        if (metodo_pago === 'transferencia') {
             // Calculate base for transfer discount
             const baseForTransfer = (calculatedSubtotal - serverDiscount) + Number(envio || 0);
             const transferDisc = baseForTransfer * 0.10;
             serverDiscount += transferDisc;
        }
        
        // Validar Total Final
        const calculatedTotal = (calculatedSubtotal + Number(envio || 0)) - serverDiscount;
        
        // Verificar discrepancia grave (> $50 pesos)
        if (Math.abs(Number(total) - calculatedTotal) > 50) {
             console.error(`[Security] Total mismatch! Client: ${total}, Server: ${calculatedTotal}`);
             // Si el cliente envía un total mucho menor, es un intento de hackeo.
             // Si es mayor, podría ser error de cálculo, pero igual sospechoso.
             if (Number(total) < calculatedTotal - 50) {
                 return NextResponse.json({ error: 'Error de seguridad: El total no coincide con los precios vigentes.' }, { status: 400 });
             }
        }

        // Usar valores calculados por servidor para la orden (Sanitización definitiva)
        const finalSubtotal = calculatedSubtotal;
        const finalTotal = Math.max(0, calculatedTotal); // No permitir negativos
        const finalDiscount = serverDiscount;


        // Normalizar y sanitizar datos del cliente
        const nombre = sanitizeInput(cliente_nombre || '');
        const email = sanitizeInput(cliente_email || '');
        const telefono = sanitizeInput(cliente_telefono || '');
        const direccion = sanitizeInput(direccion_envio || '');
        const notasSeguras = sanitizeInput(notas || '');
        const metodoPagoSeguro = sanitizeInput(metodo_pago || 'transferencia');

        if (!nombre) {
            return NextResponse.json({ error: 'El nombre del cliente es obligatorio.' }, { status: 400 });
        }

        const orderId = uuidv4();

        await db.raw('CREATE SEQUENCE IF NOT EXISTS orden_seq START 1');

        const result = await db.transaction(async (client) => {
            const seqResult = await client.query("SELECT nextval('orden_seq') AS seq");
            const rawSeq = seqResult.rows[0]?.seq ?? seqResult.rows[0]?.nextval ?? 0;
            const seqNumber = Number(rawSeq) || 1;
            const numericPart = ((seqNumber - 1) % 100000) + 1;
            const numeroOrden = `orden-${numericPart.toString().padStart(5, '0')}`;

            const insertOrderQuery = `
                INSERT INTO ordenes (
                    id, numero_orden, cliente_nombre, cliente_email, cliente_telefono, direccion_envio,
                    subtotal, total, envio, descuento, estado, metodo_pago, notas
                ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
            `;
            
            await client.query(insertOrderQuery, [
                orderId, 
                numeroOrden, 
                nombre, 
                email || null, 
                telefono || null,
                direccion || null,
                finalSubtotal,
                finalTotal,
                envio || 0,
                finalDiscount,
                'pendiente', 
                metodoPagoSeguro, 
                notasSeguras
            ]);

            // B. Procesar items
            for (const item of items) {
                // Detectar ID del producto (puede venir como 'id' o 'producto_id')
                const productId = item.producto_id || item.id;
                
                if (!productId) {
                    throw new Error(`Item sin ID de producto válido: ${JSON.stringify(item)}`);
                }

                // Bloquear fila del producto para actualizar stock (evita condiciones de carrera)
                const productResult = await client.query(
                    'SELECT id, nombre, stock_actual FROM productos WHERE id = $1 FOR UPDATE',
                    [productId]
                );
                
                const product = productResult.rows[0];

                if (!product) {
                    throw new Error(`Producto no encontrado (ID: ${productId})`);
                }

                // Validar stock
                const cantidad = Number(item.cantidad) || 1;
                
                // Construir información de variante
                const varianteInfo = item.variante || item.variante_info || { 
                    talle: item.talle, 
                    color: item.color 
                };

                // Si hay información de variante, validar y descontar de la tabla de variantes
                if (varianteInfo.talle && varianteInfo.color) {
                    // Normalizar color (si viene hex o nombre, tratar de buscar coincidencia)
                    // Asumimos que el frontend envía el color tal cual está en la BD (hex o nombre)
                    // Pero idealmente deberíamos buscar por talle y color_hex o color
                    
                    // Buscar variante específica
                    const variantQuery = `
                        SELECT id, stock, talle, color, color_hex 
                        FROM variantes 
                        WHERE producto_id = $1 
                        AND talle = $2 
                        AND (color = $3 OR color_hex = $3)
                        FOR UPDATE
                    `;
                    
                    const variantResult = await client.query(variantQuery, [
                        productId, 
                        varianteInfo.talle, 
                        varianteInfo.color
                    ]);

                    const variante = variantResult.rows[0];

                    if (!variante) {
                        // Fallback: Si no existe en tabla variantes, quizás es un producto antiguo o error de sincro.
                        // Permitimos continuar si hay stock global, pero logueamos advertencia.
                        console.warn(`[Order] Variante no encontrada en tabla: ${productId} ${varianteInfo.talle} ${varianteInfo.color}`);
                        
                        // Validar contra stock global si no hay variante (comportamiento legacy)
                        if (product.stock_actual < cantidad) {
                            throw new Error(`Stock insuficiente para "${product.nombre}". Solicitado: ${cantidad}, Disponible: ${product.stock_actual}`);
                        }
                    } else {
                        // Validar stock de variante
                        if (variante.stock < cantidad) {
                            throw new Error(`Stock insuficiente para "${product.nombre} (${varianteInfo.talle} ${varianteInfo.color})". Solicitado: ${cantidad}, Disponible: ${variante.stock}`);
                        }

                        // Descontar stock de variante
                        await client.query(
                            'UPDATE variantes SET stock = stock - $1, updated_at = NOW() WHERE id = $2',
                            [cantidad, variante.id]
                        );
                    }
                } else {
                    // Validar stock global si no es variante
                    if (product.stock_actual < cantidad) {
                        throw new Error(`Stock insuficiente para "${product.nombre}". Solicitado: ${cantidad}, Disponible: ${product.stock_actual}`);
                    }
                }

                // Insertar item de orden
                await client.query(`
                    INSERT INTO orden_items (
                        orden_id, producto_id, cantidad, precio_unitario, variante_info
                    ) VALUES ($1, $2, $3, $4, $5)
                `, [
                    orderId, 
                    productId, 
                    cantidad, 
                    item.precio_unitario || item.precio || 0, 
                    JSON.stringify(varianteInfo)
                ]);

                // Actualizar stock global del producto (siempre se descuenta del total)
                await client.query(`
                    UPDATE productos 
                    SET stock_actual = stock_actual - $1 
                    WHERE id = $2
                `, [cantidad, productId]);
            }

            return { orderId, numeroOrden };
        });

        console.log('[orders:POST] Order created successfully:', result);

        return NextResponse.json({ 
            success: true, 
            id: result.orderId, 
            numero_orden: result.numeroOrden 
        });

    } catch (err: any) {
        console.error('[orders:POST] Transaction failed:', err);
        
        // Devolver un error JSON limpio
        return NextResponse.json({ 
            error: err.message || 'Error al procesar la orden', 
            details: err.stack 
        }, { status: 500 });
    }
}

export async function PUT(req: Request) {
    try {
        const body = await req.json();
        const { id, estado, tracking_code, tracking_url } = body;

        if (!id) {
            return NextResponse.json({ error: 'ID is required' }, { status: 400 });
        }

        if (estado) {
            await db.run('UPDATE ordenes SET estado = ? WHERE id = ?', [estado, id]);
        }

        if (tracking_code !== undefined || tracking_url !== undefined) {
            await db.run(
                'UPDATE ordenes SET tracking_code = ?, tracking_url = ? WHERE id = ?',
                [tracking_code || null, tracking_url || null, id]
            );
        }

        return NextResponse.json({ success: true });
    } catch (err: any) {
        console.error('[orders:PUT] Error:', err.message);
        return NextResponse.json({ error: err.message }, { status: 500 });
    }
}
