'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ChevronDown, ChevronRight } from 'lucide-react'

interface Categoria {
  id: number
  nombre: string
  slug: string
  subcategorias?: Categoria[]
}

export default function CategoryNav() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [expandedCategories, setExpandedCategories] = useState<Set<number>>(new Set())
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarCategorias()
  }, [])

  async function cargarCategorias() {
    try {
      const response = await fetch('/api/categorias')
      const data = await response.json()
      setCategorias(data)
    } catch (error) {
      console.error('Error al cargar categorías:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleCategory = (id: number) => {
    const newExpanded = new Set(expandedCategories)
    if (newExpanded.has(id)) {
      newExpanded.delete(id)
    } else {
      newExpanded.add(id)
    }
    setExpandedCategories(newExpanded)
  }

  if (loading) {
    return (
      <nav className="category-nav glass-card p-4">
        <div className="animate-pulse">
          <div className="h-6 bg-primary/10 rounded mb-3"></div>
          <div className="h-6 bg-primary/10 rounded mb-3"></div>
          <div className="h-6 bg-primary/10 rounded"></div>
        </div>
      </nav>
    )
  }

  return (
    <nav className="category-nav glass-card p-4">
      <h3 className="text-lg font-bold mb-4 text-primary">Categorías</h3>
      <ul className="space-y-2">
        <li>
          <Link 
            href="/productos" 
            className="category-link"
          >
            <span>📦 Todos los Productos</span>
          </Link>
        </li>
        {categorias.map((categoria) => (
          <li key={categoria.id}>
            <div className="flex items-center">
              <Link 
                href={`/productos/${categoria.slug}`}
                className="category-link flex-1"
              >
                <span>{categoria.nombre}</span>
              </Link>
              {categoria.subcategorias && categoria.subcategorias.length > 0 && (
                <button
                  onClick={() => toggleCategory(categoria.id)}
                  className="p-1 hover:bg-primary/10 rounded"
                >
                  {expandedCategories.has(categoria.id) ? (
                    <ChevronDown className="w-4 h-4" />
                  ) : (
                    <ChevronRight className="w-4 h-4" />
                  )}
                </button>
              )}
            </div>
            {categoria.subcategorias && 
             categoria.subcategorias.length > 0 && 
             expandedCategories.has(categoria.id) && (
              <ul className="ml-4 mt-2 space-y-1">
                {categoria.subcategorias.map((sub) => (
                  <li key={sub.id}>
                    <Link
                      href={`/productos/${categoria.slug}/${sub.slug}`}
                      className="category-link text-sm"
                    >
                      <span>→ {sub.nombre}</span>
                    </Link>
                  </li>
                ))}
              </ul>
            )}
          </li>
        ))}
      </ul>
    </nav>
  )
}
