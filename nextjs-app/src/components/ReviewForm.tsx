'use client'

import { useState } from 'react'
import { Star } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'

interface ReviewFormProps {
  productId: string
  productName: string
  orderId?: string
  onSubmitted: () => void
}

export default function ReviewForm({ productId, productName, orderId, onSubmitted }: ReviewFormProps) {
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [comment, setComment] = useState('')
  const [name, setName] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (rating === 0) {
      toast.error('Por favor selecciona una calificación')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          productoId: productId,
          numeroOrden: orderId || '',
          nombre: name || 'Anónimo',
          comentario: comment,
          rating
        })
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data?.error || 'Error al enviar reseña')
      }

      toast.success('¡Gracias por tu reseña!')
      onSubmitted()
    } catch (error: any) {
      console.error('Error submitting review:', error)
      toast.error('Error al enviar reseña')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 rounded-3xl p-6 text-white">
      <h3 className="text-sm font-black uppercase tracking-widest text-white mb-2">Califica: {productName}</h3>
      <p className="text-white/60 text-xs mb-4">¿Qué te pareció este producto?</p>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Estrellas */}
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
              onClick={() => setRating(star)}
              className="focus:outline-none transition-transform hover:scale-110"
            >
              <Star
                className={`w-8 h-8 ${
                  star <= (hoverRating || rating)
                    ? 'fill-yellow-400 text-yellow-400'
                    : 'text-white/15'
                }`}
              />
            </button>
          ))}
        </div>

        {/* Nombre (Opcional) */}
        <input
          type="text"
          placeholder="Tu nombre (opcional)"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-white focus:border-accent3/40 focus:outline-none transition placeholder:text-white/25"
        />

        {/* Comentario */}
        <textarea
          placeholder="Escribe tu opinión..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          rows={3}
          className="w-full bg-white/[0.04] border border-white/10 rounded-2xl p-3 text-white focus:border-accent3/40 focus:outline-none transition placeholder:text-white/25"
        />

        <button
          type="submit"
          disabled={submitting}
          className="w-full bg-accent text-ink font-black py-3 rounded-2xl hover:brightness-95 transition disabled:opacity-50 text-[10px] uppercase tracking-[0.25em]"
        >
          {submitting ? 'Enviando...' : 'Enviar Reseña'}
        </button>
      </form>
    </div>
  )
}
