'use client'

import { useState, useEffect } from 'react'
import { supabase, deudasAPI } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { DollarSign, Plus, Search, Calendar, ChevronUp, ChevronDown, MessageCircle, Trash2 } from 'lucide-react'
import { formatPrice, toNumber } from '@/lib/formatters'
import { v4 as uuidv4 } from 'uuid'

interface Deuda {
  id: string
  cliente_nombre: string
  cliente_apellido: string
  cliente_dni: string
  cliente_celular: string
  cliente_direccion: string
  total_deuda: number
  historial: any[]
  created_at: string
}

export default function DebtManagement() {
  const [deudas, setDeudas] = useState<Deuda[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [now, setNow] = useState<Date>(new Date())
  
  // New Client Form
  const [formData, setFormData] = useState({
    cliente_nombre: '',
    cliente_apellido: '',
    cliente_dni: '',
    cliente_celular: '',
    cliente_direccion: ''
  })

  const [transactionData, setTransactionData] = useState({
    monto: '',
    descripcion: '',
    producto: '',
    fechaDate: '',
    fechaTime: '',
    tipo: 'deuda',
    cuotas: '',
    frecuencia: '30',
    frecuenciaDias: ''
  })
  const [selectedClient, setSelectedClient] = useState<Deuda | null>(null)

  useEffect(() => {
    fetchDeudas()
  }, [])

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(new Date())
    }, 60000)

    return () => clearInterval(interval)
  }, [])

  function getDebtTiming(client: Deuda) {
    const history = client.historial || []
    const payments = history.filter((h: any) => h.tipo === 'pago')
    const lastPayment = payments.length > 0 ? payments[payments.length - 1] : null
    const lastPaymentDate = lastPayment ? new Date(lastPayment.fecha) : new Date(client.created_at)

    const config = history.find((h: any) => h.tipo === 'config')
    const frecuenciaDias = config?.frecuenciaDias || 30

    const lastPaymentTime = lastPaymentDate.getTime()
    const nextDueTime = lastPaymentTime + frecuenciaDias * 24 * 60 * 60 * 1000
    const nextDueDate = new Date(nextDueTime)

    const diffFromLast = now.getTime() - lastPaymentTime
    const diffToNext = nextDueTime - now.getTime()

    const daysSinceLast = Math.floor(diffFromLast / (24 * 60 * 60 * 1000))
    const daysToNext = Math.ceil(diffToNext / (24 * 60 * 60 * 1000))

    let estado: 'al_dia' | 'proxima' | 'vencida' = 'al_dia'
    if (daysToNext < 0) {
      estado = 'vencida'
    } else if (daysToNext <= 3) {
      estado = 'proxima'
    }

    const totalCuotas = config?.cuotas
    const cuotasPagadas = payments.length

    return {
      lastPaymentDate,
      nextDueDate,
      daysSinceLast,
      daysToNext,
      estado,
      totalCuotas,
      cuotasPagadas
    }
  }

  function formatDaysLabel(value: number, mode: 'since' | 'until') {
    if (Number.isNaN(value)) return '—'
    if (mode === 'since') {
      if (value <= 0) return 'Hoy'
      if (value === 1) return 'Hace 1 día'
      return `Hace ${value} días`
    } else {
      if (value < 0) return `Vencida hace ${Math.abs(value)} días`
      if (value === 0) return 'Vence hoy'
      if (value === 1) return 'En 1 día'
      return `En ${value} días`
    }
  }

  async function fetchDeudas() {
    try {
      const data = await deudasAPI.obtenerTodas()
      setDeudas(data || [])
    } catch (error) {
      console.error('Error:', error)
      // toast.error('No se pudo cargar la tabla de deudas. ¿Existe en Supabase?')
    } finally {
      setLoading(false)
    }
  }

  async function handleCreateClient(e: React.FormEvent) {
    e.preventDefault()
    try {
      const data = await deudasAPI.crear(formData)

      setDeudas([data, ...deudas])
      setShowForm(false)
      setFormData({ cliente_nombre: '', cliente_apellido: '', cliente_dni: '', cliente_celular: '', cliente_direccion: '' })
      toast.success('Cliente registrado')
    } catch (error: any) {
      console.error('Error creating client:', error)
      toast.error(`Error al crear cliente: ${error.message || 'Error desconocido'}`)
    }
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedClient) return
    
    const amount = toNumber(transactionData.monto)
    if (isNaN(amount) || amount <= 0) return toast.error('Monto inválido')

    let cuotasNumber: number | undefined
    let frecuenciaValue: string | undefined
    let frecuenciaDiasNumber: number | undefined

    if (transactionData.tipo === 'deuda') {
      cuotasNumber = Number(transactionData.cuotas)
      if (!cuotasNumber || cuotasNumber <= 0) {
        return toast.error('Seleccioná la cantidad de cuotas')
      }

      frecuenciaValue = transactionData.frecuencia
      if (!frecuenciaValue) {
        return toast.error('Seleccioná la frecuencia de pago')
      }

      if (frecuenciaValue === 'custom') {
        const customDays = Number(transactionData.frecuenciaDias)
        if (!customDays || customDays <= 0) {
          return toast.error('Ingresá los días para la frecuencia personalizada')
        }
        frecuenciaDiasNumber = customDays
      } else if (frecuenciaValue === '15' || frecuenciaValue === '30') {
        frecuenciaDiasNumber = Number(frecuenciaValue)
      } else if (frecuenciaValue === 'mensual') {
        frecuenciaDiasNumber = 30
      }

      if (!frecuenciaDiasNumber) {
        return toast.error('Frecuencia de pago inválida')
      }
    }

    // Construir fecha/hora
    let fechaISO = new Date().toISOString()
    if (transactionData.fechaDate) {
      const datePart = transactionData.fechaDate
      const timePart = transactionData.fechaTime || '00:00'
      try {
        const composed = new Date(`${datePart}T${timePart}:00`)
        if (!isNaN(composed.getTime())) {
          fechaISO = composed.toISOString()
        }
      } catch {}
    }

    try {
      const updatedDebt = await deudasAPI.agregarMovimiento({
         id: selectedClient.id,
         monto: amount,
         descripcion: transactionData.descripcion,
         tipo: transactionData.tipo as 'deuda' | 'pago',
         producto: transactionData.producto || '',
         fecha: fechaISO,
         cuotas: cuotasNumber,
         frecuencia: frecuenciaValue,
         frecuenciaDias: frecuenciaDiasNumber
      })

      setDeudas(deudas.map(d => d.id === selectedClient.id ? updatedDebt : d))

      setSelectedClient(null)
      setTransactionData({
        monto: '',
        descripcion: '',
        producto: '',
        fechaDate: '',
        fechaTime: '',
        tipo: 'deuda',
        cuotas: '',
        frecuencia: '30',
        frecuenciaDias: ''
      })
      toast.success('Movimiento registrado')
    } catch (error) {
      toast.error('Error al actualizar saldo')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Borrar este historial de deuda permanentemente?')) return
    try {
      await deudasAPI.eliminar(id)
      setDeudas(deudas.filter(d => d.id !== id))
      toast.success('Eliminado')
    } catch (e) {
      toast.error('Error al eliminar')
    }
  }

  async function handleSendReminder(client: Deuda) {
    if (!client.cliente_celular) {
      toast.error('No hay celular registrado para este cliente')
      return
    }

    const timing = getDebtTiming(client)
    const message = `Hola ${client.cliente_nombre}, te recordamos que tenés un saldo pendiente de $${formatPrice(client.total_deuda)} en tu cuenta de Urban CDG. Próximo vencimiento: ${timing.nextDueDate.toLocaleDateString()}.`

    const phone = client.cliente_celular.replace(/[^0-9]/g, '')
    const url = `https://wa.me/${phone}?text=${encodeURIComponent(message)}`
    if (typeof window !== 'undefined') {
      window.open(url, '_blank')
    }

    try {
      const updatedDebt = await deudasAPI.enviarRecordatorio({
        id: client.id,
        via: 'automatico',
        mensaje: message,
        fecha: new Date().toISOString()
      })

      setDeudas(deudas.map(d => d.id === client.id ? updatedDebt : d))
      toast.success('Recordatorio registrado')
    } catch (error) {
      toast.error('No se pudo registrar el recordatorio')
    }
  }

  const filteredDeudas = deudas.filter(d => 
    d.cliente_nombre.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cliente_apellido.toLowerCase().includes(searchTerm.toLowerCase()) ||
    d.cliente_dni.includes(searchTerm)
  )

  return (
    <div className="space-y-8 pb-20">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black uppercase text-white tracking-widest flex items-center gap-3">
             <DollarSign className="w-8 h-8 text-green-500" />
             Gestión de Deudas
          </h1>
          <p className="text-white/40 text-[10px] font-bold uppercase tracking-[0.2em] mt-1">Control de cuentas corrientes y fiados</p>
        </div>
        <button onClick={() => setShowForm(!showForm)} className="bg-accent text-ink px-6 py-3 rounded-xl font-black text-[10px] uppercase tracking-widest hover:brightness-110 transition-all flex items-center gap-2">
           <Plus className="w-4 h-4" />
           Nuevo Cliente
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleCreateClient} className="bg-white/[0.03] border border-white/10 p-6 rounded-2xl grid grid-cols-1 md:grid-cols-2 gap-4 animate-in slide-in-from-top-4">
           <input required placeholder="Nombre" value={formData.cliente_nombre} onChange={e => setFormData({...formData, cliente_nombre: e.target.value})} className="bg-black/20 border border-white/10 p-3 rounded-lg text-white text-sm" />
           <input placeholder="Apellido" value={formData.cliente_apellido} onChange={e => setFormData({...formData, cliente_apellido: e.target.value})} className="bg-black/20 border border-white/10 p-3 rounded-lg text-white text-sm" />
           <input placeholder="DNI" value={formData.cliente_dni} onChange={e => setFormData({...formData, cliente_dni: e.target.value})} className="bg-black/20 border border-white/10 p-3 rounded-lg text-white text-sm" />
           <input placeholder="Celular" value={formData.cliente_celular} onChange={e => setFormData({...formData, cliente_celular: e.target.value})} className="bg-black/20 border border-white/10 p-3 rounded-lg text-white text-sm" />
           <input placeholder="Dirección" value={formData.cliente_direccion} onChange={e => setFormData({...formData, cliente_direccion: e.target.value})} className="bg-black/20 border border-white/10 p-3 rounded-lg text-white text-sm col-span-1 md:col-span-2" />
           <button type="submit" className="col-span-1 md:col-span-2 bg-green-600 hover:bg-green-500 text-white font-bold py-3 rounded-lg uppercase text-xs tracking-widest transition-colors">Guardar Ficha</button>
        </form>
      )}

      {/* Main List */}
      <div className="space-y-4">
         <div className="bg-white/5 p-4 rounded-xl flex items-center gap-3 border border-white/5">
            <Search className="w-5 h-5 text-white/30" />
            <input 
               type="text" 
               placeholder="Buscar por nombre, apellido o DNI..." 
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
               className="bg-transparent outline-none text-white w-full placeholder:text-white/30 font-medium" 
            />
         </div>

         {loading ? <div className="text-center py-10 opacity-30">Cargando cuentas...</div> : (
            <div className="grid gap-4">
               {filteredDeudas.map(client => (
                 <div key={client.id} className="bg-white/[0.03] border border-white/5 rounded-2xl overflow-hidden hover:border-white/10 transition-colors">
                    <div className="p-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6 cursor-pointer" onClick={() => setExpandedId(expandedId === client.id ? null : client.id)}>
                       <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${client.total_deuda > 0 ? 'bg-red-500/20 text-red-500' : 'bg-green-500/20 text-green-500'}`}>
                             {client.cliente_nombre.charAt(0)}
                          </div>
                          <div>
                             <h3 className="font-bold text-lg text-white">{client.cliente_nombre} {client.cliente_apellido}</h3>
                             <div className="flex items-center gap-3 text-xs text-white/40 font-mono mt-1">
                                <span>{client.cliente_celular}</span>
                                <span>•</span>
                                <span>{client.cliente_dni}</span>
                             </div>
                             {client.total_deuda > 0 && (
                               <div className="flex items-center gap-2 mt-2 text-[10px] uppercase font-black tracking-widest">
                                 <span className="px-2 py-1 rounded-full bg-white/5 text-white/50 flex items-center gap-1">
                                   <Calendar className="w-3 h-3" />
                                   <span>
                                     {(() => {
                                       const t = getDebtTiming(client)
                                       if (t.estado === 'vencida') return 'Vencida'
                                       if (t.estado === 'proxima') return 'Próxima a vencer'
                                       return 'Al día'
                                     })()}
                                   </span>
                                 </span>
                               </div>
                             )}
                          </div>
                       </div>
                       
                       <div className="flex items-center gap-8 w-full md:w-auto justify-between md:justify-end">
                             <div className="text-right">
                                <p className="text-[10px] uppercase font-black tracking-widest text-white/30 mb-1">Saldo Actual</p>
                                <p className={`text-2xl font-black tracking-tighter ${client.total_deuda > 0 ? 'text-red-400' : 'text-green-400'}`}>
                                   ${formatPrice(client.total_deuda)}
                                </p>
                             </div>
                          {expandedId === client.id ? <ChevronUp className="w-5 h-5 text-white/30" /> : <ChevronDown className="w-5 h-5 text-white/30" />}
                       </div>
                    </div>

                    {/* Expandable Section */}
                    {expandedId === client.id && (
                       <div className="border-t border-white/5 bg-black/20 p-6 animate-in slide-in-from-top-2">
                          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                            {/* Data */}
                            <div className="space-y-6"> 
                               <div className="bg-white/5 p-4 rounded-xl space-y-2">
                                  <p className="text-xs text-white/50"><span className="font-bold text-white uppercase tracking-widest text-[10px] mr-2">Dirección:</span> {client.cliente_direccion || 'No registrada'}</p>
                                  <p className="text-xs text-white/50"><span className="font-bold text-white uppercase tracking-widest text-[10px] mr-2">Alta:</span> {new Date(client.created_at).toLocaleDateString()}</p>
                                  {client.total_deuda > 0 && (
                                    (() => {
                                      const timing = getDebtTiming(client)
                                      return (
                                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                                          <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Último pago</p>
                                            <p className="text-xs text-white/80">{timing.lastPaymentDate.toLocaleDateString()}</p>
                                            <p className="text-[10px] text-white/50">{formatDaysLabel(timing.daysSinceLast, 'since')}</p>
                                          </div>
                                          <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Próximo vencimiento</p>
                                            <p className="text-xs text-white/80">{timing.nextDueDate.toLocaleDateString()}</p>
                                            <p className="text-[10px] text-white/50">{formatDaysLabel(timing.daysToNext, 'until')}</p>
                                          </div>
                                          <div className="bg-black/40 rounded-lg p-2">
                                            <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Estado</p>
                                            <p className={`text-xs font-bold ${
                                              timing.estado === 'vencida'
                                                ? 'text-red-400'
                                                : timing.estado === 'proxima'
                                                ? 'text-amber-300'
                                                : 'text-green-400'
                                            }`}>
                                              {timing.estado === 'vencida'
                                                ? 'Vencida'
                                                : timing.estado === 'proxima'
                                                ? 'Próxima a vencer'
                                                : 'Al día'}
                                            </p>
                                            {timing.totalCuotas && (
                                              <p className="text-[10px] text-white/50">
                                                {timing.cuotasPagadas}/{timing.totalCuotas} cuotas pagadas
                                              </p>
                                            )}
                                          </div>
                                        </div>
                                      )
                                    })()
                                  )}
                               </div>
                                
                                <div className="flex gap-2">
                                  <button onClick={() => { setSelectedClient(client); setTransactionData({ ...transactionData, tipo: 'deuda' }) }} className="flex-1 bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors">
                                    + Agregar Compra
                                  </button>
                                  <button onClick={() => { setSelectedClient(client); setTransactionData({ ...transactionData, tipo: 'pago' }) }} className="flex-1 bg-green-500/10 hover:bg-green-500/20 text-green-400 border border-green-500/20 py-3 rounded-lg font-bold text-xs uppercase tracking-widest transition-colors">
                                   - Registrar Pago
                                  </button>
                                  {client.total_deuda > 0 && (() => {
                                    const timing = getDebtTiming(client)
                                    if (timing.estado === 'vencida' || timing.estado === 'proxima') {
                                      return (
                                        <button
                                          onClick={() => handleSendReminder(client)}
                                          className="flex items-center gap-1 px-3 bg-accent/10 border border-accent/30 text-accent rounded-lg text-[10px] font-black uppercase tracking-widest hover:bg-accent/20 transition-colors"
                                        >
                                          <MessageCircle className="w-3 h-3" />
                                          <span>Recordar</span>
                                        </button>
                                      )
                                    }
                                    return null
                                  })()}
                                  <button onClick={() => handleDelete(client.id)} className="px-4 bg-white/5 hover:bg-white/10 text-white/40 hover:text-red-400 rounded-lg transition-colors">
                                    <Trash2 className="w-5 h-5" />
                                  </button>
                                </div>

                                {selectedClient?.id === client.id && (
                                   <div className="bg-accent/10 border border-accent/20 p-4 rounded-xl mt-4 animate-in fade-in">
                                      <h4 className="font-black text-accent text-xs uppercase tracking-widest mb-3">
                                        {transactionData.tipo === 'deuda' ? 'Nueva Cuenta / Fiado' : 'Registrar Pago'}
                                      </h4>
                                      <div className="space-y-3">
                                         <input 
                                           autoFocus 
                                           type="text" 
                                           placeholder="Monto ($)" 
                                           value={transactionData.monto} 
                                           onChange={e => {
                                              const raw = e.target.value
                                              setTransactionData({...transactionData, monto: raw.replace(/[^0-9.,]/g, '')})
                                           }} 
                                           onBlur={() => {
                                              const val = toNumber(transactionData.monto)
                                              if (val > 0) {
                                                setTransactionData({...transactionData, monto: formatPrice(val)})
                                              }
                                           }}
                                           className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white font-mono" 
                                         />
                                         <input type="text" placeholder="Producto (opcional)" value={transactionData.producto} onChange={e => setTransactionData({...transactionData, producto: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
                                         <div className="grid grid-cols-2 gap-2">
                                            <input type="date" placeholder="Fecha" value={transactionData.fechaDate} onChange={e => setTransactionData({...transactionData, fechaDate: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white text-sm" />
                                            <input type="time" placeholder="Hora" value={transactionData.fechaTime} onChange={e => setTransactionData({...transactionData, fechaTime: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white text-sm" />
                                         </div>
                                         {transactionData.tipo === 'deuda' && (
                                           <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                                             <select
                                               value={transactionData.cuotas}
                                               onChange={e => setTransactionData({ ...transactionData, cuotas: e.target.value })}
                                               className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white text-sm"
                                             >
                                               <option value="">Cuotas</option>
                                               <option value="1">1 cuota</option>
                                               <option value="2">2 cuotas</option>
                                               <option value="3">3 cuotas</option>
                                               <option value="4">4 cuotas</option>
                                               <option value="5">5 cuotas</option>
                                               <option value="6">6 cuotas</option>
                                               <option value="9">9 cuotas</option>
                                               <option value="12">12 cuotas</option>
                                             </select>
                                             <div className="grid grid-cols-1 gap-2">
                                               <select
                                                 value={transactionData.frecuencia}
                                                 onChange={e => setTransactionData({ ...transactionData, frecuencia: e.target.value })}
                                                 className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white text-sm"
                                               >
                                                 <option value="15">Cada 15 días</option>
                                                 <option value="30">Cada 30 días</option>
                                                 <option value="mensual">Mensualmente</option>
                                                 <option value="custom">Personalizado</option>
                                               </select>
                                               {transactionData.frecuencia === 'custom' && (
                                                 <input
                                                   type="number"
                                                   min={1}
                                                   placeholder="Cada cuántos días"
                                                   value={transactionData.frecuenciaDias}
                                                   onChange={e => setTransactionData({ ...transactionData, frecuenciaDias: e.target.value })}
                                                   className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white text-sm"
                                                 />
                                               )}
                                             </div>
                                           </div>
                                         )}
                                         <input type="text" placeholder="Descripción (nota...)" value={transactionData.descripcion} onChange={e => setTransactionData({...transactionData, descripcion: e.target.value})} className="w-full bg-black/40 border border-white/10 p-3 rounded-lg text-white" />
                                         <div className="flex gap-2 justify-end">
                                            <button onClick={() => setSelectedClient(null)} className="text-xs text-white/50 hover:text-white px-3 py-2 font-bold uppercase">Cancelar</button>
                                            <button onClick={handleTransaction} className="bg-accent text-ink px-4 py-2 rounded-lg font-bold text-xs uppercase tracking-widest hover:brightness-110">Confirmar</button>
                                         </div>
                                      </div>
                                   </div>
                                )}
                             </div>

                             {/* History */}
                             <div className="space-y-2 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
                                <h4 className="text-[10px] font-black uppercase text-white/30 tracking-widest mb-2 sticky top-0 bg-[#05060a] py-2 z-10">Historial de Movimientos</h4>
                                {client.historial && client.historial.map((h: any, idx: number) => {
                                  if (h.tipo === 'recordatorio') {
                                    return (
                                      <div key={h.id || idx} className="grid grid-cols-4 gap-3 items-center p-3 rounded-lg border border-accent/30 bg-accent/5">
                                        <p className="text-sm font-medium text-accent truncate flex items-center gap-2">
                                          <MessageCircle className="w-4 h-4" />
                                          Recordatorio
                                        </p>
                                        <p className="text-[10px] text-white/60">{new Date(h.fecha).toLocaleString()}</p>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                          {h.via === 'automatico' ? 'Automático' : 'Manual'}
                                        </span>
                                        <p className="text-[12px] text-white/70 truncate">{h.mensaje || 'Recordatorio de pago enviado'}</p>
                                      </div>
                                    )
                                  }

                                  if (h.tipo === 'config') {
                                    return (
                                      <div key={h.id || idx} className="grid grid-cols-4 gap-3 items-center p-3 rounded-lg border border-white/10 bg-white/[0.03]">
                                        <p className="text-sm font-medium text-white truncate">Plan de pago</p>
                                        <p className="text-[10px] text-white/60">{new Date(h.created_at || h.fecha || client.created_at).toLocaleString()}</p>
                                        <span className="text-[10px] font-black uppercase tracking-widest text-white/70">
                                          {h.cuotas} cuotas
                                        </span>
                                        <p className="text-[12px] text-white/70 truncate">
                                          Frecuencia: {h.frecuencia === 'mensual' ? 'Mensual' : h.frecuencia === 'custom' ? `${h.frecuenciaDias} días` : `Cada ${h.frecuenciaDias} días`}
                                        </p>
                                      </div>
                                    )
                                  }

                                  return (
                                    <div key={h.id || idx} className="grid grid-cols-4 gap-3 items-center p-3 rounded-lg border border-white/5 bg-white/[0.02]">
                                      <p className="text-sm font-medium text-white truncate">{h.producto || '—'}</p>
                                      <p className="text-[10px] text-white/40">{new Date(h.fecha).toLocaleString()}</p>
                                      <span className={`font-mono font-bold ${h.tipo === 'deuda' ? 'text-red-400' : 'text-green-400'}`}>
                                        {h.tipo === 'deuda' ? '+' : '-'}${formatPrice(h.monto)}
                                      </span>
                                      <p className="text-[12px] text-white/70 truncate">{h.descripcion || 'Sin descripción'}</p>
                                    </div>
                                  )
                                })}
                                {(!client.historial || client.historial.length === 0) && (
                                   <p className="text-white/20 text-sm italic text-center py-4">Sin historial registrado</p>
                                )}
                             </div>
                          </div>
                       </div>
                    )}
                 </div>
               ))}
            </div>
         )}
      </div>
    </div>
  )
}
