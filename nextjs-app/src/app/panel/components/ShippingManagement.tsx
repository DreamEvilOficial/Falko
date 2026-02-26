'use client'

import { useState, useEffect } from 'react'
import { Truck, Package, MapPin, User, ArrowRight, Printer, CheckCircle, Search, Settings } from 'lucide-react'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/formatters'
import { paqarService } from '@/services/paqarService'
import ShippingConfig from './ShippingConfig'

export default function ShippingManagement() {
  const [loading, setLoading] = useState(true)
  const [showConfig, setShowConfig] = useState(false)
  const [orders, setOrders] = useState<any[]>([])
  const [senders, setSenders] = useState<any[]>([])
  const [selectedOrder, setSelectedOrder] = useState<any>(null)
  const [selectedSender, setSelectedSender] = useState<any>({
      nombre: 'Urban CDG Official',
      calle: 'Av. Corrientes',
      numero: '1234',
      localidad: 'CABA',
      provincia: 'CABA',
      cp: '1000'
  })
  const [generatedLabel, setGeneratedLabel] = useState<any>(null)
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    setLoading(true)
    try {
        const [ordersRes, sendersRes] = await Promise.all([
            fetch('/api/orders'),
            fetch('/api/shipping/senders')
        ])
        
        const ordersData = await ordersRes.json()
        const sendersData = await sendersRes.json()

        // Filter for orders that need shipping
        // Must have shipping address (not pickup) or shipping cost > 0
        // We include 'enviado' orders so users can reprint labels or manage them, but exclude cancelled/delivered
        const pendingOrders = (ordersData || []).filter((o: any) => {
            const isShipping = (o.direccion_envio && !o.direccion_envio.toLowerCase().includes('retiro')) || (Number(o.envio) > 0)
            const isActive = !['cancelado', 'entregado'].includes(o.estado?.toLowerCase())
            return isShipping && isActive
        })
        
        // Sort: Non-shipped first, then by date
        pendingOrders.sort((a: any, b: any) => {
            const aShipped = a.estado === 'enviado' ? 1 : 0
            const bShipped = b.estado === 'enviado' ? 1 : 0
            if (aShipped !== bShipped) return aShipped - bShipped
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        })

        setOrders(pendingOrders)
        setSenders(sendersData || [])

        // Set default sender if available
        if (sendersData && sendersData.length > 0) {
            const def = sendersData.find((s: any) => s.es_default) || sendersData[0]
            setSelectedSender(def)
        }
    } catch (error) {
        console.error(error)
        toast.error('Error cargando datos de envíos')
    } finally {
        setLoading(false)
    }
  }

  const handleGenerateLabel = async () => {
      if (!selectedOrder) return
      setLoading(true)
      try {
          const res = await fetch('/api/shipping/generate', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                  orderId: selectedOrder.id,
                  senderData: selectedSender
              })
          })

          if (!res.ok) throw new Error('Error al generar etiqueta')
          
          const label = await res.json()
          setGeneratedLabel(label)
          toast.success('Etiqueta generada correctamente')
          
          // Remove from pending list locally
          setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
      } catch (error) {
          toast.error('Falló la generación de etiqueta')
      } finally {
          setLoading(false)
      }
  }

  const handleManualStatus = async (status: string) => {
    if (!selectedOrder) return
    setLoading(true)
    try {
        const res = await fetch('/api/orders', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ id: selectedOrder.id, estado: status })
        })

        if (!res.ok) throw new Error('Error actualizando estado')
        
        toast.success(`Orden marcada como ${status}`)
        // Remove if shipped, keep if pending? Or just refresh
        // User asked to mark as sent or pending. 
        // If sent, it should probably disappear from "pending orders" list in this view
        setOrders(prev => prev.filter(o => o.id !== selectedOrder.id))
        resetSelection()
    } catch (error) {
        toast.error('Falló la actualización')
    } finally {
        setLoading(false)
    }
  }

  const printLabel = () => {
      if (!generatedLabel) return
      const printWindow = window.open('', '_blank')
      if (printWindow) {
          printWindow.document.write(paqarService.generateLabelHtml(generatedLabel))
          printWindow.document.close()
      }
  }

  const resetSelection = () => {
      setSelectedOrder(null)
      setGeneratedLabel(null)
  }

  const filteredOrders = orders.filter(o => 
      o.numero_orden.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !selectedOrder && orders.length === 0) return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-white/15 border-t-blue-500 rounded-full animate-spin"></div>
      </div>
  )

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
            <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic flex items-center gap-3">
            <Truck className="w-8 h-8 text-blue-500" />
            Gestión de <span className="text-blue-500">Envíos</span>
            </h2>
            <p className="text-white/40 text-xs font-mono mt-1">
                {orders.length} órdenes pendientes de despacho
            </p>
        </div>
        
        {/* Sender Selector / Config Toggle */}
        <div className="bg-white/[0.03] border border-white/10 rounded-xl p-2 flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center text-blue-400">
                <MapPin className="w-4 h-4" />
            </div>
            <div className="text-xs">
                <p className="text-white/40 font-bold uppercase tracking-wider text-[9px]">Remitente Actual</p>
                <p className="text-white font-bold truncate max-w-[150px]">{selectedSender.nombre}</p>
            </div>
            <button 
                onClick={() => setShowConfig(!showConfig)}
                className={`ml-2 p-2 rounded-lg transition ${showConfig ? 'bg-white text-black' : 'hover:bg-white/10 text-white/50 hover:text-white'}`}
            >
                <Settings className="w-4 h-4" />
            </button>
        </div>
      </div>

      {showConfig ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-300">
              <button 
                  onClick={() => setShowConfig(false)}
                  className="mb-4 text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider"
              >
                  <ArrowRight className="w-4 h-4 rotate-180" /> Volver al listado
              </button>
              <ShippingConfig />
          </div>
      ) : !selectedOrder ? (
          // LIST VIEW
          <div className="space-y-4">
              {/* Search */}
              <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-white/30 w-5 h-5" />
                  <input 
                      type="text" 
                      placeholder="Buscar por orden o cliente..." 
                      value={searchTerm}
                      onChange={e => setSearchTerm(e.target.value)}
                      className="w-full bg-white/[0.03] border border-white/10 rounded-2xl py-4 pl-12 pr-4 text-white outline-none focus:border-blue-500/50 transition-colors"
                  />
              </div>

              {/* Table Header */}
              <div className="hidden md:grid grid-cols-12 gap-4 px-6 py-2 text-[10px] font-black uppercase tracking-widest text-white/30">
                  <div className="col-span-2">Orden</div>
                  <div className="col-span-3">Cliente</div>
                  <div className="col-span-3">Destino</div>
                  <div className="col-span-2">Fecha</div>
                  <div className="col-span-2 text-right">Acción</div>
              </div>

              {/* List */}
              <div className="space-y-3">
                  {filteredOrders.length > 0 ? (
                      filteredOrders.map(order => (
                          <div 
                              key={order.id}
                              className="group grid grid-cols-1 md:grid-cols-12 gap-4 bg-[#06070c]/70 border border-white/10 p-5 rounded-2xl hover:border-blue-500/30 transition-all items-center"
                          >
                              <div className="col-span-2 flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-xl bg-white/[0.05] flex items-center justify-center text-white/50 group-hover:bg-blue-500/10 group-hover:text-blue-400 transition-colors">
                                      <Package className="w-5 h-5" />
                                  </div>
                                  <span className="font-black text-white">#{order.numero_orden}</span>
                              </div>
                              
                              <div className="col-span-3">
                                  <p className="font-bold text-white text-sm">{order.cliente_nombre}</p>
                                  <p className="text-xs text-white/40">{order.cliente_email}</p>
                              </div>

                              <div className="col-span-3">
                                  <div className="flex items-center gap-2 text-white/60 text-xs">
                                      <MapPin className="w-3 h-3" />
                                      {order.ciudad || order.envio_ciudad || 'S/D'}, {order.provincia || order.envio_provincia || ''}
                                  </div>
                              </div>

                              <div className="col-span-2">
                                  <p className="text-xs font-mono text-white/50">
                                      {new Date(order.created_at).toLocaleDateString()}
                                  </p>
                              </div>

                              <div className="col-span-2 text-right">
                                  <button 
                                      onClick={() => setSelectedOrder(order)}
                                      className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-900/20"
                                  >
                                      Procesar
                                  </button>
                              </div>
                          </div>
                      ))
                  ) : (
                      <div className="text-center py-20 text-white/30">
                          <Package className="w-12 h-12 mx-auto mb-4 opacity-20" />
                          <p>No hay órdenes pendientes para enviar</p>
                      </div>
                  )}
              </div>
          </div>
      ) : (
          // PROCESS VIEW
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* Left Column: Details */}
              <div className="space-y-6">
                  <button 
                      onClick={resetSelection}
                      className="text-white/50 hover:text-white flex items-center gap-2 text-xs font-bold uppercase tracking-wider mb-4"
                  >
                      <ArrowRight className="w-4 h-4 rotate-180" /> Volver al listado
                  </button>

                  <div className="bg-white/[0.03] border border-white/10 p-8 rounded-[30px] space-y-6">
                      <div className="flex justify-between items-start">
                          <div>
                              <h3 className="text-2xl font-black text-white mb-1">Orden #{selectedOrder.numero_orden}</h3>
                              <p className="text-white/40 text-sm">Preparando envío para {selectedOrder.cliente_nombre}</p>
                          </div>
                          <div className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest border border-blue-500/20">
                              Paq.ar Clásica
                          </div>
                      </div>

                      <div className="h-px bg-white/10" />

                      <div className="grid grid-cols-2 gap-8">
                          <div>
                              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Destinatario</h4>
                              <div className="space-y-3">
                                  <div className="flex gap-3">
                                      <User className="w-4 h-4 text-white/40 mt-0.5" />
                                      <div>
                                          <p className="text-white font-bold text-sm">{selectedOrder.cliente_nombre}</p>
                                          <p className="text-white/40 text-xs">{selectedOrder.cliente_email}</p>
                                          <p className="text-white/40 text-xs">{selectedOrder.cliente_telefono}</p>
                                      </div>
                                  </div>
                                  <div className="flex gap-3">
                                      <MapPin className="w-4 h-4 text-white/40 mt-0.5" />
                                      <div>
                                          <p className="text-white font-bold text-sm">
                                              {selectedOrder.direccion_envio || selectedOrder.envio_direccion}
                                          </p>
                                          <p className="text-white/40 text-xs">
                                              {selectedOrder.ciudad || selectedOrder.envio_ciudad}, {selectedOrder.provincia || selectedOrder.envio_provincia}
                                          </p>
                                          <p className="text-white/40 text-xs">CP: {selectedOrder.codigo_postal || selectedOrder.envio_codigo_postal}</p>
                                      </div>
                                  </div>
                              </div>
                          </div>

                          <div>
                              <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em] mb-4">Remitente</h4>
                              <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                                  <p className="text-white font-bold text-sm mb-1">{selectedSender.nombre}</p>
                                  <p className="text-white/40 text-xs">{selectedSender.calle} {selectedSender.numero}</p>
                                  <p className="text-white/40 text-xs">{selectedSender.localidad} ({selectedSender.cp})</p>
                              </div>
                              <button className="text-[10px] text-blue-400 font-bold uppercase tracking-widest mt-2 hover:text-blue-300">
                                  Cambiar Remitente
                              </button>
                          </div>
                      </div>
                  </div>
              </div>

              {/* Right Column: Action / Result */}
              <div className="space-y-6">
                  {!generatedLabel ? (
                      <div className="bg-gradient-to-br from-blue-600/20 to-blue-900/20 border border-blue-500/30 p-8 rounded-[30px] flex flex-col justify-center h-full min-h-[400px]">
                          <div className="text-center space-y-6">
                              <div className="w-20 h-20 bg-blue-500 rounded-2xl mx-auto flex items-center justify-center shadow-lg shadow-blue-500/40">
                                  <Printer className="w-10 h-10 text-white" />
                              </div>
                              <div>
                                  <h3 className="text-xl font-black text-white uppercase tracking-tight">Listo para generar</h3>
                                  <p className="text-blue-200/60 text-sm mt-2 max-w-xs mx-auto">
                                      Se generará una etiqueta de Correo Argentino con los datos verificados.
                                  </p>
                              </div>
                              <button 
                                  onClick={handleGenerateLabel}
                                  disabled={loading}
                                  className="w-full py-4 bg-white text-blue-900 rounded-xl font-black uppercase tracking-widest hover:bg-blue-50 transition-all shadow-xl active:scale-95"
                              >
                                  {loading ? 'Generando...' : 'Generar Etiqueta Ahora'}
                              </button>
                          </div>
                      </div>
                  ) : (
                      <div className="bg-[#E5E5E5] p-8 rounded-[30px] h-full text-black flex flex-col animate-in fade-in slide-in-from-right-4">
                          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-black/10">
                              <CheckCircle className="w-8 h-8 text-green-600" />
                              <div>
                                  <h3 className="font-black text-lg uppercase tracking-tight">Etiqueta Generada</h3>
                                  <p className="text-black/50 text-xs font-mono">{generatedLabel.trackingNumber}</p>
                              </div>
                          </div>

                          <div className="bg-white p-6 rounded-xl shadow-sm flex-1 mb-6 border border-black/5 relative overflow-hidden">
                              <div className="absolute top-0 right-0 bg-blue-600 text-white text-[9px] font-black px-3 py-1 rounded-bl-xl uppercase tracking-widest">
                                  Vista Previa
                              </div>
                              {/* Mini Preview */}
                              <div className="text-center mt-8">
                                  <div className="text-2xl font-black italic text-blue-900 mb-2">Correo Argentino</div>
                                  <div className="w-3/4 h-12 bg-black/10 mx-auto my-4 rounded flex items-center justify-center font-mono text-xs text-black/40">
                                      ||| || |||| ||| || ||||
                                  </div>
                                  <p className="font-mono font-bold">{generatedLabel.trackingNumber}</p>
                                  <p className="text-xs mt-4 text-black/60">Destino: {selectedOrder.ciudad}</p>
                              </div>
                          </div>

                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                  onClick={printLabel}
                                  className="py-4 bg-black text-white rounded-xl font-black uppercase tracking-widest hover:bg-black/80 transition-all"
                              >
                                  Imprimir PDF
                              </button>
                              <button 
                                  onClick={resetSelection}
                                  className="py-4 border-2 border-black text-black rounded-xl font-black uppercase tracking-widest hover:bg-black/5 transition-all"
                              >
                                  Siguiente Orden
                              </button>
                          </div>
                      </div>
                  )}
                  
                  {/* Manual Actions */}
                  {!generatedLabel && selectedOrder && (
                      <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[30px] space-y-4">
                          <h4 className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">Acciones Manuales</h4>
                          <div className="grid grid-cols-2 gap-4">
                              <button 
                                  onClick={() => handleManualStatus('enviado')}
                                  disabled={loading}
                                  className="py-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                  Marcar Enviado
                              </button>
                              <button 
                                  onClick={() => handleManualStatus('pendiente')}
                                  disabled={loading}
                                  className="py-3 bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 border border-amber-500/20 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all"
                              >
                                  Marcar Pendiente
                              </button>
                          </div>
                      </div>
                  )}
              </div>
          </div>
      )}
    </div>
  )
}
