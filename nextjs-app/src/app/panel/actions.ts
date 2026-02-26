'use server';

import { revalidatePath, revalidateTag } from 'next/cache';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { toNumber } from '@/lib/formatters';

export async function createProduct(formData: FormData) {
  try {
    const data = {
      id: uuidv4(),
      nombre: formData.get('nombre') as string,
      slug: formData.get('slug') as string,
      descripcion: formData.get('descripcion') as string,
      precio: toNumber(formData.get('precio') as string),
      precio_original: toNumber(formData.get('precio_original') as string),
      descuento_porcentaje: parseFloat((formData.get('descuento_porcentaje') as string) || '0'),
      stock_actual: parseInt(formData.get('stock_actual') as string),
      stock_minimo: parseInt((formData.get('stock_minimo') as string) || '0'),
      categoria_id: formData.get('categoria_id') as string,
      subcategoria_id: (formData.get('subcategoria_id') as string) || null,
      imagen_url: formData.get('imagen_url') as string,
      imagenes: JSON.parse((formData.get('imagenes') as string) || '[]'),
      variantes: JSON.parse((formData.get('variantes') as string) || '[]'),
      activo: formData.get('activo') === 'true',
      destacado: formData.get('destacado') === 'true',
      top: formData.get('top') === 'true',
      sku: (formData.get('sku') as string) || '',
      peso: parseFloat((formData.get('peso') as string) || '0'),
      dimensiones: JSON.parse((formData.get('dimensiones') as string) || '{}'),
      proveedor_nombre: (formData.get('proveedor_nombre') as string) || '',
      proveedor_contacto: (formData.get('proveedor_contacto') as string) || '',
      precio_costo: toNumber((formData.get('precio_costo') as string) || '0'),
      metadata: JSON.parse((formData.get('metadata') as string) || '{}'),
    };

    await db.run(
      `INSERT INTO productos (
        id, nombre, slug, descripcion, precio, precio_original, descuento_porcentaje,
        stock_actual, stock_minimo, categoria_id, subcategoria_id, imagen_url,
        imagenes, variantes, activo, destacado, top, sku, peso, dimensiones,
        proveedor_nombre, proveedor_contacto, precio_costo, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        data.id,
        data.nombre,
        data.slug,
        data.descripcion,
        data.precio,
        data.precio_original,
        data.descuento_porcentaje,
        data.stock_actual,
        data.stock_minimo,
        data.categoria_id,
        data.subcategoria_id,
        data.imagen_url,
        JSON.stringify(data.imagenes),
        JSON.stringify(data.variantes),
        data.activo ? 1 : 0,
        data.destacado ? 1 : 0,
        data.top ? 1 : 0,
        data.sku,
        data.peso,
        JSON.stringify(data.dimensiones),
        data.proveedor_nombre,
        data.proveedor_contacto,
        data.precio_costo,
        JSON.stringify(data.metadata),
      ]
    );

    revalidatePath('/productos');
    revalidatePath('/');
    revalidateTag('products');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error creating product:', error);
    return { success: false, error: 'Failed to create product' };
  }
}

export async function updateProduct(id: string, formData: FormData) {
  try {
    const data = {
      nombre: formData.get('nombre') as string,
      slug: formData.get('slug') as string,
      descripcion: formData.get('descripcion') as string,
      precio: toNumber(formData.get('precio') as string),
      precio_original: toNumber(formData.get('precio_original') as string),
      descuento_porcentaje: parseFloat((formData.get('descuento_porcentaje') as string) || '0'),
      stock_actual: parseInt(formData.get('stock_actual') as string),
      stock_minimo: parseInt((formData.get('stock_minimo') as string) || '0'),
      categoria_id: formData.get('categoria_id') as string,
      subcategoria_id: (formData.get('subcategoria_id') as string) || null,
      imagen_url: formData.get('imagen_url') as string,
      imagenes: JSON.parse((formData.get('imagenes') as string) || '[]'),
      variantes: JSON.parse((formData.get('variantes') as string) || '[]'),
      activo: formData.get('activo') === 'true',
      destacado: formData.get('destacado') === 'true',
      top: formData.get('top') === 'true',
      sku: (formData.get('sku') as string) || '',
      peso: parseFloat((formData.get('peso') as string) || '0'),
      dimensiones: JSON.parse((formData.get('dimensiones') as string) || '{}'),
      proveedor_nombre: (formData.get('proveedor_nombre') as string) || '',
      proveedor_contacto: (formData.get('proveedor_contacto') as string) || '',
      precio_costo: toNumber((formData.get('precio_costo') as string) || '0'),
      metadata: JSON.parse((formData.get('metadata') as string) || '{}'),
    };

    await db.run(
      `UPDATE productos SET
        nombre = ?, slug = ?, descripcion = ?, precio = ?, precio_original = ?,
        descuento_porcentaje = ?, stock_actual = ?, stock_minimo = ?,
        categoria_id = ?, subcategoria_id = ?, imagen_url = ?, imagenes = ?,
        variantes = ?, activo = ?, destacado = ?, top = ?, sku = ?, peso = ?,
        dimensiones = ?, proveedor_nombre = ?, proveedor_contacto = ?,
        precio_costo = ?, metadata = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?`,
      [
        data.nombre,
        data.slug,
        data.descripcion,
        data.precio,
        data.precio_original,
        data.descuento_porcentaje,
        data.stock_actual,
        data.stock_minimo,
        data.categoria_id,
        data.subcategoria_id,
        data.imagen_url,
        JSON.stringify(data.imagenes),
        JSON.stringify(data.variantes),
        data.activo ? 1 : 0,
        data.destacado ? 1 : 0,
        data.top ? 1 : 0,
        data.sku,
        data.peso,
        JSON.stringify(data.dimensiones),
        data.proveedor_nombre,
        data.proveedor_contacto,
        data.precio_costo,
        JSON.stringify(data.metadata),
        id,
      ]
    );

    revalidatePath('/productos');
    revalidatePath(`/productos/${data.slug}`);
    revalidatePath('/');
    revalidateTag('products');

    return { success: true };
  } catch (error) {
    console.error('Error updating product:', error);
    return { success: false, error: 'Failed to update product' };
  }
}

export async function deleteProduct(id: string) {
  try {
    const product: any = await db.get('SELECT slug FROM productos WHERE id = ?', [id]);
    
    await db.run('DELETE FROM productos WHERE id = ?', [id]);

    // Revalidar automáticamente
    revalidatePath('/productos');
    if (product?.slug) {
      revalidatePath(`/productos/${product.slug}`);
    }
    revalidatePath('/');
    revalidateTag('products');

    return { success: true };
  } catch (error) {
    console.error('Error deleting product:', error);
    return { success: false, error: 'Failed to delete product' };
  }
}

export async function toggleProductStatus(id: string, field: 'activo' | 'destacado' | 'top') {
  try {
    const product: any = await db.get(`SELECT ${field}, slug FROM productos WHERE id = ?`, [id]);
    const newValue = product[field] ? 0 : 1;

    await db.run(
      `UPDATE productos SET ${field} = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [newValue, id]
    );

    // Revalidar automáticamente
    revalidatePath('/productos');
    if (product?.slug) {
      revalidatePath(`/productos/${product.slug}`);
    }
    revalidatePath('/');
    revalidateTag('products');

    return { success: true, newValue: newValue === 1 };
  } catch (error) {
    console.error('Error toggling product status:', error);
    return { success: false, error: 'Failed to toggle status' };
  }
}

