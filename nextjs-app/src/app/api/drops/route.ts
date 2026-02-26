import { NextRequest, NextResponse } from 'next/server'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const drops = await db.all('SELECT * FROM drops ORDER BY fecha_lanzamiento DESC')
    return NextResponse.json(drops)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { nombre, fecha_lanzamiento, descripcion, imagen_url } = body

    if (!nombre) {
      return NextResponse.json({ error: 'El nombre es obligatorio' }, { status: 400 })
    }

    const slug = nombre.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '')

    const result = await db.run(
      'INSERT INTO drops (nombre, slug, fecha_lanzamiento, descripcion, imagen_url) VALUES (?, ?, ?, ?, ?)',
      [nombre, slug, fecha_lanzamiento, descripcion, imagen_url]
    )

    return NextResponse.json({ success: true, id: result.id })
  } catch (error: any) {
    console.error('Error creating drop:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
