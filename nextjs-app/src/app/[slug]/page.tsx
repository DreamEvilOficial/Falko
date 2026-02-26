import { notFound, redirect } from 'next/navigation'
import db from '@/lib/db'

// Esta página captura rutas dinámicas de primer nivel como /remeras, /liquidacion, etc.
// Verifica si es una categoría o un filtro especial y redirige apropiadamente.

export default async function DynamicRoutePage({ params }: { params: { slug: string } }) {
  const { slug } = params
  const decodedSlug = decodeURIComponent(slug).toLowerCase()

  try {
    // 1. Verificar si es una categoría
    const category = await db.get('SELECT id, slug FROM categorias WHERE slug = ? AND activo = TRUE', [decodedSlug])
    if (category) {
      redirect(`/productos?categoria=${category.slug}`)
    }

    // 2. Verificar si es un filtro especial
    // Los filtros especiales pueden tener clave con o sin slash, ej: "/liquidacion" o "liquidacion"
    const filters = await db.all('SELECT clave, activo FROM filtros_especiales WHERE activo = TRUE')
    const matchedFilter = filters.find((f: any) => {
      const cleanClave = f.clave.replace(/^\/+|\/+$/g, '').toLowerCase()
      return cleanClave === decodedSlug
    })

    if (matchedFilter) {
      const cleanClave = matchedFilter.clave.replace(/^\/+|\/+$/g, '')
      redirect(`/productos?filter=${cleanClave}`)
    }

    // 3. Verificar si es un producto (por slug) - Opcional, pero /productos/[slug] ya maneja esto.
    // Si queremos URLs cortas para productos tipo /nombre-producto, podríamos hacerlo aquí.
    // Por ahora, asumimos que productos viven en /productos/[slug].

  } catch (error) {
    console.error('Error in dynamic route:', error)
  }

  // Si no es nada conocido, 404
  notFound()
}
