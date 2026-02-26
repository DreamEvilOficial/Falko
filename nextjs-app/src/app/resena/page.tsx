'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { Star } from 'lucide-react'
import toast from 'react-hot-toast'

function ResenaContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const ordenId = searchParams.get('orden')
  
  const [loading, setLoading] = useState(false)
  const [orden, setOrden] = useState<any>(null)
  const [formData, setFormData] = useState({
    nombre: '',
    rating: 5,
    comentario: ''
  })

  useEffect(() => {
    if (ordenId) {
      cargarOrden()
    }
  }, [ordenId])

  async function cargarOrden() {
    try {
      const { data, error } = await supabase
        .from('ordenes')
        .select('*, orden_items(producto_id, cantidad)')
        .eq('id', ordenId)
        .single()
      
      if (error) throw error
      setOrden(data)
      setFormData({ ...formData, nombre: data.cliente_nombre })
    } catch (error) {
      console.error('Error cargando orden:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    try {
      // Crear reseña para cada producto de la orden
      const items = orden.orden_items || []
      
      for (const item of items) {
        await supabase.from('resenas').insert({
          orden_id: ordenId,
          producto_id: item.producto_id,
          usuario_nombre: formData.nombre,
          usuario_email: orden.cliente_email,
          rating: formData.rating,
          comentario: formData.comentario,
          verificada: true,
          activa: true
        })
      }

      toast.success('¡Gracias por tu reseña!')
      router.push('/')
    } catch (error) {
      console.error('Error guardando reseña:', error)
      toast.error('Error al guardar la reseña')
    } finally {
      setLoading(false)
    }
  }

  if (!ordenId) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-16 text-center">
        <h1 className="text-3xl font-bold mb-4">Orden no encontrada</h1>
        <button
          onClick={() => router.push('/')}
          className="bg-black text-white px-6 py-3 rounded-full hover:bg-gray-800 transition"
        >
          Volver a la tienda
        </button>
      </div>
    )
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-16">
      <h1 className="text-4xl font-bold mb-8">Deja tu Reseña</h1>
      
      <div className="glass-card p-8">
        <p className="text-gray-600 mb-6">
          ¡Gracias por tu compra! Nos encantaría conocer tu opinión.
        </p>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-medium mb-2">Tu Nombre</label>
            <input
              type="text"
              required
              value={formData.nombre}
              onChange={(e) => setFormData({ ...formData, nombre: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
            />
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Calificación</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((rating) => (
                <button
                  key={rating}
                  type="button"
                  onClick={() => setFormData({ ...formData, rating })}
                  className="focus:outline-none"
                >
                  <Star
                    className={`w-8 h-8 ${
                      rating <= formData.rating
                        ? 'fill-yellow-400 text-yellow-400'
                        : 'text-gray-300'
                    }`}
                  />
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Comentario</label>
            <textarea
              required
              value={formData.comentario}
              onChange={(e) => setFormData({ ...formData, comentario: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
              rows={4}
              placeholder="Cuéntanos sobre tu experiencia con el producto..."
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-black text-white py-3 rounded-full font-semibold hover:bg-gray-800 transition disabled:opacity-50"
          >
            {loading ? 'Enviando...' : 'Publicar Reseña'}
          </button>
        </form>
      </div>
    </div>
  )
}

export default function ResenaPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div></div>}>
      <ResenaContent />
    </Suspense>
  )
}
