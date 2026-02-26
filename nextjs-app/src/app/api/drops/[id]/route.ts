import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function PUT(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params
    const body = await request.json()
    const { nombre, fecha_lanzamiento, descripcion, imagen_url, activo } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const slug = nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    await db.run(
      `UPDATE drops SET 
        nombre = ?, 
        slug = ?, 
        fecha_lanzamiento = ?, 
        descripcion = ?, 
        imagen_url = ?, 
        activo = ?,
        updated_at = NOW()
       WHERE id = ?`,
      [nombre, slug, fecha_lanzamiento, descripcion, imagen_url, activo, id]
    )

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest, { params }: { params: { id: string } }) {
  try {
    const { id } = params

    // Validar si hay productos asignados
    const assignedProducts = await db.all('SELECT count(*) as count FROM producto_drops WHERE drop_id = ?', [id])
    if (assignedProducts[0].count > 0) {
      return NextResponse.json(
        { error: 'No se puede eliminar el Drop porque tiene productos asignados.' }, 
        { status: 400 }
      )
    }

    await db.run('DELETE FROM drops WHERE id = ?', [id])

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
