"use client"

import { useEffect, useState, useCallback, useRef } from 'react'
import { Star, MessageSquare, CheckCircle2, ShoppingBag, Send, UserCircle2, X } from 'lucide-react'
import toast from 'react-hot-toast'
import { createPortal } from 'react-dom'

interface Review {
  id: string
  usuario_nombre: string
  comentario: string
  rating: number
  created_at: string
}

export default function ProductReviews({ productId, productName }: { productId: string, productName: string }) {
  const [reviews, setReviews] = useState<Review[]>([])
  const [avg, setAvg] = useState<number>(0)
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // form state
  const [orderNumber, setOrderNumber] = useState("")
  const [name, setName] = useState("")
  const [comment, setComment] = useState("")
  const [rating, setRating] = useState(0)
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)

  const fetchReviews = useCallback(async () => {
    try {
      const res = await fetch(`/api/reviews/list?producto=${encodeURIComponent(productId)}`)
      if (!res.ok) throw new Error('No se pudieron cargar reseñas')
      const data = await res.json()
      setReviews(data.reviews || [])
      setAvg(data.average || 0)
    } catch (e) {
      // silencioso
    } finally {
      setLoading(false)
    }
  }, [productId])

  useEffect(() => {
    fetchReviews()
  }, [productId, fetchReviews])

  async function submitReview(e: React.FormEvent) {
    e.preventDefault()
    if (!orderNumber.trim()) return toast.error('Ingresá tu número de orden')
    if (rating < 1) return toast.error('Elegí una puntuación')
    if (!comment.trim()) return toast.error('Escribí un comentario')
    if (comment.length < 20) return toast.error('El comentario debe tener al menos 20 caracteres')
    
    setSubmitting(true)
    const toastId = toast.loading('Verificando orden y enviando reseña...')

    try {
      const res = await fetch('/api/reviews/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          productoId: productId, 
          numeroOrden: orderNumber.trim(), 
          nombre: name.trim() || 'Cliente Anónimo', 
          comentario: comment.trim(), 
          rating
        })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Falla al validar orden')
      
      toast.success('¡Experiencia compartida con éxito!', { id: toastId })
      setOrderNumber("")
      setName("")
      setComment("")
      setRating(0)
      setShowModal(false)
      await fetchReviews()
    } catch (e: any) {
      console.error(e)
      toast.error(e.message || 'Error al enviar reseña', { id: toastId })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <section className="space-y-12">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-white/5 pb-8">
        <div>
          <h3 className="text-3xl font-black tracking-tighter uppercase italic flex items-center gap-3">
             <MessageSquare className="w-6 h-6 text-accent3" />
             Experiencias <span className="text-white/50">Urban Indumentaria</span>
          </h3>
          <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.3em] mt-2">La voz de nuestra comunidad</p>
        </div>
        
        <div className="flex flex-col md:flex-row gap-4 items-center">
            <button 
                onClick={() => setShowModal(true)}
                className="bg-accent3 text-black px-6 py-3 rounded-xl font-black text-xs uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2"
            >
                <MessageSquare className="w-4 h-4" /> Dejar Reseña
            </button>
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/5 p-4 rounded-3xl flex items-center gap-6">
                <div className="text-center">
                    <p className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">PROMEDIO</p>
                    <p className="text-2xl font-black">{avg > 0 ? avg.toFixed(1) : '—'}</p>
                </div>
                <div className="w-[1px] h-8 bg-white/5" />
                <div className="flex items-center gap-1.5">
                    {[1,2,3,4,5].map(i => (
                        <Star key={i} className={`w-4 h-4 ${i <= Math.round(avg) ? 'fill-yellow-500 text-yellow-500' : 'text-white/5'}`} />
                    ))}
                </div>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-10">
        {/* Listado de reseñas */}
        <div className="space-y-6">
          {loading ? (
            <div className="flex justify-center py-20 opacity-20"><div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
          ) : reviews.length === 0 ? (
            <div className="bg-white/[0.02] border border-dashed border-white/5 rounded-[40px] p-12 text-center">
               <ShoppingBag className="w-10 h-10 text-white/20 mx-auto mb-4" />
               <p className="text-[10px] font-black text-white/40 uppercase tracking-widest leading-relaxed">
                 Aún no hay reseñas para este producto.<br/>Sé el primero en compartir tu experiencia tras tu compra.
               </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {reviews.map(r => (
                <div key={r.id} className="group bg-white/[0.03] hover:bg-white/[0.05] border border-white/5 p-6 rounded-[35px] transition-all duration-500">
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex items-center gap-3">
                       <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/5 group-hover:border-pink-500/20 transition-colors">
                          <UserCircle2 className="w-5 h-5 text-gray-500 group-hover:text-pink-500 transition-colors" />
                       </div>
                       <div>
                          <p className="text-[10px] font-black uppercase tracking-widest">{r.usuario_nombre}</p>
                          <p className="text-[8px] font-black text-gray-600 uppercase tracking-tighter">{new Date(r.created_at).toLocaleDateString()}</p>
                       </div>
                    </div>
                    <div className="flex items-center gap-0.5">
                       {[1,2,3,4,5].map(i => (
                         <Star key={i} className={`w-3 h-3 ${i <= r.rating ? 'fill-yellow-500 text-yellow-500' : 'text-white/5'}`} />
                       ))}
                    </div>
                  </div>
                  <p className="text-gray-400 text-xs font-medium leading-relaxed italic pr-4">&ldquo;{r.comentario}&rdquo;</p>
                  <div className="mt-4 flex items-center gap-2 opacity-30">
                     <CheckCircle2 className="w-3 h-3 text-green-500" />
                     <span className="text-[8px] font-black uppercase tracking-widest text-green-500">Compra Verificada</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Modal Form */}
      {showModal && typeof document !== 'undefined' && createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowModal(false)} />
            <div className="relative bg-[#06070c] border border-white/10 w-full max-w-lg rounded-[30px] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
                <div className="p-8">
                    <div className="flex justify-between items-start mb-6">
                        <div>
                            <h4 className="text-xs font-black text-white/45 uppercase tracking-[0.3em] mb-2">Compartí tu compra</h4>
                            <p className="text-xl font-black tracking-tight uppercase leading-snug">¿Qué te pareció tu <span className="text-accent3">{productName}</span>?</p>
                        </div>
                        <button onClick={() => setShowModal(false)} className="p-2 hover:bg-white/5 rounded-full transition-colors"><X className="w-5 h-5" /></button>
                    </div>

                    <form onSubmit={submitReview} className="space-y-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <input 
                                    required type="text" placeholder="Nº DE ORDEN" value={orderNumber} 
                                    onChange={e => setOrderNumber(e.target.value.toUpperCase())}
                                    className="w-full bg-white/[0.04] border border-white/10 p-4 rounded-2xl outline-none focus:border-accent3/40 text-xs font-black uppercase transition-all placeholder:text-white/25" 
                                />
                            </div>
                            <input 
                                type="text" placeholder="TU NOMBRE (OPCIONAL)" value={name} 
                                onChange={e => setName(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 p-4 rounded-2xl outline-none focus:border-accent3/40 text-xs font-black uppercase transition-all placeholder:text-white/25" 
                            />
                        </div>

                        <div className="space-y-2">
                            <textarea 
                                required placeholder="TU COMENTARIO (MÍN 20 CARACTERES)" value={comment} maxLength={200} 
                                onChange={e => setComment(e.target.value)}
                                className="w-full bg-white/[0.04] border border-white/10 p-4 rounded-2xl outline-none focus:border-accent3/40 text-xs font-medium min-h-[100px] resize-none transition-all placeholder:text-white/25" 
                            />
                            <div className="flex justify-between px-2">
                                <span className="text-[8px] font-black text-white/35 uppercase tracking-widest">Sincero y breve</span>
                                <span className={`text-[8px] font-black ${comment.length < 20 ? 'text-red-500' : 'text-green-500'}`}>{comment.length}/200</span>
                            </div>
                        </div>

                        <div className="py-4 border-t border-white/10">
                            <p className="text-[10px] font-black text-white/45 uppercase tracking-widest mb-4 text-center">Calificá con estrellas</p>
                            <div className="flex justify-center gap-2">
                                {[1,2,3,4,5].map(s => (
                                    <button 
                                        type="button" key={s} 
                                        onMouseEnter={() => setHoverRating(s)} 
                                        onMouseLeave={() => setHoverRating(0)} 
                                        onClick={() => setRating(s)}
                                        className="transform hover:scale-125 transition-transform"
                                    >
                                        <Star className={`w-8 h-8 ${s <= (hoverRating || rating) ? 'fill-yellow-500 text-yellow-500' : 'text-white/10'}`} />
                                    </button>
                                ))}
                            </div>
                        </div>

                        <button 
                            disabled={submitting}
                            type="submit"
                            className="w-full bg-accent3 text-black py-4 rounded-2xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-110 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex justify-center items-center gap-2"
                        >
                            {submitting ? <div className="w-4 h-4 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <><Send className="w-4 h-4" /> Publicar Reseña</>}
                        </button>
                    </form>
                </div>
            </div>
        </div>,
        document.body
      )}
    </section>
  )
}
