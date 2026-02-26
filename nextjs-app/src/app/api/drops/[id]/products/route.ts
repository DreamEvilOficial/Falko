import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    const rows = await db.all(
      `SELECT 
         p.id,
         p.nombre,
         p.slug,
         p.sku,
         p.imagen_url,
         p.imagenes,
         p.precio,
         p.activo
       FROM producto_drops pd
       JOIN productos p ON p.id = pd.producto_id
       WHERE pd.drop_id = ?
       ORDER BY p.nombre ASC`,
      [id]
    )

    const products = rows.map((p: any) => ({
      ...p,
      imagenes: p.imagenes
        ? typeof p.imagenes === 'string'
          ? (() => {
              try {
                return JSON.parse(p.imagenes)
              } catch {
                return []
              }
            })()
          : p.imagenes
        : [],
    }))

    return NextResponse.json(products)
  } catch (error: any) {
    console.error('Error fetching products for drop:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const productIds = Array.isArray(body.productIds)
      ? body.productIds.filter((v: any) => typeof v === 'string' && v.trim().length > 0)
      : []

    await db.transaction(async (tx: any) => {
      await db.run('DELETE FROM producto_drops WHERE drop_id = ?', [id], tx)

      if (productIds.length === 0) {
        return
      }

      for (const productId of productIds) {
        await db.run(
          `INSERT INTO producto_drops (producto_id, drop_id)
           VALUES (?, ?)
           ON CONFLICT (producto_id, drop_id) DO NOTHING`,
          [productId, id],
          tx
        )
      }
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Error updating products for drop:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

