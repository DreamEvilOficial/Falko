import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { sanitizeInput, sanitizeRichText } from '@/lib/security';
import { cookies } from 'next/headers';
import { supabase, supabaseAdmin } from '@/lib/supabase';
import { toNumber } from '@/lib/formatters';
import { sendEmail } from '@/lib/email';

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    const product = await db.get('SELECT * FROM productos WHERE id = ?', [id]) as any;
    if (!product) {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Parse JSON fields
    // Fetch variants from table (preferred)
    let variantsData = [];
    try {
        const variantsRows = await db.all('SELECT * FROM variantes WHERE producto_id = ? AND activo = true', [id]);
        if (variantsRows && variantsRows.length > 0) {
            variantsData = variantsRows.map((v: any) => ({
                ...v,
                // Map DB columns to frontend expected JSON structure
                color_nombre: v.color, // DB 'color' is name
                color: v.color_hex,    // DB 'color_hex' is hex (frontend expects 'color' as hex)
                stock: v.stock
            }));
        } else {
            // Fallback to JSON column
            variantsData = product.variantes ? (typeof product.variantes === 'string' ? JSON.parse(product.variantes) : product.variantes) : [];
        }
    } catch (e) {
        console.warn('Error fetching variants table, using fallback:', e);
        variantsData = product.variantes ? (typeof product.variantes === 'string' ? JSON.parse(product.variantes) : product.variantes) : [];
    }

    const parsedProduct = {
        ...product,
        activo: product.activo === true || product.activo === 1 || product.activo === 'true',
        destacado: product.destacado === true || product.destacado === 1 || product.destacado === 'true',
        top: product.top === true || product.top === 1 || product.top === 'true',
        proximo_lanzamiento: product.proximo_lanzamiento === true || product.proximo_lanzamiento === 1 || product.proximo_lanzamiento === 'true' || product.proximamente === true || product.proximamente === 1 || product.proximamente === 'true',
        proximamente: product.proximamente === true || product.proximamente === 1 || product.proximamente === 'true' || product.proximo_lanzamiento === true || product.proximo_lanzamiento === 1 || product.proximo_lanzamiento === 'true',
        nuevo_lanzamiento: product.nuevo_lanzamiento === true || product.nuevo_lanzamiento === 1 || product.nuevo_lanzamiento === 'true',
        descuento_activo: product.descuento_activo === true || product.descuento_activo === 1 || product.descuento_activo === 'true',
        imagenes: product.imagenes ? (typeof product.imagenes === 'string' ? JSON.parse(product.imagenes) : product.imagenes) : [],
        variantes: variantsData,
        dimensiones: product.dimensiones ? (typeof product.dimensiones === 'string' ? JSON.parse(product.dimensiones) : product.dimensiones) : null,
        metadata: product.metadata ? (typeof product.metadata === 'string' ? JSON.parse(product.metadata) : product.metadata) : null,
    };

    try {
        const drops = await db.all(
            `SELECT d.* 
             FROM producto_drops pd
             JOIN drops d ON d.id = pd.drop_id
             WHERE pd.producto_id = ?
             ORDER BY d.fecha_lanzamiento DESC, d.created_at DESC`,
            [id]
        );
        (parsedProduct as any).drops = drops || [];
    } catch {
        (parsedProduct as any).drops = [];
    }
    
    // Backend Auto-Unlock Logic REMOVED
    // We maintain the flag in DB.

    return NextResponse.json(parsedProduct);
  } catch (err) {
    console.error('Error fetching product:', err);
    return NextResponse.json({ error: 'Database error' }, { status: 500 });
  }
}

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const id = params.id;
  try {
    // 1. Verificar autenticación (Refuerzo de seguridad)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session')?.value;
    const session = cookieStore.get('session')?.value;
    
    if (!adminSession && !session) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    const body = await req.json();
    const { id: bodyId, ...updates } = body;

    const dropIds = Array.isArray((updates as any).drop_ids)
        ? (updates as any).drop_ids.filter((d: any) => typeof d === 'string' && d)
        : undefined;
    delete (updates as any).drop_ids;

    // Get current product state to check for status changes
    const currentProduct = await db.get('SELECT * FROM productos WHERE id = ?', [id]) as any;
    
    // Si viene 'proximamente', sincronizar con 'proximo_lanzamiento' para evitar inconsistencias
    if (updates.proximamente !== undefined && updates.proximo_lanzamiento === undefined) {
        updates.proximo_lanzamiento = updates.proximamente;
    } else if (updates.proximo_lanzamiento !== undefined && updates.proximamente === undefined) {
        updates.proximamente = updates.proximo_lanzamiento;
    }

    // Check if product is being launched (proximamente/proximo_lanzamiento changing from true to false)
    const wasUpcoming = currentProduct && (currentProduct.proximamente === 1 || currentProduct.proximamente === true || currentProduct.proximo_lanzamiento === 1 || currentProduct.proximo_lanzamiento === true);
    const isNowAvailable = (updates.proximamente === false || updates.proximo_lanzamiento === false);
    
    if (wasUpcoming && isNowAvailable) {
        // Trigger notification process asynchronously
        (async () => {
            try {
                // Fetch pending notifications
                const notifications = await db.all('SELECT * FROM proximamente_notificaciones WHERE producto_id = ? AND notificado = FALSE', [id]);
                
                if (notifications && notifications.length > 0) {
                    console.log(`[NOTIFICATIONS] Sending launch emails for product ${id} to ${notifications.length} users.`);
                    
                    const productName = currentProduct.nombre;
                    const subject = `¡Ya está disponible! ${productName} llegó a Urban`;
                    
                    // Basic HTML Template
                    const html = `
                        <div style="font-family: sans-serif; color: #111; max-width: 600px; margin: 0 auto; padding: 20px;">
                            <h1 style="text-transform: uppercase; font-weight: 900; font-style: italic; color: #000;">¡LLEGÓ LO QUE ESPERABAS!</h1>
                            <p>Hola,</p>
                            <p>Te avisamos que <strong>${productName}</strong> ya está disponible para comprar en nuestra tienda online.</p>
                            
                            <div style="margin: 30px 0; text-align: center;">
                                <a href="${process.env.NEXT_PUBLIC_SITE_URL}/productos/${id}" style="background: #000; color: #fff; padding: 15px 30px; text-decoration: none; font-weight: bold; text-transform: uppercase; border-radius: 8px;">
                                    COMPRAR AHORA
                                </a>
                            </div>
                            
                            <p style="font-size: 12px; color: #666; margin-top: 30px;">
                                Corré antes que se agote. El stock es limitado.
                            </p>
                        </div>
                    `;

                    let sentCount = 0;
                    for (const n of notifications) {
                         const sent = await sendEmail(n.email, subject, html);
                         if (sent) {
                             await db.run('UPDATE proximamente_notificaciones SET notificado = TRUE WHERE id = ?', [n.id]);
                             sentCount++;
                         }
                    }
                    
                    // Log to admin_logs
                    await db.run('INSERT INTO admin_logs (action, details, target_id) VALUES (?, ?, ?)', 
                        ['NOTIFICATIONS_SENT', `Sent ${sentCount}/${notifications.length} emails for product launch`, id]);
                }
            } catch (err) {
                console.error('[NOTIFICATIONS] Error processing notifications:', err);
            }
        })();
    }

    const keys = Object.keys(updates);
    
    if (keys.length === 0) {
        return NextResponse.json({ message: 'No changes provided' });
    }

    // Campos que deben ser tratados como números
    const NUMERIC_FIELDS = ['precio', 'precio_original', 'precio_costo', 'stock_actual', 'stock_minimo', 'descuento_porcentaje'];

    const cleanUpdates: Record<string, any> = {};
    const setClause = keys.map(key => `${key} = ?`).join(', ');
    const values = keys.map(key => {
        let val = updates[key];
        
        // Conversión explícita de tipos numéricos
        if (NUMERIC_FIELDS.includes(key)) {
            if (val === '' || val === null || val === undefined) {
                // Para 'precio' y 'stock_actual', preferimos 0 a null para evitar constraints
                val = (key === 'precio' || key === 'stock_actual') ? 0 : null;
            } else {
                // Use shared logic from formatters to ensure consistency with frontend
                val = toNumber(val);
            }
        }

        // Normalizar IDs de categoría / subcategoría
        if (key === 'categoria_id' || key === 'subcategoria_id') {
            if (
                val === '' ||
                val === null ||
                val === undefined ||
                val === 'null' ||
                val === 'undefined' ||
                val === 'Seleccionar...' ||
                val === 'Ninguna'
            ) {
                val = null;
            }
        }

        // Normalizar fecha de lanzamiento
        if (key === 'fecha_lanzamiento') {
            if (!val || val === '' || val === 'null' || val === 'undefined') {
                val = null;
            }
        }
        
        // Sanitize string inputs (solo si sigue siendo string)
        if (typeof val === 'string') {
            if (key === 'descripcion' || key === 'description') {
                val = sanitizeRichText(val);
            } else if (key !== 'imagenes' && key !== 'variantes' && key !== 'metadata' && key !== 'dimensiones') {
                val = sanitizeInput(val);
            }
        }

        // Save to cleanUpdates before stringifying for SQL
        cleanUpdates[key] = val;

        // Handle arrays/objects for JSON columns
        if (typeof val === 'object' && val !== null) {
          return JSON.stringify(val);
        }
        return val;
    });

    values.push(id);

    // Preparar detalles del log
    let logDetails = `Updated fields: ${keys.join(', ')}`;
    if (updates.nombre) logDetails += `. Name: ${updates.nombre}`;
    if (updates.precio) logDetails += `. Price: ${updates.precio}`;

    // Intentar realizar la operación
    try {
        // Primero intentamos con transacción si el pool está disponible
        await db.transaction(async (tx) => {
            const result = await db.run(`UPDATE productos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`, values, tx);
            
            if (result.changes === 0) {
                 throw new Error('PRODUCT_NOT_FOUND');
            }

            if (updates.variantes) {
                try {
                    await syncVariants(db, id, updates.variantes, tx);
                } catch (variantErr: any) {
                    console.warn('Warning: Could not sync variants table (using JSON column instead):', variantErr.message);
                    // No re-lanzamos el error para permitir que la actualización del producto (JSON) proceda
                }
            }

            if (dropIds) {
                await syncProductDrops(db, id, dropIds, tx);
            }

            try {
                await db.run(`INSERT INTO admin_logs (action, details, target_id) VALUES (?, ?, ?)`, 
                    ['PRODUCT_UPDATE', logDetails, id], tx);
            } catch (logErr) {
                console.warn('Could not write admin log:', logErr);
            }
        });
    } catch (err: any) {
        console.warn('Transaction failed, attempting fallback to Supabase Client:', err.message);

        const client = supabaseAdmin || supabase;
        if (!client) {
            console.error('No Supabase client available for fallback');
            throw err;
        }

        // Fallback: Use Supabase Client directly (Bypassing broken db.run fallback)
        try {
            // 1. Update Product
            // Remove 'variantes' from cleanUpdates for product table update if it exists there
            // (Wait, 'variantes' IS a column in 'productos' too, JSON column)
            // But we also sync to 'variantes' table.
            
            const { error: updateError } = await client
                .from('productos')
                .update({ ...cleanUpdates, updated_at: new Date().toISOString() })
                .eq('id', id);

            if (updateError) {
                // Check for 404-like error (not found)
                // Update returns count in header but supabase-js might not throw for 0 rows unless select() is used?
                // Actually update returns null data if no rows matched?
                // Let's assume if no error, it's fine.
                console.error('Supabase fallback update error:', updateError);
                throw new Error(updateError.message);
            }

            // 2. Sync Variants (if variants are provided)
            if (updates.variantes) {
                let variantsList = updates.variantes;
                if (typeof variantsList === 'string') {
                    try { variantsList = JSON.parse(variantsList); } catch (e) { variantsList = []; }
                }

                if (Array.isArray(variantsList)) {
                     // Prepare variants for upsert
                     const variantsToUpsert = variantsList
                        .filter((v: any) => v.talle && v.color)
                        .map((v: any) => {
                            const colorHex = v.color; 
                            const colorName = v.color_nombre || v.color;
                            const stock = parseInt(v.stock || '0');
                            const cleanHex = colorHex.replace('#', '').substring(0,6);
                            const sku = v.sku || `${id.substring(0,8)}-${v.talle}-${cleanHex}`.toUpperCase();
                            
                            return {
                                producto_id: id,
                                talle: v.talle,
                                color: colorName,
                                color_hex: colorHex,
                                stock: stock,
                                sku: sku,
                                imagen_url: v.imagen_url || null,
                                activo: true,
                                updated_at: new Date().toISOString()
                            };
                        });
                    
                    if (variantsToUpsert.length > 0) {
                         // Upsert
                         const { data: upsertedData, error: upsertError } = await client
                            .from('variantes')
                            .upsert(variantsToUpsert, { onConflict: 'producto_id, talle, color_hex' })
                            .select('id');
                         
                         if (upsertError) {
                             console.error('Error syncing variants in fallback (upsert):', upsertError);
                         } else if (upsertedData) {
                             // Delete variants not in the upserted list
                             const newIds = upsertedData.map((v: any) => v.id);
                             if (newIds.length > 0) {
                                 // "not.in" syntax: .not('id', 'in', `(${newIds.join(',')})`)
                                 await client
                                    .from('variantes')
                                    .delete()
                                    .eq('producto_id', id)
                                    .not('id', 'in', `(${newIds.join(',')})`);
                             }
                         }
                    } else {
                        // If empty list provided, delete all variants?
                        // Or maybe we shouldn't delete if empty list?
                        // Original syncVariants deletes if validKeys is empty.
                         await client
                            .from('variantes')
                            .delete()
                            .eq('producto_id', id);
                    }
                }
            }

            // 3. Log (Optional)
            try {
                 await client.from('admin_logs').insert({
                     action: 'PRODUCT_UPDATE',
                     details: logDetails,
                     target_id: id
                 });
            } catch (ignore) {}

        } catch (fallbackErr: any) {
            console.error('Supabase fallback failed:', fallbackErr);
            throw fallbackErr; // Throw original error or fallback error
        }
    }

    // fetch updated
    const updated = await db.get('SELECT * FROM productos WHERE id = ?', [id]);
    return NextResponse.json(updated);

  } catch (err: any) {
    console.error('[Product Update Error] Full details:', err);
    console.error('[Product Update Error] Stack:', err.stack);
    
    if (err.message === 'PRODUCT_NOT_FOUND') {
        return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    
    // Identificar errores de validación de base de datos comunes
    const msg = err.message || '';
    if (msg.includes('NOT NULL constraint failed') || msg.includes('violates not-null constraint')) {
        return NextResponse.json({ error: 'Faltan datos obligatorios (campos vacíos no permitidos)', details: msg }, { status: 400 });
    }
    if (msg.includes('CHECK constraint failed')) {
        return NextResponse.json({ error: 'Datos inválidos (violación de reglas de validación)', details: msg }, { status: 400 });
    }
    if (msg.includes('syntax error')) {
        return NextResponse.json({ error: 'Error de sintaxis en base de datos', details: msg }, { status: 500 });
    }

    return NextResponse.json({ error: 'Failed to update product', details: msg, originalError: err.toString() }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
    const id = params.id;
    try {
        const { changes } = await db.run('DELETE FROM productos WHERE id = ?', [id]);
        if (changes === 0) return NextResponse.json({ error: 'Product not found' }, { status: 404 });
        return NextResponse.json({ success: true });
    } catch (err) {
        return NextResponse.json({ error: 'Failed to delete' }, { status: 500 });
    }
}

// Helper function to sync variants
async function syncVariants(db: any, productId: string, variantsInput: any, tx: any) {
    let variantsList = variantsInput;
    if (typeof variantsList === 'string') {
        try { variantsList = JSON.parse(variantsList); } catch (e) { variantsList = []; }
    }

    if (Array.isArray(variantsList)) {
        const validKeys = [];

        for (const v of variantsList) {
            if (!v.talle || !v.color) continue;

            const colorHex = v.color; 
            const colorName = v.color_nombre || v.color;
            const stock = parseInt(v.stock || '0');
            
            const cleanHex = colorHex.replace('#', '').substring(0,6);
            const sku = v.sku || `${productId.substring(0,8)}-${v.talle}-${cleanHex}`.toUpperCase();
            const imagenUrl = v.imagen_url || null;

            // Upsert using ? placeholders for compatibility
            const sql = `
                INSERT INTO variantes (producto_id, talle, color, color_hex, stock, sku, imagen_url, activo, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
                ON CONFLICT(producto_id, talle, color_hex) 
                DO UPDATE SET 
                    stock = excluded.stock,
                    sku = excluded.sku,
                    imagen_url = excluded.imagen_url,
                    activo = excluded.activo,
                    updated_at = CURRENT_TIMESTAMP
            `;
            
            await db.run(sql, [productId, v.talle, colorName, colorHex, stock, sku, imagenUrl, true], tx);
            
            // Track valid keys to delete others later
            validKeys.push({ talle: v.talle, color_hex: colorHex });
        }

        // Delete variants that are not in the update list
        // Note: SQLite doesn't support complex WHERE (a,b) NOT IN ((x,y),...) easily.
        // We'll construct a condition.
        if (validKeys.length > 0) {
             const conditions = validKeys.map(() => `NOT (talle = ? AND color_hex = ?)`).join(' AND ');
             const params = validKeys.flatMap(k => [k.talle, k.color_hex]);
             await db.run(`DELETE FROM variantes WHERE producto_id = ? AND (${conditions})`, [productId, ...params], tx);
        } else {
             // If input array was empty (but valid array), delete all?
             // Logic above "if (!v.talle || !v.color) continue" might result in empty validKeys even if input not empty.
             // If validKeys is empty, it means no valid variants remaining.
             await db.run('DELETE FROM variantes WHERE producto_id = ?', [productId], tx);
        }
    }
}

// Helper function to sync product drops
async function syncProductDrops(db: any, productId: string, dropIds: string[], tx: any) {
    // 1. Delete existing associations
    await db.run('DELETE FROM producto_drops WHERE producto_id = ?', [productId], tx);

    if (!dropIds || dropIds.length === 0) {
        return;
    }

    // 2. Insert new ones
    for (const dropId of dropIds) {
        await db.run(
            `INSERT INTO producto_drops (producto_id, drop_id)
             VALUES (?, ?)
             ON CONFLICT (producto_id, drop_id) DO NOTHING`,
            [productId, dropId],
            tx
        );
    }
}

