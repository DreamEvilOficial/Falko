'use client'

import { useEffect, useState } from 'react'
import { Search, Package, Truck, CheckCircle, Clock, XCircle, AlertCircle, Mail } from 'lucide-react'
import toast from 'react-hot-toast'
import Link from 'next/link'
import { formatPrice } from '@/lib/formatters'

export default function OrderTrackingPage() {
  const [orderId, setOrderId] = useState('')
  const [loading, setLoading] = useState(false)
  const [order, setOrder] = useState<any>(null)
  const [error, setError] = useState('')
  const [notifyEmail, setNotifyEmail] = useState('')
  const [subscribing, setSubscribing] = useState(false)

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault()
    const value = orderId.trim().toUpperCase()
    if (!value) return
    if (!/^[A-Z0-9\-]+$/.test(value)) {
      toast.error('El formato del número de orden o seguimiento es inválido')
      return
    }

    setLoading(true)
    setError('')
    setOrder(null)

    try {
      const res = await fetch(`/api/orders/track?id=${encodeURIComponent(value)}`)
      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'No se encontró el pedido')
      }

      setOrder(data)
    } catch (err: any) {
      setError(err.message)
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  const getStatusInfo = (status: string) => {
    switch ((status || '').toLowerCase()) {
      case 'pendiente':
        return { icon: <Clock className="w-8 h-8" />, color: 'text-yellow-500', bg: 'bg-yellow-500/10', label: 'Pendiente de Pago' }
      case 'procesando':
        return { icon: <Package className="w-8 h-8" />, color: 'text-blue-500', bg: 'bg-blue-500/10', label: 'Procesando Pedido' }
      case 'enviado':
        return { icon: <Truck className="w-8 h-8" />, color: 'text-purple-500', bg: 'bg-purple-500/10', label: 'Enviado' }
      case 'completado':
      case 'entregado':
        return { icon: <CheckCircle className="w-8 h-8" />, color: 'text-green-500', bg: 'bg-green-500/10', label: 'Entregado' }
      case 'cancelado':
        return { icon: <XCircle className="w-8 h-8" />, color: 'text-red-500', bg: 'bg-red-500/10', label: 'Cancelado' }
      default:
        return { icon: <AlertCircle className="w-8 h-8" />, color: 'text-gray-500', bg: 'bg-gray-500/10', label: status }
    }
  }

  useEffect(() => {
    if (!order || !order.numero_orden) return
    const interval = setInterval(async () => {
      try {
        const res = await fetch(`/api/orders/track?id=${encodeURIComponent(order.numero_orden)}`)
        const data = await res.json()
        if (res.ok) {
          setOrder(data)
        }
      } catch (err) {}
    }, 4 * 60 * 60 * 1000)
    return () => clearInterval(interval)
  }, [order?.numero_orden])

  const handleSubscribe = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!order) return
    const email = notifyEmail.trim()
    if (!email) {
      toast.error('Ingresá un email para recibir notificaciones')
      return
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast.error('Formato de email inválido')
      return
    }

    setSubscribing(true)
    try {
      const res = await fetch('/api/orders/subscribe', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId: order.id || order.numero_orden, email })
      })
      const data = await res.json()
      if (!res.ok) {
        throw new Error(data.error || 'Error al registrar notificaciones')
      }
      toast.success('Te avisaremos por email ante cambios de estado')
    } catch (err: any) {
      toast.error(err.message || 'Error al registrar notificaciones')
    } finally {
      setSubscribing(false)
    }
  }

  return (
    <div className="min-h-screen bg-[#000000FA] text-white pt-24 pb-12 px-4">
      <div className="max-w-xl mx-auto space-y-8">
        <div className="text-center space-y-4">
          <h1 className="text-3xl md:text-4xl font-black uppercase italic tracking-tighter">
            Seguimiento de Pedido
          </h1>
          <p className="text-white/50 text-sm">
            Ingresá tu número de orden o código de seguimiento para ver el estado actual
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative">
          <input
            type="text"
            placeholder="Ej: ORDEN-12345 o CPXXXXXXXXAR"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value.toUpperCase())}
            className="w-full bg-white/5 border border-white/10 p-5 rounded-2xl outline-none focus:border-accent/50 text-center font-black text-xl uppercase tracking-widest transition-all placeholder:text-white/20"
          />
          <button
            type="submit"
            disabled={loading || !orderId}
            className="absolute right-2 top-2 bottom-2 bg-white text-black px-6 rounded-xl font-bold uppercase tracking-wider hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? <div className="w-5 h-5 border-2 border-black/20 border-t-black rounded-full animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>

        {error && (
          <div className="bg-red-500/10 border border-red-500/20 p-6 rounded-2xl text-center">
            <p className="text-red-500 font-bold">{error}</p>
          </div>
        )}

        {order && (
          <div className="bg-[#0a0a0a] border border-white/10 rounded-3xl overflow-hidden animate-in slide-in-from-bottom-4 duration-500">
            <div className="p-8 space-y-8">
              <div className="text-center space-y-4">
                <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center ${getStatusInfo(order.estado).bg} ${getStatusInfo(order.estado).color}`}>
                  {getStatusInfo(order.estado).icon}
                </div>
                <div>
                  <h2 className={`text-2xl font-black uppercase tracking-wide ${getStatusInfo(order.estado).color}`}>
                    {getStatusInfo(order.estado).label}
                  </h2>
                  <p className="text-white/40 text-sm mt-1">#{order.numero_orden}</p>
                </div>
              </div>

              <div className="space-y-6 pt-6 border-t border-white/5">
                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Fecha de compra</span>
                  <span className="font-mono font-bold">{new Date(order.created_at).toLocaleDateString()}</span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Entrega Estimada</span>
                  <span className="font-mono font-bold text-green-400">
                    {order.estado === 'entregado'
                      ? 'Entregado'
                      : new Date(new Date(order.created_at).setDate(new Date(order.created_at).getDate() + 5)).toLocaleDateString()}
                  </span>
                </div>

                <div className="flex justify-between text-sm">
                  <span className="text-white/50">Total</span>
                  <span className="font-mono font-bold text-lg text-accent">
                    ${formatPrice(order.total)}
                  </span>
                </div>

                {order.tracking_code && (
                  <div className="bg-white/5 p-4 rounded-xl text-center space-y-2">
                    <p className="text-[10px] font-black uppercase tracking-widest text-white/50">Código de Seguimiento</p>
                    <p className="font-mono text-xl font-bold select-all">{order.tracking_code}</p>
                    {order.tracking_url && (
                      <a
                        href={order.tracking_url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-accent text-xs font-bold hover:underline block mt-2"
                      >
                        Ver en Correo
                      </a>
                    )}
                  </div>
                )}

                {order.trackingInfo && Array.isArray(order.trackingInfo.eventos) && order.trackingInfo.eventos.length > 0 && (
                  <div className="bg-white/[0.03] border border-white/10 rounded-2xl p-4 space-y-3">
                    <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/50">Historial del Envío</p>
                    <div className="space-y-3 max-h-60 overflow-y-auto pr-1">
                      {order.trackingInfo.eventos.map((ev: any, idx: number) => (
                        <div key={`${ev.fecha}-${idx}`} className="flex gap-3 items-start">
                          <div className="mt-1 w-2 h-2 rounded-full bg-accent" />
                          <div className="flex-1">
                            <p className="text-xs font-bold">
                              {new Date(ev.fecha).toLocaleString('es-AR')} · {ev.localidad}
                            </p>
                            <p className="text-[11px] text-white/70">{ev.descripcion}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-white/5 p-6 space-y-4">
              <form onSubmit={handleSubscribe} className="flex flex-col md:flex-row gap-3 items-stretch md:items-center">
                <div className="flex-1 relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40">
                    <Mail className="w-4 h-4" />
                  </span>
                  <input
                    type="email"
                    placeholder="Email para recibir novedades del envío"
                    value={notifyEmail}
                    onChange={(e) => setNotifyEmail(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl pl-10 pr-3 py-3 text-xs font-bold text-white outline-none focus:border-accent/40 transition-colors"
                  />
                </div>
                <button
                  type="submit"
                  disabled={subscribing}
                  className="md:w-auto w-full flex items-center justify-center gap-2 bg-white text-black hover:bg-gray-200 rounded-xl px-4 py-3 text-[10px] font-black uppercase tracking-widest transition-colors disabled:opacity-60"
                >
                  {subscribing ? 'Guardando...' : 'Recibir avisos'}
                </button>
              </form>

              <div className="text-center">
                <p className="text-xs text-white/40 mb-2">¿Tenés dudas sobre tu pedido?</p>
                <Link
                  href="/contacto"
                  className="inline-block bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-colors"
                >
                  Contactar Soporte
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
