'use client'

import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  Search, Package, XCircle, Truck, 
  CreditCard, Landmark, User, Mail, Phone, MapPin,
  Info, ChevronRight, Check
} from 'lucide-react'
import { formatPrice, toNumber } from '@/lib/formatters'
import ShippingLabelGenerator from './ShippingLabelGenerator'

interface Orden {
  id: string
  numero_orden: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono?: string
  direccion_envio?: string
  ciudad?: string
  provincia?: string
  codigo_postal?: string
  items?: any[] | string
  subtotal: number | string
  envio: number | string
  total: number | string
  estado: string
  metodo_pago?: string
  pago_id?: string
  mercadopago_payment_id?: number
  notas?: string
  metadata?: any
  tracking_code?: string | null
  tracking_url?: string | null
  created_at: string
}

export default function OrderManagement() {
  const [ordenes, setOrdenes] = useState<Orden[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState('todos')
  const [methodFilter, setMethodFilter] = useState('todos')
  const [selectedOrder, setSelectedOrder] = useState<Orden | null>(null)
  const [showModal, setShowModal] = useState(false)
  const [trackingData, setTrackingData] = useState({ code: '', url: '' })
  const [selectedOrderLoading, setSelectedOrderLoading] = useState(false)

  useEffect(() => {
    cargarOrdenes()
    // Local SQLite does not support real-time subscriptions
    const interval = setInterval(cargarOrdenes, 30000) // Poll every 30s instead
    return () => clearInterval(interval)
  }, [])

  useEffect(() => {
    if (selectedOrder) {
      setTrackingData({
        code: (selectedOrder as any).tracking_code || '',
        url: (selectedOrder as any).tracking_url || ''
      })
    }
  }, [selectedOrder])

  async function cargarOrdenes() {
    try {
      const res = await fetch('/api/orders')
      const data = await res.json()
      // API returns recent orders first usually, or we sort client side if needed
      setOrdenes(data || [])
    } catch (error) {
      toast.error('Error al cargar ventas')
    } finally {
      setLoading(false)
    }
  }

  async function handleOpenOrder(orden: Orden) {
    setShowModal(true)
    setSelectedOrder(orden)
    setSelectedOrderLoading(true)
    try {
      const res = await fetch(`/api/orders?id=${orden.id}`)
      if (res.ok) {
        const full = await res.json()
        if (full) {
          setSelectedOrder(full)
        }
      }
    } catch (error) {
      console.error('Error loading order detail:', error)
    } finally {
      setSelectedOrderLoading(false)
    }
  }

  async function actualizarEstado(id: string, nuevoEstado: string) {
    try {
      const res = await fetch('/api/orders', {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id, estado: nuevoEstado })
      })
      if (!res.ok) throw new Error('Error updating order')
      
      toast.success(`Orden ${nuevoEstado}`)
      cargarOrdenes()
      if (selectedOrder?.id === id) {
        setSelectedOrder({ ...selectedOrder, estado: nuevoEstado })
      }
    } catch (error: any) {
      toast.error('Error al actualizar')
    }
  }

  async function actualizarSeguimiento() {
    if (!selectedOrder) return
    try {
      const res = await fetch('/api/orders', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          id: selectedOrder.id, 
          tracking_code: trackingData.code,
          tracking_url: trackingData.url
        })
      })
      if (!res.ok) throw new Error('Error al actualizar seguimiento')
      
      toast.success('Información de seguimiento actualizada')
      cargarOrdenes()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const resolveMethod = (o: Orden) => {
    const m = (o.metodo_pago || '').toLowerCase()
    if (m.includes('mercado') || m.includes('mp') || o.mercadopago_payment_id) return 'Mercado Pago'
    if (m.includes('transferencia') || m.includes('deposito')) return 'Transferencia'
    return o.metodo_pago || 'No especificado'
  }

  const resolveStatusPillClass = (estado: string) => {
    const e = (estado || '').toLowerCase()
    if (e === 'pendiente') return 'bg-amber-400/15 text-amber-300 border border-amber-400/20'
    if (e === 'enviado') return 'bg-sky-400/15 text-sky-300 border border-sky-400/20'
    if (e === 'completado') return 'bg-emerald-500/15 text-emerald-300 border border-emerald-500/20'
    if (e === 'cancelado') return 'bg-red-500/15 text-red-300 border border-red-500/20'
    return 'bg-white/[0.03] text-white/70 border border-white/10'
  }

  const filteredOrders = ordenes.filter(orden => {
    const matchesSearch = 
      orden.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
      orden.cliente_email.toLowerCase().includes(searchTerm.toLowerCase())
    
    const matchesStatus = statusFilter === 'todos' || orden.estado === statusFilter
    const metodo = resolveMethod(orden).toLowerCase()
    const matchesMethod =
      methodFilter === 'todos' ||
      (methodFilter === 'mercadopago' && metodo.includes('mercado')) ||
      (methodFilter === 'transferencia' && metodo.includes('transferencia'))

    return matchesSearch && matchesStatus && matchesMethod
  })

  const parseItems = (items: any): any[] => {
    try {
      return typeof items === 'string' ? JSON.parse(items) : (Array.isArray(items) ? items : [])
    } catch { return [] }
  }

  if (loading) return (
    <div className="flex justify-center items-center min-h-[400px]">
      <div className="w-10 h-10 border-2 border-white/15 border-t-accent rounded-full animate-spin"></div>
    </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col gap-4 md:flex-row md:items-center justify-between">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-[0.08em] uppercase text-white flex items-center gap-3">
            Ventas <span className="text-white/40 text-xs md:text-base font-sans font-black tracking-[0.25em]">/ Admin</span>
          </h1>
          <p className="text-white/45 text-xs md:text-sm mt-1">Control total de pedidos y pagos de la tienda</p>
        </div>

      <div className="flex overflow-x-auto pb-2 md:pb-0 gap-2 no-scrollbar">
        {['todos', 'pendiente', 'enviado', 'completado', 'cancelado'].map(s => (
          <button 
            key={s}
            onClick={() => setStatusFilter(s)}
            className={`flex-shrink-0 px-4 py-2 rounded-xl text-[10px] font-black transition-all uppercase tracking-[0.25em] border border-transparent ${
              statusFilter === s
                ? 'bg-accent text-ink shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)]'
                : 'bg-white/[0.03] text-white/45 hover:text-white hover:bg-white/[0.06] border-white/5'
            }`}
          >
            {s}
          </button>
        ))}
      </div>
        
        <div className="flex gap-4">
           <div className="bg-emerald-500/10 border border-emerald-500/20 px-6 py-3 rounded-[24px] text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-70">Total Ventas</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                $ {formatPrice(ordenes.filter(o => o.estado === 'completado').reduce((acc, o) => acc + toNumber(o.total), 0))} ARS
              </p>
           </div>
           <div className="bg-white/5 border border-white/10 px-6 py-3 rounded-[24px] text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-white/40">Pedidos Hoy</p>
              <p className="text-2xl font-black text-white tracking-tighter">
                {ordenes.filter(o => new Date(o.created_at).toDateString() === new Date().toDateString()).length}
              </p>
           </div>
        </div>
      </div>

      {/* Buscador y Filtros */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
        <div className="md:col-span-8 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/35 w-5 h-5 group-focus-within:text-accent transition-colors" />
          <input
            type="text"
            placeholder="Buscar por orden, cliente..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 md:py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-accent/40 outline-none transition-all shadow-[0_20px_70px_-60px_rgba(0,0,0,0.9)] hover:border-white/20 text-sm md:text-base"
          />
        </div>
        <div className="md:col-span-4">
          <div className="relative">
            <select
              value={methodFilter}
              onChange={(e) => setMethodFilter(e.target.value)}
              className="w-full px-4 py-3 md:py-4 bg-white/[0.03] border border-white/10 rounded-2xl focus:border-accent/40 outline-none appearance-none cursor-pointer font-bold text-sm md:text-base transition hover:border-white/20 text-white/70"
            >
              <option value="todos">Todos los pagos</option>
              <option value="mercadopago">Mercado Pago</option>
              <option value="transferencia">Transferencia</option>
            </select>
            <ChevronRight className="absolute right-4 top-1/2 -translate-y-1/2 rotate-90 w-5 h-5 text-white/30 pointer-events-none" />
          </div>
        </div>
      </div>

      {/* Lista de Órdenes Modernizada */}
      <div className="grid gap-4">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((orden) => (
            <div 
              key={orden.id} 
              onClick={() => { handleOpenOrder(orden) }}
              className="group bg-[#06070c]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-[28px] hover:border-white/20 transition-all cursor-pointer shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] hover:bg-white/[0.02] relative overflow-hidden active:scale-[0.98]"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
                <div className="flex items-start md:items-center gap-5">
                  <div className={`w-12 h-12 md:w-14 md:h-14 rounded-2xl flex items-center justify-center transition-colors flex-shrink-0 ${orden.estado === 'completado' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-white/[0.03] text-white/35 group-hover:bg-accent/15 group-hover:text-accent'}`}>
                    <Package className="w-5 h-5 md:w-6 md:h-6" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                       <span className="text-white font-black text-base md:text-lg">#{orden.numero_orden}</span>
                       <span className={`text-[9px] md:text-[10px] font-black px-2 py-0.5 rounded-full uppercase tracking-[0.22em] ${resolveStatusPillClass(orden.estado)}`}>
                        {orden.estado}
                       </span>
                    </div>
                    <p className="text-white/55 font-bold text-xs md:text-sm truncate">{orden.cliente_nombre}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between md:justify-end gap-4 md:gap-8 border-t border-white/5 md:border-0 pt-4 md:pt-0">
                  <div className="hidden lg:block text-center">
                    <p className="text-[10px] text-white/35 uppercase font-black tracking-[0.32em] mb-1">Método</p>
                    <div className="flex items-center gap-2 text-sm font-black text-white">
                      {resolveMethod(orden) === 'Mercado Pago' ? <CreditCard className="w-4 h-4 text-sky-400" /> : <Landmark className="w-4 h-4 text-emerald-400" />}
                      {resolveMethod(orden)}
                    </div>
                  </div>

                  <div className="hidden lg:block text-center">
                     <p className="text-[10px] text-white/35 uppercase font-black tracking-[0.32em] mb-1">Envío</p>
                     <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-[0.2em] inline-flex items-center gap-2 ${
                        orden.estado === 'enviado' ? 'bg-sky-500/15 text-sky-400 border border-sky-500/20' : 
                        orden.estado === 'pendiente' ? 'bg-amber-500/15 text-amber-400 border border-amber-500/20' :
                        'bg-white/5 text-white/50 border border-white/10'
                     }`}>
                        <Truck className="w-3 h-3" />
                        {orden.estado === 'enviado' ? 'Enviado' : orden.estado === 'pendiente' ? 'Pendiente' : orden.estado}
                     </div>
                  </div>

                  <div className="text-left md:text-center">
                    <p className="text-[9px] md:text-[10px] text-white/35 uppercase font-black tracking-[0.32em] mb-1">Fecha</p>
                    <p className="text-xs md:text-sm font-black text-white">
                      {new Date(orden.created_at).toLocaleDateString('es-AR')}
                    </p>
                  </div>

                  <div className="text-right">
                    <p className="text-[9px] md:text-[10px] text-white/35 uppercase font-black tracking-[0.32em] mb-1">Total</p>
                    <p className="text-lg md:text-xl font-black text-white">$ {formatPrice(orden.total)} ARS</p>
                  </div>

                  <div className="pl-4 border-l border-white/10 hidden md:block">
                    <ChevronRight className="w-5 h-5 text-white/25 group-hover:text-white transition-colors" />
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="py-20 text-center bg-[#06070c]/70 rounded-[28px] border border-dashed border-white/15">
            <Info className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/55 font-black">No se encontraron ventas</p>
          </div>
        )}
      </div>

      {/* MODAL DE DETALLE PROFESIONAL */}
      {showModal && selectedOrder && (
        <div className="fixed inset-0 bg-black/90 backdrop-blur-md flex items-center justify-center z-[100] p-0 md:p-4 animate-in fade-in zoom-in duration-300">
          <div className="bg-[#06070c] md:rounded-[40px] w-full max-w-4xl h-full md:h-auto md:max-h-[90vh] overflow-hidden flex flex-col shadow-2xl border-0 md:border border-white/10">
            {/* Header Modal */}
            <div className="p-6 md:p-8 border-b border-white/10 flex items-center justify-between flex-shrink-0 bg-white/[0.02]">
               <div className="flex-1 flex flex-col items-center text-center gap-1">
                 <div className="flex flex-col md:flex-row md:items-center md:justify-center gap-2 md:gap-3">
                   <h2 className="font-display text-2xl md:text-3xl tracking-[0.06em] uppercase text-white">
                     Orden #{selectedOrder.numero_orden}
                   </h2>
                   <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-[0.2em] ${resolveStatusPillClass(selectedOrder.estado)}`}>
                     {selectedOrder.estado}
                   </span>
                 </div>
                 <p className="text-white/45 font-bold text-xs md:text-sm">
                   {new Date(selectedOrder.created_at).toLocaleString('es-AR')}
                 </p>
               </div>
               <button onClick={() => setShowModal(false)} className="ml-4 w-10 h-10 md:w-12 md:h-12 rounded-full border border-white/10 flex items-center justify-center hover:bg-accent hover:text-ink hover:border-accent/40 transition-all text-white/70">
                 <XCircle className="w-5 h-5 md:w-6 md:h-6" />
               </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 md:p-8 custom-scrollbar space-y-8">
              {selectedOrderLoading && (
                <div className="flex items-center justify-center py-4">
                  <div className="w-8 h-8 border-2 border-white/20 border-t-accent rounded-full animate-spin" />
                </div>
              )}

              {/* Sección Superior: Comprador y Envío */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Datos Comprador */}
                <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[24px]">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.32em] mb-4 flex items-center gap-2">
                    <User className="w-4 h-4" /> Comprador
                  </h3>
                  <div className="flex items-start gap-4">
                     <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-ink shadow-[0_18px_50px_-30px_rgba(183,255,42,0.5)] font-black text-base flex-shrink-0">
                       {selectedOrder.cliente_nombre.substring(0, 2).toUpperCase()}
                     </div>
                     <div className="space-y-1 min-w-0">
                        <p className="text-lg font-black text-white uppercase truncate">{selectedOrder.cliente_nombre}</p>
                        <p className="text-xs text-white/60 flex items-center gap-1.5 font-bold truncate">
                          <Mail className="w-3.5 h-3.5" /> {selectedOrder.cliente_email}
                        </p>
                        {selectedOrder.cliente_telefono && (
                          <p className="text-xs text-white/60 flex items-center gap-1.5 font-bold truncate">
                            <Phone className="w-3.5 h-3.5" /> {selectedOrder.cliente_telefono}
                          </p>
                        )}
                     </div>
                  </div>
                </div>

                {/* Datos Envío */}
                <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[24px]">
                  <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.32em] mb-4 flex items-center gap-2">
                    <MapPin className="w-4 h-4" /> Envío
                  </h3>
                  <div className="flex items-start gap-4">
                    <div className="w-12 h-12 rounded-2xl bg-white/[0.05] border border-white/10 flex items-center justify-center text-white/50 flex-shrink-0">
                      <Truck className="w-5 h-5" />
                    </div>
                    <div className="space-y-2">
                      <p className="text-sm text-white/90 font-bold leading-relaxed">
                        {selectedOrder.direccion_envio || 'Sin dirección de envío especificada'}
                      </p>
                      {(selectedOrder.ciudad || selectedOrder.provincia) && (
                        <div className="flex gap-2 text-[10px] font-black uppercase text-white/50">
                          {selectedOrder.ciudad && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{selectedOrder.ciudad}</span>}
                          {selectedOrder.provincia && <span className="bg-white/5 px-2 py-1 rounded-md border border-white/5">{selectedOrder.provincia}</span>}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                
                {/* Columna Ancha: Productos */}
                <div className="lg:col-span-2 space-y-6">
                   <section>
                      <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.32em] mb-4 flex items-center gap-2">
                        <Package className="w-4 h-4" /> Productos ({parseItems(selectedOrder.items).length})
                      </h3>
                      <div className="space-y-3">
                        {parseItems(selectedOrder.items).map((item, i) => (
                           <div key={i} className="flex gap-5 p-5 border border-white/10 rounded-[24px] group hover:border-accent/30 transition-all bg-[#08090E]">
                              <div className="w-20 h-24 rounded-xl overflow-hidden bg-white/[0.03] border border-white/10 flex-shrink-0 relative">
                                 {item.imagen_url ? (
                                   <img src={item.imagen_url} className="w-full h-full object-cover" alt={item.nombre} />
                                 ) : (
                                   <div className="w-full h-full flex items-center justify-center text-2xl">🧥</div>
                                 )}
                              </div>
                              <div className="flex-1 flex flex-col justify-between py-1">
                                 <div>
                                  <p className="text-base font-black text-white mb-2 line-clamp-2">{item.nombre}</p>
                                  <div className="flex flex-wrap gap-2">
                                      {item.talle && <span className="text-[10px] font-black px-2.5 py-1 bg-white/[0.04] border border-white/5 rounded-lg text-white/70">Talle {item.talle}</span>}
                                      {item.color && (
                                        <div className="flex items-center gap-1.5 px-2.5 py-1 bg-white/[0.04] border border-white/5 rounded-lg">
                                          <div className="w-2 h-2 rounded-full" style={{backgroundColor: item.color}} />
                                          <span className="text-[10px] font-black text-white/70 uppercase">{item.color}</span>
                                        </div>
                                      )}
                                  </div>
                                 </div>
                                 <div className="flex justify-between items-end mt-2">
                                    <p className="text-xs text-white/40 font-black uppercase tracking-wider">Cant: {item.cantidad}</p>
                                    <p className="text-lg font-black text-white">
                                      $ {formatPrice(toNumber(item.precio) * toNumber(item.cantidad))}
                                    </p>
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                   </section>
                </div>

                {/* Columna Lateral: Pago y Seguimiento */}
                <div className="space-y-6">
                   {/* Tarjeta de Pago */}
                   <section className="bg-ink text-white p-6 rounded-[28px] shadow-2xl relative overflow-hidden border border-white/10 group">
                      <div className="absolute -right-6 -top-6 w-24 h-24 bg-accent/20 rounded-full blur-2xl group-hover:bg-accent/30 transition-all"></div>
                      
                      <h3 className="text-[10px] font-black text-white/45 uppercase tracking-[0.45em] mb-6 relative z-10">Pago</h3>
                      
                      <div className="space-y-4 mb-8 relative z-10">
                         <div className="flex justify-between items-center text-sm">
                            <span className="text-white/60 font-bold">Método</span>
                            <div className="flex items-center gap-2 font-black bg-white/10 px-3 py-1 rounded-lg">
                               {resolveMethod(selectedOrder) === 'Mercado Pago' ? <CreditCard className="w-3 h-3 text-sky-400" /> : <Landmark className="w-3 h-3 text-emerald-400" />}
                               {resolveMethod(selectedOrder)}
                            </div>
                         </div>
                         {selectedOrder.mercadopago_payment_id && (
                           <div className="flex justify-between items-center text-sm">
                              <span className="text-white/60 font-bold">ID Transacción</span>
                              <span className="font-mono text-xs opacity-80">#{selectedOrder.mercadopago_payment_id}</span>
                           </div>
                         )}
                         <div className="h-[1px] bg-white/10 my-4" />
                         <div>
                            <span className="text-[10px] text-white/60 font-black uppercase tracking-widest block mb-1">Total Abonado</span>
                            <span className="text-3xl font-black tracking-tighter text-accent">$ {formatPrice(selectedOrder.total)}</span>
                         </div>
                      </div>

                      <div className="grid grid-cols-2 gap-2 relative z-10">
                         <button onClick={() => actualizarEstado(selectedOrder.id, 'enviado')} className="flex flex-col items-center justify-center gap-1 py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-xl transition-all group/btn">
                            <Truck className="w-4 h-4 text-white/70 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest">Enviado</span>
                         </button>
                         <button onClick={() => actualizarEstado(selectedOrder.id, 'completado')} className="flex flex-col items-center justify-center gap-1 py-3 bg-white/[0.06] hover:bg-white/[0.12] border border-white/10 rounded-xl transition-all group/btn">
                            <Check className="w-4 h-4 text-emerald-400 group-hover/btn:scale-110 transition-transform" />
                            <span className="text-[8px] font-black uppercase tracking-widest text-emerald-400">Completar</span>
                         </button>
                      </div>
                   </section>

                   {/* Generador de Etiquetas Andreani */}
                   <ShippingLabelGenerator 
                      order={selectedOrder} 
                      onLabelGenerated={(code: string) => setTrackingData(prev => ({ ...prev, code }))}
                   />

                   {/* Seguimiento */}
                   <section className="bg-white/[0.03] border border-white/10 p-6 rounded-[24px]">
                      <h3 className="text-xs font-black text-white/40 uppercase tracking-[0.32em] mb-4 flex items-center gap-2">
                        <Truck className="w-4 h-4" /> Tracking
                      </h3>
                      <div className="space-y-4">
                        <div className="space-y-1">
                          <label className="text-[9px] text-white/40 font-black uppercase tracking-widest">Código</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={trackingData.code}
                              onChange={(e) => setTrackingData({...trackingData, code: e.target.value})}
                              placeholder="Sin código"
                              className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 transition-colors"
                            />
                            <Package className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30" />
                          </div>
                        </div>
                        <div className="space-y-1">
                          <label className="text-[9px] text-white/40 font-black uppercase tracking-widest">Link</label>
                          <div className="relative">
                            <input 
                              type="text" 
                              value={trackingData.url}
                              onChange={(e) => setTrackingData({...trackingData, url: e.target.value})}
                              placeholder="https://..."
                              className="w-full bg-black/40 border border-white/10 p-3 pl-9 rounded-xl text-xs font-bold text-white outline-none focus:border-white/30 transition-colors"
                            />
                            <div className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-white/30 font-serif italic">w</div>
                          </div>
                        </div>
                        <button 
                          onClick={actualizarSeguimiento}
                          className="w-full py-3 bg-white text-black hover:bg-gray-200 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-white/5"
                        >
                          Guardar
                        </button>
                      </div>
                   </section>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
