import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { sanitizeInput, sanitizeRichText } from '@/lib/security';
import { cookies } from 'next/headers';
import { toNumber } from '@/lib/formatters';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function GET(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        const slug = searchParams.get('slug');
        const category = searchParams.get('category');
        const featured = searchParams.get('featured');

        const normalizeProduct = (p: any) => {
            if (!p) return null;
            return {
                ...p,
                activo: p.activo === true || p.activo === 1 || p.activo === 'true',
                destacado: p.destacado === true || p.destacado === 1 || p.destacado === 'true',
                top: p.top === true || p.top === 1 || p.top === 'true',
                proximo_lanzamiento: p.proximo_lanzamiento === true || p.proximo_lanzamiento === 1 || p.proximo_lanzamiento === 'true' || p.proximamente === true || p.proximamente === 1,
                nuevo_lanzamiento: p.nuevo_lanzamiento === true || p.nuevo_lanzamiento === 1 || p.nuevo_lanzamiento === 'true',
                descuento_activo: p.descuento_activo === true || p.descuento_activo === 1 || p.descuento_activo === 'true',
                imagenes: typeof p.imagenes === 'string' ? JSON.parse(p.imagenes) : (p.imagenes || []),
                variantes: typeof p.variantes === 'string' ? JSON.parse(p.variantes) : (p.variantes || []),
                metadata: typeof p.metadata === 'string' ? JSON.parse(p.metadata) : (p.metadata || {}),
                dimensiones: typeof p.dimensiones === 'string' ? JSON.parse(p.dimensiones) : (p.dimensiones || null),
                avg_rating: Number(p.avg_rating) || 0,
                review_count: Number(p.review_count) || 0
            };
        };

        if (id) {
            const product = await db.get(`
                SELECT p.*, 
                       COALESCE((SELECT ROUND(AVG(r.calificacion), 1) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE), 0) as avg_rating,
                       (SELECT COUNT(*) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE) as review_count
                FROM productos p 
                WHERE p.id = ?
            `, [id]);
            if (!product) return NextResponse.json(null);

            const variants = await db.all('SELECT * FROM variantes WHERE producto_id = ? AND activo = true', [id]);
            const normalized = normalizeProduct(product);
            if (variants && variants.length > 0) {
                normalized.variantes = variants.map((v: any) => ({
                    ...v,
                    color_nombre: v.color, 
                    color: v.color_hex 
                }));
            }

            try {
                const drops = await db.all(
                    `SELECT d.* 
                     FROM producto_drops pd
                     JOIN drops d ON d.id = pd.drop_id
                     WHERE pd.producto_id = ?
                     ORDER BY d.fecha_lanzamiento DESC, d.created_at DESC`,
                    [id]
                );
                (normalized as any).drops = drops || [];
            } catch (e) {
                (normalized as any).drops = [];
            }

            return NextResponse.json(normalized);
        }

        if (slug) {
            const product = await db.get(`
                SELECT p.*, 
                       COALESCE(AVG(r.calificacion), 0) as avg_rating, 
                       COUNT(r.id) as review_count 
                FROM productos p 
                LEFT JOIN resenas r ON p.id = r.producto_id AND r.aprobado = TRUE
                WHERE p.slug = ?
                GROUP BY p.id
            `, [slug]);
            if (!product) return NextResponse.json([]);
            
            const variants = await db.all('SELECT * FROM variantes WHERE producto_id = ? AND activo = true', [product.id]);
            const normalized = normalizeProduct(product);
            if (variants && variants.length > 0) {
                 normalized.variantes = variants.map((v: any) => ({
                    ...v,
                    color_nombre: v.color, 
                    color: v.color_hex
                }));
            }

            try {
                const drops = await db.all(
                    `SELECT d.* 
                     FROM producto_drops pd
                     JOIN drops d ON d.id = pd.drop_id
                     WHERE pd.producto_id = ?
                     ORDER BY d.fecha_lanzamiento DESC, d.created_at DESC`,
                    [product.id]
                );
                (normalized as any).drops = drops || [];
            } catch (e) {
                (normalized as any).drops = [];
            }

            return NextResponse.json([normalized]);
        }

        let sql = `
            SELECT p.*, 
                   COALESCE((SELECT ROUND(AVG(r.calificacion), 1) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE), 0) as avg_rating,
                   (SELECT COUNT(*) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE) as review_count
            FROM productos p 
            WHERE p.activo = TRUE
        `;
        const params: any[] = [];

        if (category) {
            sql += ' AND p.categoria_id = ?';
            params.push(category);
        }

        if (featured === 'true') {
            sql += ' AND p.destacado = TRUE';
        }
        
        // New Filters
        const isNew = searchParams.get('new');
        if (isNew === 'true') {
            sql += ' AND p.nuevo_lanzamiento = TRUE';
        }

        const isUpcoming = searchParams.get('upcoming');
        if (isUpcoming === 'true') {
            sql += ' AND p.proximamente = TRUE';
        }

        const isDiscount = searchParams.get('discount');
        if (isDiscount === 'true') {
            sql += ' AND p.descuento_activo = TRUE';
        }

        sql += ' ORDER BY p.created_at DESC';

        const products = await db.all(sql, params);
        
        const normalized = products.map(p => {
            const n = normalizeProduct(p);
            if (n && n.nombre.toUpperCase().includes('ADIDAS')) {
                console.log(`[DEBUG ADIDAS] ID: ${n.id}, AVG: ${n.avg_rating}, COUNT: ${n.review_count}, RawAVG: ${p.avg_rating}`);
            }
            return n;
        });

        const withIds = normalized.filter(p => p && p.id);
        for (const p of withIds) {
            try {
                const drops = await db.all(
                    `SELECT d.* 
                     FROM producto_drops pd
                     JOIN drops d ON d.id = pd.drop_id
                     WHERE pd.producto_id = ?
                     ORDER BY d.fecha_lanzamiento DESC, d.created_at DESC`,
                    [p.id]
                );
                (p as any).drops = drops || [];
            } catch {
                (p as any).drops = [];
            }
        }

        return NextResponse.json(normalized);
    } catch (error: any) {
        console.error('[products:GET] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function POST(request: Request) {
    try {
        // 1. Verificar autenticación (Refuerzo de seguridad)
        const cookieStore = cookies();
        const adminSession = cookieStore.get('admin-session')?.value;
        const session = cookieStore.get('session')?.value;
        
        if (!adminSession && !session) {
            return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
        }

        const body = await request.json();
        const id = body.id || uuidv4();
        const dropIds = Array.isArray(body.drop_ids)
            ? body.drop_ids.filter((d: any) => typeof d === 'string' && d)
            : [];
        
        // Sanitización de inputs
        const nombreSafe = sanitizeInput(body.nombre || '');
        const slugSafe = body.slug ? sanitizeInput(body.slug) : nombreSafe.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const descripcionSafe = sanitizeRichText(body.descripcion || '');
        const proveedorNombreSafe = sanitizeInput(body.proveedor_nombre || '');
        const proveedorContactoSafe = sanitizeInput(body.proveedor_contacto || '');
        const skuSafe = sanitizeInput(body.sku || '');

        const productData = {
            id,
            nombre: nombreSafe,
            slug: slugSafe,
            descripcion: descripcionSafe,
            precio: toNumber(body.precio),
            precio_original: body.precio_original ? toNumber(body.precio_original) : null,
            descuento_porcentaje: body.descuento_porcentaje || 0,
            categoria_id: body.categoria_id,
            subcategoria_id: body.subcategoria_id,
            stock_actual: body.stock_actual || 0,
            stock_minimo: body.stock_minimo || 0,
            imagen_url: body.imagen_url || (body.imagenes && body.imagenes.length > 0 ? body.imagenes[0] : ''),
            imagenes: JSON.stringify(body.imagenes || []),
            variantes: JSON.stringify(body.variantes || []),
            activo: body.activo !== undefined ? body.activo : true,
            destacado: body.destacado || false,
            top: body.top || false,
            proximo_lanzamiento: body.proximo_lanzamiento || false,
            nuevo_lanzamiento: body.nuevo_lanzamiento || false,
            descuento_activo: body.descuento_activo || false,
            fecha_lanzamiento: body.fecha_lanzamiento || null,
            sku: skuSafe,
            proveedor_nombre: proveedorNombreSafe,
            proveedor_contacto: proveedorContactoSafe,
            precio_costo: body.precio_costo ? toNumber(body.precio_costo) : undefined,
            metadata: JSON.stringify(body.metadata || {})
        };

        const sql = `
            INSERT INTO productos (
                id, nombre, slug, descripcion, precio, precio_original, descuento_porcentaje,
                categoria_id, subcategoria_id, stock_actual, stock_minimo,
                imagen_url, imagenes, variantes, activo, destacado, top, 
                proximo_lanzamiento, proximamente, nuevo_lanzamiento, descuento_activo, fecha_lanzamiento,
                sku, proveedor_nombre, proveedor_contacto, precio_costo, metadata
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            ON CONFLICT (id) DO UPDATE SET
                nombre = EXCLUDED.nombre,
                slug = EXCLUDED.slug,
                descripcion = EXCLUDED.descripcion,
                precio = EXCLUDED.precio,
                precio_original = EXCLUDED.precio_original,
                descuento_porcentaje = EXCLUDED.descuento_porcentaje,
                categoria_id = EXCLUDED.categoria_id,
                subcategoria_id = EXCLUDED.subcategoria_id,
                stock_actual = EXCLUDED.stock_actual,
                stock_minimo = EXCLUDED.stock_minimo,
                imagen_url = EXCLUDED.imagen_url,
                imagenes = EXCLUDED.imagenes,
                variantes = EXCLUDED.variantes,
                activo = EXCLUDED.activo,
                destacado = EXCLUDED.destacado,
                top = EXCLUDED.top,
                proximo_lanzamiento = EXCLUDED.proximo_lanzamiento,
                proximamente = EXCLUDED.proximamente,
                nuevo_lanzamiento = EXCLUDED.nuevo_lanzamiento,
                descuento_activo = EXCLUDED.descuento_activo,
                fecha_lanzamiento = EXCLUDED.fecha_lanzamiento,
                sku = EXCLUDED.sku,
                proveedor_nombre = EXCLUDED.proveedor_nombre,
                proveedor_contacto = EXCLUDED.proveedor_contacto,
                precio_costo = EXCLUDED.precio_costo,
                metadata = EXCLUDED.metadata,
                updated_at = NOW()
        `;

        const params = [
            productData.id, productData.nombre, productData.slug, productData.descripcion,
            productData.precio, productData.precio_original, productData.descuento_porcentaje,
            productData.categoria_id, productData.subcategoria_id, productData.stock_actual,
            productData.stock_minimo, productData.imagen_url, productData.imagenes,
            productData.variantes, productData.activo, productData.destacado,
            productData.top, productData.proximo_lanzamiento, 
            productData.proximo_lanzamiento, // Sync proximamente with proximo_lanzamiento
            productData.nuevo_lanzamiento, productData.descuento_activo, productData.fecha_lanzamiento,
            productData.sku, productData.proveedor_nombre, productData.proveedor_contacto,
            productData.precio_costo, productData.metadata
        ];

        await db.transaction(async (tx) => {
            await db.run(sql, params, tx);

            // Sincronizar variantes en tabla dedicada
            if (body.variantes && Array.isArray(body.variantes)) {
                // 1. Prepare list of valid variants to keep (based on talle + color_hex)
                const validKeys = [];

                for (const v of body.variantes) {
                    if (!v.talle || !v.color) continue;
                    
                    const colorHex = v.color; 
                    const colorName = v.color_nombre || v.color;
                    const stock = parseInt(v.stock || '0');
                    
                    const cleanHex = colorHex.replace('#', '').substring(0, 6);
                    const sku = v.sku || `${id.substring(0,8)}-${v.talle}-${cleanHex}`.toUpperCase();
                    const imagenUrl = v.imagen_url || null;

                    await db.run(`
                        INSERT INTO variantes (producto_id, talle, color, color_hex, stock, sku, imagen_url, activo, updated_at)
                        VALUES ($1, $2, $3, $4, $5, $6, $7, true, NOW())
                        ON CONFLICT (producto_id, talle, color_hex) DO UPDATE SET
                            stock = EXCLUDED.stock,
                            color = EXCLUDED.color,
                            imagen_url = EXCLUDED.imagen_url,
                            activo = true,
                            updated_at = NOW()
                    `, [id, v.talle, colorName, colorHex, stock, sku, imagenUrl], tx);

                    validKeys.push({ talle: v.talle, hex: colorHex });
                }

                if (validKeys.length > 0) {
                    const conditions = validKeys.map(() => `NOT (talle = ? AND color_hex = ?)`).join(' AND ');
                    const deleteParams = [id, ...validKeys.flatMap(k => [k.talle, k.hex])];
                    await db.run(`DELETE FROM variantes WHERE producto_id = ? AND (${conditions})`, deleteParams, tx);
                } else {
                    await db.run('DELETE FROM variantes WHERE producto_id = ?', [id], tx);
                }
            }

            if (dropIds) {
                await db.run('DELETE FROM producto_drops WHERE producto_id = ?', [id], tx);
                for (const dropId of dropIds) {
                    await db.run(
                        `INSERT INTO producto_drops (producto_id, drop_id) 
                         VALUES (?, ?)
                         ON CONFLICT (producto_id, drop_id) DO NOTHING`,
                        [id, dropId],
                        tx
                    );
                }
            }
        });

        return NextResponse.json({ success: true, id });
    } catch (error: any) {
        console.error('[products:POST] Error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
