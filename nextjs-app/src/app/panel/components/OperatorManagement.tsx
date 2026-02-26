import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { UserPlus, Shield, Trash2, Edit2, Check, X, ShieldAlert } from 'lucide-react'

interface Operator {
  id: string
  nombre: string
  usuario: string
  rol: string
  permiso_categorias: boolean
  permiso_productos: boolean
  permiso_configuracion: boolean
  permiso_ordenes: boolean
  activo: boolean
}

export default function OperatorManagement() {
  const [operators, setOperators] = useState<Operator[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  
  // Note: Editing is not fully implemented in UI as per original code, but we keep state support
  const [editingId, setEditingId] = useState<string | null>(null)

  const [formData, setFormData] = useState<any>({
    nombre: '',
    usuario: '',
    contrasena: '',
    rol: 'staff',
    permiso_categorias: false,
    permiso_productos: false,
    permiso_configuracion: false,
    permiso_ordenes: false,
    activo: true
  })

  useEffect(() => {
    fetchOperators()
  }, [])

  async function fetchOperators() {
    try {
      const res = await fetch('/api/operators')
      if (!res.ok) throw new Error('Failed to load')
      const data = await res.json()
      setOperators(data || [])
    } catch (error: any) {
      toast.error('Error cargando operadores')
    } finally {
      setLoading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      if (isCreating) {
        const res = await fetch('/api/operators', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData)
        })
        const data = await res.json()
        if (!res.ok) throw new Error(data.error || 'Error creating user')

        toast.success('Operador creado')
      } else if (editingId) {
        // Not exposed in UI currently but logic remains
        const res = await fetch('/api/operators', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...formData, id: editingId })
        })
        if (!res.ok) throw new Error('Error updating user')
            
        toast.success('Operador actualizado')
      }
      setIsCreating(false)
      setEditingId(null)
      fetchOperators()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function togglePermission(operatorId: string, field: string, value: boolean) {
    try {
      // Optimistic update
      setOperators(prev => prev.map(op => op.id === operatorId ? { ...op, [field]: value } : op))

      const res = await fetch('/api/operators', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: operatorId, [field]: value })
      })

      if (!res.ok) {
          // Revert on error
          fetchOperators()
          throw new Error('Failed update')
      }
      
      toast.success('Permiso actualizado')
    } catch (error: any) {
      toast.error('Error al actualizar permiso')
    }
  }

  if (loading) return <div className="p-8 text-center text-white">Cargando operadores...</div>

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold flex items-center gap-2 text-white">
          <Shield className="w-6 h-6" /> Gestión de Operadores
        </h1>
        <button 
          onClick={() => setIsCreating(true)}
          className="bg-white text-black px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-gray-200 transition font-bold"
        >
          <UserPlus className="w-4 h-4" /> Nuevo Operador
        </button>
      </div>

      {isCreating && (
        <form onSubmit={handleSubmit} className="bg-[#06070c]/70 backdrop-blur-md p-6 rounded-xl border border-white/10 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white">Datos del Nuevo Operador</h3>
            <button type="button" onClick={() => setIsCreating(false)} className="text-white/60 hover:text-white"><X /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input 
              type="text" placeholder="Nombre completo" className="p-2 border border-white/10 bg-white/5 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" required
              onChange={e => setFormData({...formData, nombre: e.target.value})}
            />
            <input 
              type="text" placeholder="Nombre de Usuario" className="p-2 border border-white/10 bg-white/5 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" required
              onChange={e => setFormData({...formData, usuario: e.target.value})}
            />
            <input 
              type="password" placeholder="Contraseña" className="p-2 border border-white/10 bg-white/5 rounded-lg text-white placeholder:text-white/30 focus:outline-none focus:border-white/30" required
              onChange={e => setFormData({...formData, contrasena: e.target.value})}
            />
          </div>
          <div className="bg-white/5 border border-white/10 p-4 rounded-lg space-y-2">
            <p className="text-sm font-bold text-white/70">Permisos iniciales:</p>
            <div className="flex flex-wrap gap-4 text-white">
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" onChange={e => setFormData({...formData, permiso_categorias: e.target.checked})} className="accent-white" /> Gestión de catálogo
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" onChange={e => setFormData({...formData, permiso_productos: e.target.checked})} className="accent-white" /> Operación y ventas
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" onChange={e => setFormData({...formData, permiso_ordenes: e.target.checked})} className="accent-white" /> Venta administrativa
              </label>
              <label className="flex items-center gap-2 text-sm cursor-pointer">
                <input type="checkbox" onChange={e => setFormData({...formData, permiso_configuracion: e.target.checked})} className="accent-white" /> Configuración
              </label>
            </div>
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-gray-200 transition">Guardar Operador</button>
        </form>
      )}

      <div className="bg-[#06070c]/70 backdrop-blur-md rounded-xl shadow-lg border border-white/10 overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-white/5 border-b border-white/10">
              <th className="p-4 font-semibold text-sm text-white/70">Operador</th>
              <th className="p-4 font-semibold text-sm text-white/70">Catálogo</th>
              <th className="p-4 font-semibold text-sm text-white/70">Ventas</th>
              <th className="p-4 font-semibold text-sm text-white/70">Venta Admin</th>
              <th className="p-4 font-semibold text-sm text-white/70">Config</th>
              <th className="p-4 font-semibold text-sm text-right text-white/70">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {operators.map(op => (
              <tr key={op.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                <td className="p-4">
                  <div className="font-bold text-white">{op.nombre}</div>
                  <div className="text-xs text-white/40">@{op.usuario}</div>
                  {op.rol === 'admin' && <span className="text-[10px] bg-red-500/20 text-red-300 px-1 rounded uppercase font-bold border border-red-500/30">Principal</span>}
                </td>
                <td className="p-4">
                  <PermissionToggle active={op.permiso_categorias} onClick={(v) => togglePermission(op.id, 'permiso_categorias', v)} disabled={op.rol === 'admin'} />
                </td>
                <td className="p-4">
                  <PermissionToggle active={op.permiso_productos} onClick={(v) => togglePermission(op.id, 'permiso_productos', v)} disabled={op.rol === 'admin'} />
                </td>
                <td className="p-4">
                  <PermissionToggle active={op.permiso_ordenes} onClick={(v) => togglePermission(op.id, 'permiso_ordenes', v)} disabled={op.rol === 'admin'} />
                </td>
                <td className="p-4">
                  <PermissionToggle active={op.permiso_configuracion} onClick={(v) => togglePermission(op.id, 'permiso_configuracion', v)} disabled={op.rol === 'admin'} />
                </td>
                <td className="p-4 text-right">
                   {op.rol !== 'admin' && (
                     <button className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg transition" onClick={() => toast.error('Función no implementada')}>
                       <Trash2 className="w-4 h-4" />
                     </button>
                   )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function PermissionToggle({ active, onClick, disabled }: { active: boolean, onClick: (v: boolean) => void, disabled?: boolean }) {
  return (
    <button 
      disabled={disabled}
      onClick={() => onClick(!active)}
      className={`p-1.5 rounded-full transition ${disabled ? 'opacity-30 grayscale cursor-not-allowed' : ''} ${active ? 'bg-green-500/20 text-green-400 border border-green-500/30' : 'bg-white/10 text-white/20 hover:bg-white/20'}`}
    >
      {active ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
    </button>
  )
}
