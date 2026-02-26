import { NextRequest, NextResponse } from 'next/server';
import { revalidatePath, revalidateTag } from 'next/cache';

/**
 * Webhook para revalidación automática de páginas
 * Este endpoint se debe configurar en Supabase como webhook de base de datos
 */

interface WebhookPayload {
  type: 'INSERT' | 'UPDATE' | 'DELETE';
  table: string;
  record?: any;
  old_record?: any;
  schema: string;
}

export async function POST(req: NextRequest) {
  try {
    // Verificar token de seguridad
    const authHeader = req.headers.get('authorization');
    const expectedToken = process.env.WEBHOOK_SECRET;

    if (!expectedToken || authHeader !== `Bearer ${expectedToken}`) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const payload: WebhookPayload = await req.json();
    console.log('[REVALIDATE] Webhook received:', payload);

    // Revalidar basado en la tabla modificada
    switch (payload.table) {
      case 'productos':
        // Revalidar páginas de productos
        revalidatePath('/productos');
        revalidatePath('/');
        revalidateTag('products');
        
        // Si es un UPDATE o DELETE, revalidar la página específica del producto
        if (payload.record?.slug) {
          revalidatePath(`/productos/${payload.record.slug}`);
        }
        if (payload.old_record?.slug) {
          revalidatePath(`/productos/${payload.old_record.slug}`);
        }
        
        console.log('[REVALIDATE] Products pages revalidated');
        break;

      case 'categorias':
        // Revalidar todas las páginas de categorías
        revalidatePath('/productos');
        revalidateTag('categories');
        
        if (payload.record?.slug) {
          revalidatePath(`/productos/categoria/${payload.record.slug}`);
        }
        
        console.log('[REVALIDATE] Category pages revalidated');
        break;

      case 'subcategorias':
        revalidatePath('/productos');
        revalidateTag('subcategories');
        console.log('[REVALIDATE] Subcategory pages revalidated');
        break;

      case 'config':
        // Revalidar toda la aplicación si cambia la configuración
        revalidatePath('/');
        revalidateTag('config');
        console.log('[REVALIDATE] Config revalidated');
        break;

      case 'banners':
        revalidatePath('/');
        revalidateTag('banners');
        console.log('[REVALIDATE] Banners revalidated');
        break;

      default:
        console.log('[REVALIDATE] Unknown table:', payload.table);
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REVALIDATE] Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// Endpoint para revalidación manual
export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const secret = searchParams.get('secret');
    const path = searchParams.get('path');
    const tag = searchParams.get('tag');

    // Verificar secret para revalidación manual
    if (secret !== process.env.REVALIDATE_SECRET) {
      return NextResponse.json(
        { error: 'Invalid secret' },
        { status: 401 }
      );
    }

    // Revalidar por path
    if (path) {
      revalidatePath(path);
      console.log('[REVALIDATE] Manual path revalidation:', path);
    }

    // Revalidar por tag
    if (tag) {
      revalidateTag(tag);
      console.log('[REVALIDATE] Manual tag revalidation:', tag);
    }

    // Si no se especifica nada, revalidar todo
    if (!path && !tag) {
      revalidatePath('/');
      revalidateTag('products');
      revalidateTag('categories');
      console.log('[REVALIDATE] Full manual revalidation');
    }

    return NextResponse.json({
      success: true,
      revalidated: true,
      path: path || 'all',
      tag: tag || 'all',
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error('[REVALIDATE] Manual revalidation error:', error);
    return NextResponse.json(
      { error: 'Revalidation failed' },
      { status: 500 }
    );
  }
}
