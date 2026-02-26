'use client'

import { Star } from 'lucide-react'
import { useEffect, useState } from 'react'

interface Resena {
  id: string
  usuario_nombre: string
  rating: number
  comentario: string
  created_at: string
  producto_id: string
}

export default function Reviews() {
  const [resenas, setResenas] = useState<Resena[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    cargarResenas()
  }, [])

  async function cargarResenas() {
    try {
      const res = await fetch('/api/reviews?limit=6')
      if (!res.ok) throw new Error('Failed to load reviews')
      const data = await res.json()
      setResenas(data || [])
    } catch (error) {
      console.error('Error cargando reseñas:', error)
      setResenas([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <section className="max-w-7xl mx-auto px-4 py-16">
        <h2 className="text-4xl md:text-5xl font-black mb-12 text-center uppercase italic tracking-tighter text-white">Reseñas de Clientes</h2>
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-accent"></div>
        </div>
      </section>
    )
  }

  if (resenas.length === 0) {
    return null
  }

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <h2 className="text-4xl md:text-5xl font-black mb-12 text-center uppercase italic tracking-tighter text-white">Reseñas de Clientes</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {resenas.map((resena) => (
          <div key={resena.id} className="glass-card p-6">
            <div className="flex items-center gap-1 mb-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Star
                  key={i}
                  className={`w-5 h-5 ${
                    i < resena.rating
                      ? 'fill-yellow-400 text-yellow-400'
                      : 'text-white/10'
                  }`}
                />
              ))}
            </div>
            
            <p className="text-white/70 mb-4 text-sm leading-relaxed">{resena.comentario}</p>
            
            <div className="flex items-center justify-between text-sm text-white/45">
              <span className="font-semibold text-white/70">{resena.usuario_nombre}</span>
              <span>{new Date(resena.created_at).toLocaleDateString()}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