// ===== CATEGORÍAS =====

export async function createCategory(formData: FormData) {
  try {
    const data = {
      id: uuidv4(),
      nombre: formData.get('nombre') as string,
      slug: formData.get('slug') as string,
      descripcion: formData.get('descripcion') as string || '',
      icono: formData.get('icono') as string || '',
      orden: parseInt(formData.get('orden') as string || '0'),
      activa: formData.get('activa') === 'true',
    };

    await db.run(
      'INSERT INTO categorias (id, nombre, slug, descripcion, icono, orden, activa) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [data.id, data.nombre, data.slug, data.descripcion, data.icono, data.orden, data.activa ? 1 : 0]
    );

    // Revalidar automáticamente
    revalidatePath('/productos');
    revalidateTag('categories');

    return { success: true, id: data.id };
  } catch (error) {
    console.error('Error creating category:', error);
    return { success: false, error: 'Failed to create category' };
  }
}

export async function updateCategory(id: string, formData: FormData) {
  try {
    const data = {
      nombre: formData.get('nombre') as string,
      slug: formData.get('slug') as string,
      descripcion: formData.get('descripcion') as string || '',
      icono: formData.get('icono') as string || '',
      orden: parseInt(formData.get('orden') as string || '0'),
      activa: formData.get('activa') === 'true',
    };

    await db.run(
      `UPDATE categorias SET nombre = ?, slug = ?, descripcion = ?, icono = ?, orden = ?, activa = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
      [data.nombre, data.slug, data.descripcion, data.icono, data.orden, data.activa ? 1 : 0, id]
    );

    // Revalidar automáticamente
    revalidatePath('/productos');
    revalidatePath(`/productos/categoria/${data.slug}`);
    revalidateTag('categories');

    return { success: true };
  } catch (error) {
    console.error('Error updating category:', error);
    return { success: false, error: 'Failed to update category' };
  }
}

export async function deleteCategory(id: string) {
  try {
    const category: any = await db.get('SELECT slug FROM categorias WHERE id = ?', [id]);
    
    await db.run('DELETE FROM categorias WHERE id = ?', [id]);

    // Revalidar automáticamente
    revalidatePath('/productos');
    if (category?.slug) {
      revalidatePath(`/productos/categoria/${category.slug}`);
    }
    revalidateTag('categories');

    return { success: true };
  } catch (error) {
    console.error('Error deleting category:', error);
    return { success: false, error: 'Failed to delete category' };
  }
}

// ===== UTILIDADES =====

export async function bulkUpdateProducts(productIds: string[], updates: Record<string, any>) {
  try {
    const setClause = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(', ');
    const values = Object.values(updates);

    for (const id of productIds) {
      await db.run(
        `UPDATE productos SET ${setClause}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...values, id]
      );
    }

    // Revalidar todo
    revalidatePath('/productos');
    revalidatePath('/');
    revalidateTag('products');

    return { success: true, updated: productIds.length };
  } catch (error) {
    console.error('Error bulk updating products:', error);
    return { success: false, error: 'Failed to bulk update' };
  }
}
