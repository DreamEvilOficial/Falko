'use client'

import { useState, useEffect } from 'react'
import { cuponesAPI, type Cupon } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { 
  Plus, Edit2, Trash2, Tag, 
  Calendar, Info, Save, X, 
  CheckCircle2, AlertCircle, TrendingDown,
  Percent, DollarSign, Users,
  Eye, EyeOff
} from 'lucide-react'
import { formatPrice } from '@/lib/formatters'

export default function CouponManagement() {
  const [cupones, setCupones] = useState<Cupon[]>([])
  const [loading, setLoading] = useState(true)
  const [editingCupon, setEditingCupon] = useState<Partial<Cupon> | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    cargarCupones()
  }, [])

  async function cargarCupones() {
    try {
      setLoading(true)
      const data = await cuponesAPI.listar()
      setCupones(data || [])
    } catch (error) {
      console.error('Error al cargar cupones:', error)
      toast.error('No se pudieron cargar los cupones')
    } finally {
      setLoading(false)
    }
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault()
    if (!editingCupon?.codigo || !editingCupon?.valor) {
      toast.error('Código y valor son obligatorios')
      return
    }

    try {
      setSaving(true)
      if (editingCupon.id) {
        await cuponesAPI.actualizar(editingCupon.id, editingCupon)
        toast.success('Cupón actualizado')
      } else {
        await cuponesAPI.crear(editingCupon)
        toast.success('Cupón creado')
      }
      setShowForm(false)
      setEditingCupon(null)
      cargarCupones()
    } catch (error: any) {
      toast.error(error.message || 'Error al guardar cupón')
    } finally {
      setSaving(false)
    }
  }

  async function handleToggleStatus(cupon: Cupon) {
    try {
      await cuponesAPI.actualizar(cupon.id, { activo: !cupon.activo })
      toast.success(cupon.activo ? 'Cupón desactivado' : 'Cupón activado')
      cargarCupones()
    } catch (error) {
      toast.error('Error al cambiar estado')
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este cupón?')) return
    try {
      await cuponesAPI.eliminar(id)
      toast.success('Cupón eliminado')
      cargarCupones()
    } catch (error) {
      toast.error('Error al eliminar cupón')
    }
  }

  const isExpired = (cupon: Cupon) => {
    if (!cupon.valido_hasta) return false
    return new Date(cupon.valido_hasta) < new Date()
  }

  const isFull = (cupon: Cupon) => {
    if (!cupon.max_uso_total) return false
    return (cupon.usos_actuales || 0) >= cupon.max_uso_total
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="w-10 h-10 border-2 border-white/15 border-t-accent rounded-full animate-spin"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="font-display text-2xl md:text-3xl tracking-[0.08em] uppercase text-white flex items-center gap-3">
            Cupones <span className="text-white/40 text-xs md:text-base font-sans font-black tracking-[0.25em]">/ Descuentos</span>
          </h1>
          <p className="text-white/45 text-xs md:text-sm mt-1">Gestioná códigos de descuento para tus clientes</p>
        </div>
        <button
          onClick={() => {
            setEditingCupon({
              codigo: '',
              tipo: 'porcentaje',
              valor: 0,
              activo: true,
              minimo_compra: 0
            })
            setShowForm(true)
          }}
          className="flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-2xl hover:bg-gray-200 transition font-black uppercase text-[11px] tracking-widest shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <Plus className="w-4 h-4" /> Nuevo Cupón
        </button>
      </div>

      {/* Stats Quick View */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-white/40 mb-1">Total Cupones</p>
          <p className="text-2xl font-black text-white">{cupones.length}</p>
        </div>
        <div className="bg-emerald-500/10 border border-emerald-500/20 p-5 rounded-[24px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-emerald-400 opacity-70 mb-1">Activos</p>
          <p className="text-2xl font-black text-white">{cupones.filter(c => c.activo && !isExpired(c) && !isFull(c)).length}</p>
        </div>
        <div className="bg-amber-500/10 border border-amber-500/20 p-5 rounded-[24px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 opacity-70 mb-1">Vencidos/Llenos</p>
          <p className="text-2xl font-black text-white">{cupones.filter(c => isExpired(c) || isFull(c)).length}</p>
        </div>
        <div className="bg-sky-500/10 border border-sky-500/20 p-5 rounded-[24px]">
          <p className="text-[10px] font-black uppercase tracking-widest text-sky-400 opacity-70 mb-1">Usos Totales</p>
          <p className="text-2xl font-black text-white">{cupones.reduce((acc, c) => acc + (c.usos_actuales || 0), 0)}</p>
        </div>
      </div>

      {/* Lista de Cupones */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {cupones.length > 0 ? (
          cupones.map((cupon) => (
            <div 
              key={cupon.id}
              className={`group bg-[#06070c]/70 backdrop-blur-2xl border ${cupon.activo && !isExpired(cupon) && !isFull(cupon) ? 'border-white/10' : 'border-red-500/20 bg-red-500/[0.02]'} p-6 rounded-[32px] hover:border-white/20 transition-all shadow-[0_30px_100px_-80px_rgba(0,0,0,0.8)] relative overflow-hidden`}
            >
              {/* Status Badge */}
              <div className="absolute top-4 right-4 flex gap-2">
                <button 
                  onClick={() => handleToggleStatus(cupon)}
                  className={`p-2 rounded-xl transition-all ${cupon.activo ? 'bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20' : 'bg-white/5 text-white/30 hover:bg-white/10'}`}
                >
                  {cupon.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              </div>

              <div className="flex items-center gap-4 mb-6">
                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${cupon.activo ? 'bg-accent/10 text-accent' : 'bg-white/5 text-white/20'}`}>
                  <Tag className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight uppercase">{cupon.codigo}</h3>
                  <p className="text-[10px] font-black text-white/40 uppercase tracking-widest">{cupon.descripcion || 'Sin descripción'}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
                    {cupon.tipo === 'porcentaje' ? <Percent className="w-3 h-3" /> : <DollarSign className="w-3 h-3" />} Valor
                  </p>
                  <p className="text-lg font-black text-white">
                    {cupon.tipo === 'porcentaje' ? `${cupon.valor}%` : `$ ${formatPrice(cupon.valor)}`}
                  </p>
                </div>
                <div className="bg-white/5 rounded-2xl p-3 border border-white/5">
                  <p className="text-[9px] font-black text-white/30 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Users className="w-3 h-3" /> Usos
                  </p>
                  <p className="text-lg font-black text-white">
                    {cupon.usos_actuales || 0}
                    <span className="text-white/30 text-xs ml-1">/{cupon.max_uso_total || '∞'}</span>
                  </p>
                </div>
              </div>

              {/* Validity Info */}
              <div className="space-y-2 mb-6">
                {cupon.minimo_compra! > 0 && (
                  <div className="flex items-center gap-2 text-[10px] font-bold text-white/50">
                    <AlertCircle className="w-3 h-3" />
                    Mínimo compra: ${formatPrice(cupon.minimo_compra!)}
                  </div>
                )}
                <div className="flex items-center gap-2 text-[10px] font-bold text-white/50">
                  <Calendar className="w-3 h-3" />
                  {cupon.valido_hasta ? `Vence: ${new Date(cupon.valido_hasta).toLocaleDateString()}` : 'Sin vencimiento'}
                </div>
                {isExpired(cupon) && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-red-400 uppercase tracking-widest mt-2 bg-red-400/10 px-3 py-1.5 rounded-lg border border-red-400/20">
                    <X className="w-3 h-3" /> Cupón vencido
                  </div>
                )}
                {isFull(cupon) && (
                  <div className="flex items-center gap-2 text-[10px] font-black text-amber-400 uppercase tracking-widest mt-2 bg-amber-400/10 px-3 py-1.5 rounded-lg border border-amber-400/20">
                    <TrendingDown className="w-3 h-3" /> Límite alcanzado
                  </div>
                )}
              </div>

              <div className="flex gap-2 border-t border-white/5 pt-4">
                <button 
                  onClick={() => { setEditingCupon(cupon); setShowForm(true); }}
                  className="flex-1 py-3 bg-white/[0.05] hover:bg-white/[0.1] text-[10px] font-black uppercase tracking-widest text-white/70 hover:text-white rounded-xl transition-all flex items-center justify-center gap-2 border border-white/5"
                >
                  <Edit2 className="w-3 h-3" /> Editar
                </button>
                <button 
                  onClick={() => handleDelete(cupon.id)}
                  className="w-12 h-12 flex items-center justify-center bg-red-500/10 hover:bg-red-500 text-red-500 hover:text-white rounded-xl transition-all opacity-40 hover:opacity-100 border border-red-500/20"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))
        ) : (
          <div className="col-span-full py-20 text-center bg-[#06070c]/70 rounded-[40px] border border-dashed border-white/10">
            <Info className="w-12 h-12 text-white/20 mx-auto mb-4" />
            <p className="text-white/40 font-black uppercase tracking-widest text-sm">No hay cupones creados</p>
            <button 
              onClick={() => { setEditingCupon({ codigo: '', tipo: 'porcentaje', valor: 0, activo: true }); setShowForm(true); }}
              className="mt-6 text-accent hover:underline font-black uppercase text-[10px] tracking-widest"
            >
              Creá el primero ahora
            </button>
          </div>
        )}
      </div>

      {/* Form Modal */}
      {showForm && editingCupon && (
        <div className="fixed inset-0 bg-black/95 backdrop-blur-xl flex items-center justify-center z-[110] p-4 sm:p-6 animate-in fade-in duration-300">
          <div className="bg-[#05060a] border border-white/10 w-full max-w-xl rounded-[40px] overflow-hidden flex flex-col shadow-2xl relative">
            {/* Header Form */}
            <div className="p-8 border-b border-white/10 flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-black text-white uppercase tracking-tight">
                  {editingCupon.id ? 'Editar Cupón' : 'Nuevo Cupón'}
                </h2>
                <p className="text-[10px] text-white/40 font-black uppercase tracking-widest mt-1">Configuración de descuento</p>
              </div>
              <button onClick={() => setShowForm(false)} className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center hover:bg-white/10 text-white/50 transition-all active:scale-95">
                <X className="w-6 h-6" />
              </button>
            </div>

            <form onSubmit={handleSave} className="p-8 space-y-6 overflow-y-auto max-h-[70vh] custom-scrollbar">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Código del Cupón</label>
                  <input
                    type="text"
                    required
                    placeholder="EJ: VERANO2026"
                    value={editingCupon.codigo}
                    onChange={e => setEditingCupon({ ...editingCupon, codigo: e.target.value.toUpperCase() })}
                    className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-black uppercase tracking-wider transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Tipo de Descuento</label>
                  <select
                    value={editingCupon.tipo}
                    onChange={e => setEditingCupon({ ...editingCupon, tipo: e.target.value as any })}
                    className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-bold transition-all appearance-none"
                  >
                    <option value="porcentaje">Porcentaje (%)</option>
                    <option value="fijo">Monto Fijo ($)</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Valor del beneficio</label>
                  <div className="relative">
                    <input
                      type="number"
                      required
                      min="0"
                      value={editingCupon.valor}
                      onChange={e => setEditingCupon({ ...editingCupon, valor: parseFloat(e.target.value) })}
                      className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-black transition-all"
                    />
                    <div className="absolute right-5 top-1/2 -translate-y-1/2 text-white/30 font-black">
                      {editingCupon.tipo === 'porcentaje' ? '%' : '$'}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Compra Mínima</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCupon.minimo_compra || ''}
                    onChange={e => setEditingCupon({ ...editingCupon, minimo_compra: parseFloat(e.target.value) || 0 })}
                    placeholder="0"
                    className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Límite de usos totales</label>
                  <input
                    type="number"
                    min="0"
                    value={editingCupon.max_uso_total || ''}
                    onChange={e => setEditingCupon({ ...editingCupon, max_uso_total: parseInt(e.target.value) || undefined })}
                    placeholder="Ilimitado"
                    className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-black transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Fecha de vencimiento</label>
                  <input
                    type="date"
                    value={editingCupon.valido_hasta ? new Date(editingCupon.valido_hasta).toISOString().split('T')[0] : ''}
                    onChange={e => setEditingCupon({ ...editingCupon, valido_hasta: e.target.value })}
                    className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-bold transition-all"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black text-white/40 uppercase tracking-widest ml-1">Descripción corta</label>
                <input
                  type="text"
                  placeholder="Ej: Promo de bienvenida"
                  value={editingCupon.descripcion || ''}
                  onChange={e => setEditingCupon({ ...editingCupon, descripcion: e.target.value })}
                  className="w-full bg-white/[0.03] border border-white/10 px-5 py-4 rounded-2xl outline-none focus:border-accent/50 text-white font-bold transition-all"
                />
              </div>

              <div className="flex items-center gap-3 p-4 bg-white/[0.03] border border-white/5 rounded-2xl cursor-pointer select-none"
                   onClick={() => setEditingCupon({...editingCupon!, activo: !editingCupon!.activo})}>
                <div className={`w-10 h-6 rounded-full relative transition-all ${editingCupon.activo ? 'bg-accent shadow-[0_0_15px_rgba(183,255,42,0.4)]' : 'bg-white/10'}`}>
                   <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all shadow-md ${editingCupon.activo ? 'right-1' : 'left-1'}`} />
                </div>
                <div>
                   <p className="text-xs font-black text-white uppercase tracking-widest">Activo</p>
                   <p className="text-[9px] text-white/40 font-medium tracking-wide">¿Este cupón puede usarse ahora?</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={saving}
                className="w-full bg-accent text-ink font-black py-5 rounded-[24px] flex items-center justify-center gap-3 hover:translate-y-[-2px] transition-all shadow-[0_20px_60px_-15px_rgba(183,255,42,0.4)] disabled:opacity-50"
              >
                {saving ? (
                  <div className="w-5 h-5 border-2 border-ink/20 border-t-ink rounded-full animate-spin" />
                ) : (
                  <>
                    <Save className="w-5 h-5" />
                    <span className="uppercase tracking-widest text-sm">Guardar Cupón</span>
                  </>
                )}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
