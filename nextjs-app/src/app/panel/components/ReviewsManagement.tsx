'use client'

import { useState, useEffect } from 'react'
import { 
  Star, 
  Trash2, 
  CheckCircle, 
  XCircle, 
  MessageSquare, 
  User, 
  Calendar,
  Filter,
  RefreshCw
} from 'lucide-react'
import toast from 'react-hot-toast'

interface Review {
  id: string
  usuario_nombre: string
  rating: number
  comentario: string
  created_at: string
  aprobado: boolean
  producto_id?: string
  producto_nombre?: string
}

export default function ReviewsManagement() {
  const [reviews, setReviews] = useState<Review[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved'>('all')
  const [stats, setStats] = useState({ total: 0, avg: 0, pending: 0 })

  useEffect(() => {
    fetchReviews()
  }, [])

  async function fetchReviews() {
    setLoading(true)
    try {
      const res = await fetch('/api/reviews?limit=all&approved=false')
      if (!res.ok) throw new Error('Error al cargar reseñas')
      
      const data = await res.json()
      const reviewsData = Array.isArray(data) ? data : []
      
      setReviews(reviewsData)
      calculateStats(reviewsData)
    } catch (error) {
      console.error('Error fetching reviews:', error)
      toast.error('Error al cargar reseñas')
      setReviews([])
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(data: Review[]) {
    const total = data.length
    const sum = data.reduce((acc, r) => acc + (Number(r.rating) || 0), 0)
    const avg = total > 0 ? (sum / total).toFixed(1) : '0.0'
    const pending = data.filter(r => !r.aprobado).length
    
    setStats({ 
      total, 
      avg: Number(avg), 
      pending 
    })
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de que deseas eliminar esta reseña permanentemente?')) return

    try {
      const res = await fetch(`/api/reviews?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      
      const newReviews = reviews.filter(r => r.id !== id)
      setReviews(newReviews)
      calculateStats(newReviews)
      toast.success('Reseña eliminada correctamente')
    } catch (error) {
      console.error('Error deleting review:', error)
      toast.error('Error al eliminar la reseña')
    }
  }

  async function toggleApproval(id: string, currentStatus: boolean) {
    const newStatus = !currentStatus
    try {
      const res = await fetch('/api/reviews', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, aprobado: newStatus })
      })
      
      if (!res.ok) throw new Error('Error al actualizar estado')
      
      const newReviews = reviews.map(r => 
        r.id === id ? { ...r, aprobado: newStatus } : r
      )
      
      setReviews(newReviews)
      calculateStats(newReviews)
      toast.success(newStatus ? 'Reseña aprobada y publicada' : 'Reseña ocultada (pendiente)')
    } catch (error) {
      console.error('Error updating review:', error)
      toast.error('Error al actualizar el estado')
    }
  }

  const filteredReviews = reviews.filter(r => {
    if (filter === 'pending') return !r.aprobado
    if (filter === 'approved') return r.aprobado
    return true
  })

  if (loading && reviews.length === 0) {
    return (
      <div className="flex flex-col justify-center items-center h-64 space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20 border-t-accent"></div>
        <p className="text-white/50 text-sm animate-pulse">Cargando reseñas...</p>
      </div>
    )
  }

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-20">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-3 bg-accent/10 rounded-xl">
              <MessageSquare className="w-6 h-6 text-accent" />
            </div>
            <h1 className="text-2xl font-black uppercase text-white tracking-widest">
              Gestión de Reseñas
            </h1>
          </div>
          <p className="text-sm text-white/50 font-medium pl-1">
            Administra las opiniones y valoraciones de tus clientes
          </p>
        </div>

        <button 
          onClick={fetchReviews}
          className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-white rounded-lg transition-colors border border-white/10 text-sm font-medium"
        >
          <RefreshCw className="w-4 h-4" />
          Actualizar
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <MessageSquare className="w-16 h-16 text-white" />
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Total Reseñas</p>
          <p className="text-3xl font-black text-white">{stats.total}</p>
        </div>
        
        <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <Star className="w-16 h-16 text-yellow-500" />
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Promedio</p>
          <div className="flex items-center gap-3">
            <p className="text-3xl font-black text-white">{stats.avg}</p>
            <div className="flex text-yellow-500">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star 
                  key={star} 
                  className={`w-4 h-4 ${star <= Math.round(stats.avg) ? 'fill-current' : 'text-white/20'}`} 
                />
              ))}
            </div>
          </div>
        </div>

        <div className="bg-[#1a1a1a] border border-white/5 p-5 rounded-2xl relative overflow-hidden group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <CheckCircle className="w-16 h-16 text-accent" />
          </div>
          <p className="text-xs text-white/40 uppercase tracking-widest font-bold mb-1">Pendientes</p>
          <p className={`text-3xl font-black ${stats.pending > 0 ? 'text-accent' : 'text-white'}`}>
            {stats.pending}
          </p>
        </div>
      </div>

      {/* Filters & Content */}
      <div className="bg-[#1a1a1a] border border-white/5 rounded-2xl overflow-hidden">
        {/* Toolbar */}
        <div className="p-4 border-b border-white/5 flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 bg-black/20 p-1 rounded-lg border border-white/5">
            <button
              onClick={() => setFilter('all')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'all' 
                  ? 'bg-white/10 text-white shadow-sm' 
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Todas
            </button>
            <button
              onClick={() => setFilter('pending')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all flex items-center gap-2 ${
                filter === 'pending'
                  ? 'bg-accent/20 text-accent shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Pendientes
              {stats.pending > 0 && (
                <span className="bg-accent text-black text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                  {stats.pending}
                </span>
              )}
            </button>
            <button
              onClick={() => setFilter('approved')}
              className={`px-4 py-1.5 rounded-md text-sm font-medium transition-all ${
                filter === 'approved'
                  ? 'bg-green-500/20 text-green-400 shadow-sm'
                  : 'text-white/40 hover:text-white hover:bg-white/5'
              }`}
            >
              Publicadas
            </button>
          </div>
        </div>

        {/* Reviews List */}
        <div className="divide-y divide-white/5">
          {filteredReviews.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                <MessageSquare className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-white/40 font-medium">No hay reseñas para mostrar</p>
            </div>
          ) : (
            filteredReviews.map((review) => (
              <div key={review.id} className="p-6 hover:bg-white/[0.02] transition-colors group">
                <div className="flex flex-col md:flex-row gap-6">
                  {/* User Info & Rating */}
                  <div className="w-full md:w-48 flex-shrink-0">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-white/10 to-white/5 flex items-center justify-center border border-white/10">
                        <User className="w-5 h-5 text-white/70" />
                      </div>
                      <div>
                        <p className="font-bold text-white text-sm truncate">{review.usuario_nombre}</p>
                        <p className="text-xs text-white/40 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {new Date(review.created_at).toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex text-yellow-500 mb-2">
                      {[1, 2, 3, 4, 5].map((star) => (
                        <Star 
                          key={star} 
                          className={`w-4 h-4 ${star <= review.rating ? 'fill-current' : 'text-white/20'}`} 
                        />
                      ))}
                    </div>

                    <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                      review.aprobado 
                        ? 'bg-green-500/10 text-green-400 border-green-500/20' 
                        : 'bg-accent/10 text-accent border-accent/20'
                    }`}>
                      {review.aprobado ? (
                        <>
                          <CheckCircle className="w-3 h-3" /> Publicada
                        </>
                      ) : (
                        <>
                          <Filter className="w-3 h-3" /> Pendiente
                        </>
                      )}
                    </div>
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5 mb-4 relative">
                      <MessageSquare className="absolute top-4 left-4 w-4 h-4 text-white/10" />
                      <p className="text-white/80 text-sm leading-relaxed pl-6">
                        {review.comentario}
                      </p>
                    </div>
                    
                    {review.producto_nombre && (
                      <p className="text-xs text-white/40 mb-4">
                        Producto: <span className="text-white/60">{review.producto_nombre}</span>
                      </p>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-3 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => toggleApproval(review.id, review.aprobado)}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors ${
                          review.aprobado
                            ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20'
                            : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'
                        }`}
                      >
                        {review.aprobado ? (
                          <>
                            <XCircle className="w-4 h-4" /> Ocultar
                          </>
                        ) : (
                          <>
                            <CheckCircle className="w-4 h-4" /> Aprobar
                          </>
                        )}
                      </button>

                      <button
                        onClick={() => handleDelete(review.id)}
                        className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider bg-white/5 text-white/60 hover:text-red-400 hover:bg-red-500/10 transition-colors ml-auto"
                      >
                        <Trash2 className="w-4 h-4" /> Eliminar
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}
