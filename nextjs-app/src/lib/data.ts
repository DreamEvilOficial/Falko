import db from '@/lib/db';
import { Producto, Categoria } from '@/lib/supabase';

function safeParse(input: any, fallback: any) {
  if (!input) return fallback;
  if (typeof input === 'object') return input;
  try { return JSON.parse(input); } catch { return fallback; }
}

function mapProduct(p: any): Producto {
  return {
    ...p,
    activo: !!p.activo,
    destacado: !!p.destacado,
    top: !!p.top,
    nuevo_lanzamiento: !!p.nuevo_lanzamiento,
    proximo_lanzamiento: !!p.proximamente,
    descuento_activo: !!p.descuento_activo,
    imagenes: safeParse(p.imagenes, []),
    variantes: safeParse(p.variantes, []),
    dimensiones: safeParse(p.dimensiones, null),
    metadata: safeParse(p.metadata, null),
    avg_rating: p.avg_rating ? Number(p.avg_rating) : 0,
    review_count: p.review_count ? Number(p.review_count) : 0
  };
}

export async function getSections() {
  try {
    const sections = await db.all('SELECT * FROM homepage_sections ORDER BY orden ASC');
    return sections;
  } catch (error) {
    console.error('Error fetching sections:', error);
    return [];
  }
}

export async function getProducts(options: {
  active?: boolean;
  destacado?: boolean;
  top?: boolean;
  nuevo?: boolean;
  proximamente?: boolean;
  descuento?: boolean;
  limit?: number;
  category_slug?: string;
  slug?: string;
} = {}) {
  let query = `
    SELECT p.*, 
           COALESCE((SELECT ROUND(AVG(r.calificacion), 1) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE), 0) as avg_rating,
           (SELECT COUNT(*) FROM resenas r WHERE r.producto_id = p.id AND r.aprobado = TRUE) as review_count
    FROM productos p 
    WHERE 1=1
  `;
  let params: any[] = [];

  if (options.active) {
    query += ' AND activo = 1';
  }
  
  if (options.destacado) {
    query += ' AND destacado = 1';
  }

  if (options.top) {
    query += ' AND top = 1';
  }
  
  if (options.nuevo) {
    query += ' AND nuevo_lanzamiento = 1';
    // Optional: date check if needed
  }

  if (options.proximamente) {
    query += ' AND proximamente = 1';
  }

  if (options.descuento) {
    query += ' AND descuento_activo = 1';
  }

  if (options.slug) {
    query += ' AND slug = ?';
    params.push(options.slug);
  }

  if (options.category_slug) {
     const category = await db.get('SELECT id FROM categorias WHERE slug = ?', [options.category_slug]) as any;
     if (category) {
         query += ' AND categoria_id = ?';
         params.push(category.id);
     } else {
         return [];
     }
  }

  query += ' ORDER BY created_at DESC';

  if (options.limit) {
    query += ' LIMIT ?';
    params.push(options.limit);
  }

  try {
    const products = await db.all(query, params);
    return products.map(mapProduct);
  } catch (err) {
    console.error('Error fetching products:', err);
    return [];
  }
}

export async function getAllProducts() {
    return getProducts({ active: true });
}

export async function getConfig() {
  try {
    const rows = await db.all('SELECT clave, valor FROM configuracion') as any[];
    const config: Record<string, any> = {};
    if (rows && rows.length > 0) {
      rows.forEach((item: any) => {
        try { config[item.clave] = JSON.parse(item.valor); }
        catch { config[item.clave] = item.valor; }
      });
    }
    return config;
  } catch (error) {
    console.error('Error fetching config:', error);
    return {};
  }
}
