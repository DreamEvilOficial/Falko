import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Tag, Eye, EyeOff, Save, Plus, Trash2, Edit2, X } from 'lucide-react'

interface FiltroEspecial {
  id: string
  nombre: string
  clave: string
  activo: boolean
  icono: string
  imagen_url?: string
  orden: number
  tipo?: 'categoria' | 'producto' | 'otro'
  config?: {
    contenidoTipo?: 'categorias' | 'productos' | 'otro'
    contenidoCategoriaIds?: string[]
    contenidoProductoIds?: string[]
  }
  permanente?: boolean
}

export default function SpecialFiltersManagement() {
  const [filtros, setFiltros] = useState<FiltroEspecial[]>([])
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [isCreating, setIsCreating] = useState(false)
  const [productos, setProductos] = useState<any[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [vistaPrevia, setVistaPrevia] = useState<any[] | null>(null)

  const isImageUrl = (url: string) => {
    if (!url) return false
    return url.startsWith('http') || url.startsWith('https') || url.startsWith('/') || url.includes('.gif') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.svg') || url.includes('.webp')
  }
  
  const [formData, setFormData] = useState<Partial<FiltroEspecial>>({
    nombre: '',
    clave: '',
    icono: '',
    imagen_url: '',
    activo: true,
    orden: 0,
    tipo: 'producto',
    config: {
      contenidoTipo: 'productos',
      contenidoCategoriaIds: [],
      contenidoProductoIds: []
    }
  })

  useEffect(() => {
    cargarFiltros()
    cargarProductosYCategorias()
  }, [])

  async function cargarFiltros() {
    try {
      const res = await fetch('/api/filters')
      const data = await res.json()
      setFiltros(data || [])
    } catch (error) {
      console.error('Error loading filters:', error)
      toast.error('Error al cargar filtros')
    } finally {
      setLoading(false)
    }
  }

  async function cargarProductosYCategorias() {
    try {
      const [prodRes, catRes] = await Promise.all([
        fetch('/api/products?limit=200'),
        fetch('/api/categories')
      ])

      const prodData = await prodRes.json()
      const catData = await catRes.json()

      setProductos(Array.isArray(prodData) ? prodData : [])
      setCategorias(Array.isArray(catData) ? catData : [])
    } catch (error) {
      console.error('Error loading productos/categorias:', error)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    try {
      const payload = {
        ...formData,
        config: formData.config || {
          contenidoTipo: 'productos',
          contenidoCategoriaIds: [],
          contenidoProductoIds: []
        }
      }

      if (isCreating) {
        const res = await fetch('/api/filters', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        })
        if (!res.ok) throw new Error('Error al crear')
        toast.success('Filtro creado')
      } else if (editingId) {
        const res = await fetch('/api/filters', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ ...payload, id: editingId })
        })
        if (!res.ok) throw new Error('Error al actualizar')
        toast.success('Filtro actualizado')
      }
      
      setIsCreating(false)
      setEditingId(null)
      setFormData({
        nombre: '',
        clave: '',
        icono: '',
        imagen_url: '',
        activo: true,
        orden: 0,
        tipo: 'producto',
        config: {
          contenidoTipo: 'productos',
          contenidoCategoriaIds: [],
          contenidoProductoIds: []
        }
      })
      cargarFiltros()
      window.dispatchEvent(new Event('filtros-updated'))
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function eliminarFiltro(id: string) {
    const filtro = filtros.find(f => f.id === id)
    if (filtro?.permanente) {
      toast.error('Este filtro es permanente y no puede eliminarse')
      return
    }

    if (!confirm('¿Estás seguro de eliminar este filtro? Esta acción no se puede deshacer.')) return
    try {
      const res = await fetch(`/api/filters?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      
      toast.success('Filtro eliminado')
      cargarFiltros()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  const startEdit = (filtro: FiltroEspecial) => {
    setEditingId(filtro.id)
    setFormData({
      ...filtro,
      config: filtro.config || {
        contenidoTipo: 'productos',
        contenidoCategoriaIds: [],
        contenidoProductoIds: []
      }
    })
    setIsCreating(false)
  }

  function toggleContenidoSeleccion(id: string, tipo: 'categoria' | 'producto') {
    setFormData(prev => {
      const current = prev.config || {
        contenidoTipo: tipo === 'categoria' ? 'categorias' : 'productos',
        contenidoCategoriaIds: [],
        contenidoProductoIds: []
      }

      if (tipo === 'categoria') {
        const list = new Set(current.contenidoCategoriaIds || [])
        if (list.has(id)) list.delete(id)
        else list.add(id)
        return {
          ...prev,
          config: {
            ...current,
            contenidoTipo: 'categorias',
            contenidoCategoriaIds: Array.from(list),
            contenidoProductoIds: current.contenidoProductoIds || []
          }
        }
      } else {
        const list = new Set(current.contenidoProductoIds || [])
        if (list.has(id)) list.delete(id)
        else list.add(id)
        return {
          ...prev,
          config: {
            ...current,
            contenidoTipo: 'productos',
            contenidoProductoIds: Array.from(list),
            contenidoCategoriaIds: current.contenidoCategoriaIds || []
          }
        }
      }
    })
  }

  function generarVistaPrevia() {
    if (!formData.config) {
      setVistaPrevia(null)
      return
    }

    if (formData.config.contenidoTipo === 'categorias') {
      const seleccionadas = categorias.filter(cat => formData.config?.contenidoCategoriaIds?.includes(cat.id))
      setVistaPrevia(seleccionadas)
    } else {
      const seleccionados = productos.filter(prod => formData.config?.contenidoProductoIds?.includes(prod.id))
      setVistaPrevia(seleccionados)
    }
  }

  if (loading) return <div>Cargando...</div>

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="text-2xl md:text-3xl font-bold text-white uppercase tracking-wider">Filtros Especiales</h1>
        <button
          onClick={() => { 
            setIsCreating(true); 
            setEditingId(null); 
            setVistaPrevia(null); 
            setFormData({ 
              nombre: '', 
              clave: '', 
              icono: '',
              imagen_url: '', 
              activo: true, 
              orden: filtros.length, 
              tipo: 'producto', 
              config: { 
                contenidoTipo: 'productos', 
                contenidoCategoriaIds: [], 
                contenidoProductoIds: [] 
              } 
            }); 
          }}
          className="w-full md:w-auto flex items-center justify-center gap-2 bg-white text-black px-6 py-3 rounded-xl hover:bg-gray-200 transition font-bold shadow-[0_10px_20px_-10px_rgba(255,255,255,0.3)] active:scale-95"
        >
          <Plus className="w-5 h-5" /> Nuevo Filtro
        </button>
      </div>

      {(isCreating || editingId) && (
        <form onSubmit={handleSubmit} className="bg-[#06070c]/70 backdrop-blur-md border border-white/10 rounded-xl p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="font-bold text-white">{isCreating ? 'Crear Nuevo Filtro' : 'Editar Filtro'}</h3>
            <button type="button" onClick={() => { setIsCreating(false); setEditingId(null); }} className="text-white/60 hover:text-white"><X /></button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <input
              type="text"
              placeholder="Nombre (ej: HOT SALE)"
              value={formData.nombre}
              onChange={e => setFormData({...formData, nombre: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              required
            />
            <input
              type="text"
              placeholder="Clave (ej: hot_sale)"
              value={formData.clave}
              onChange={e => setFormData({...formData, clave: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
              required
            />
            <input
              type="text"
              placeholder="Icono (emoji/texto, ej: 🔥 SALE)"
              value={formData.icono}
              onChange={e => setFormData({...formData, icono: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <input
              type="text"
              placeholder="URL de GIF o Imagen"
              value={formData.imagen_url}
              onChange={e => setFormData({...formData, imagen_url: e.target.value})}
              className="px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
            <input
              type="number"
              placeholder="Orden"
              value={formData.orden}
              onChange={e => setFormData({...formData, orden: parseInt(e.target.value)})}
              className="px-4 py-2 rounded-lg bg白/5 border border-white/10 text-white placeholder:text-white/30 focus:outline-none focus:border-white/30"
            />
          </div>
          <div className="mt-4 border-t border-white/10 pt-4 space-y-4">
            <p className="text-xs font-bold text-white/60 uppercase tracking-widest">Contenido del filtro</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...(prev.config || { contenidoCategoriaIds: [], contenidoProductoIds: [] }),
                    contenidoTipo: 'categorias'
                  }
                }))}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition ${
                  formData.config?.contenidoTipo === 'categorias'
                    ? 'bg-accent text-black border-accent'
                    : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                Categorías
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...(prev.config || { contenidoCategoriaIds: [], contenidoProductoIds: [] }),
                    contenidoTipo: 'productos'
                  }
                }))}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition ${
                  formData.config?.contenidoTipo === 'productos'
                    ? 'bg-accent text-black border-accent'
                    : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                Productos
              </button>
              <button
                type="button"
                onClick={() => setFormData(prev => ({
                  ...prev,
                  config: {
                    ...(prev.config || { contenidoCategoriaIds: [], contenidoProductoIds: [] }),
                    contenidoTipo: 'otro'
                  }
                }))}
                className={`px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest border transition ${
                  formData.config?.contenidoTipo === 'otro'
                    ? 'bg-accent text-black border-accent'
                    : 'bg-white/5 text-white/70 border-white/10'
                }`}
              >
                Otro criterio
              </button>
            </div>

            {formData.config?.contenidoTipo === 'categorias' && (
              <div className="space-y-2">
                <p className="text-[11px] text-white/60 font-medium">Seleccioná las categorías que formarán parte de este filtro</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2">
                  {categorias.map(cat => {
                    const selected = formData.config?.contenidoCategoriaIds?.includes(cat.id)
                    return (
                      <button
                        key={cat.id}
                        type="button"
                        onClick={() => toggleContenidoSeleccion(cat.id, 'categoria')}
                        className={`text-left px-3 py-2 rounded-md text-xs border transition ${
                          selected
                            ? 'bg-accent text-black border-accent'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {cat.nombre}
                      </button>
                    )
                  })}
                  {categorias.length === 0 && (
                    <p className="text-[11px] text-white/40 col-span-full">No hay categorías disponibles.</p>
                  )}
                </div>
              </div>
            )}

            {formData.config?.contenidoTipo === 'productos' && (
              <div className="space-y-2">
                <p className="text-[11px] text-white/60 font-medium">Seleccioná los productos que formarán parte de este filtro</p>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 max-h-40 overflow-y-auto border border-white/10 rounded-lg p-2">
                  {productos.map(prod => {
                    const selected = formData.config?.contenidoProductoIds?.includes(prod.id)
                    return (
                      <button
                        key={prod.id}
                        type="button"
                        onClick={() => toggleContenidoSeleccion(prod.id, 'producto')}
                        className={`text-left px-3 py-2 rounded-md text-xs border transition ${
                          selected
                            ? 'bg-accent text-black border-accent'
                            : 'bg-white/5 text-white/70 border-white/10 hover:bg-white/10'
                        }`}
                      >
                        {prod.nombre}
                      </button>
                    )
                  })}
                  {productos.length === 0 && (
                    <p className="text-[11px] text-white/40 col-span-full">No hay productos disponibles.</p>
                  )}
                </div>
              </div>
            )}

            <div className="flex justify-between items-center pt-2">
              <button
                type="button"
                onClick={generarVistaPrevia}
                className="text-xs px-3 py-1.5 rounded-md border border-white/20 text-white/70 hover:bg-white/10 transition"
              >
                Ver vista previa
              </button>
              {formData.activo && (
                <span className="text-[10px] font-black uppercase tracking-widest text-green-400 flex items-center gap-1">
                  <Eye className="w-3 h-3" />
                  Visible en tienda
                </span>
              )}
            </div>

            {vistaPrevia && (
              <div className="mt-3 border border-white/10 rounded-lg p-3 bg-black/40 max-h-40 overflow-y-auto">
                <p className="text-[10px] font-black text-white/50 uppercase tracking-widest mb-2">Vista previa</p>
                <ul className="space-y-1 text-xs text-white/80">
                  {vistaPrevia.map((item: any) => (
                    <li key={item.id} className="truncate">• {item.nombre}</li>
                  ))}
                  {vistaPrevia.length === 0 && (
                    <li className="text-white/40">Sin elementos seleccionados.</li>
                  )}
                </ul>
              </div>
            )}
          </div>
          <button type="submit" className="w-full bg-white text-black font-bold py-2 rounded-lg hover:bg-gray-200 transition">
            <Save className="w-4 h-4 inline mr-2" /> Guardar Filtro
          </button>
        </form>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filtros.map(filtro => (
          <div key={filtro.id} className={`bg-white/5 rounded-xl shadow-lg border p-6 backdrop-blur-sm ${filtro.activo ? 'border-green-500/30' : 'border-white/10'}`}>
            <div className="flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/10 rounded-lg flex items-center justify-center overflow-hidden border border-white/10">
                  {filtro.imagen_url || isImageUrl(filtro.icono) ? (
                    <img 
                      src={filtro.imagen_url || filtro.icono} 
                      alt="" 
                      className="w-full h-full object-contain"
                      onError={(e) => {
                        (e.target as HTMLImageElement).src = 'https://via.placeholder.com/48?text=Error'
                      }}
                    />
                  ) : (
                    <span className="text-2xl">{filtro.icono || '🏷️'}</span>
                  )}
                </div>
                <div>
                  <h3 className="font-bold text-white">{filtro.nombre}</h3>
                  <code className="text-xs bg-white/10 text-white/60 px-1 rounded">/{filtro.clave}</code>
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={async () => {
                    try {
                      const res = await fetch('/api/filters', {
                        method: 'PUT',
                        headers: { 'Content-Type': 'application/json' },
                        body: JSON.stringify({ ...filtro, activo: !filtro.activo })
                      })
                      if (!res.ok) throw new Error('Error al cambiar visibilidad')
                      toast.success(filtro.activo ? 'Filtro ocultado' : 'Filtro visible')
                      cargarFiltros()
                      window.dispatchEvent(new Event('filtros-updated'))
                    } catch (error: any) {
                      toast.error('Error: ' + error.message)
                    }
                  }}
                  className={`p-1 rounded ${filtro.activo ? 'text-green-400 hover:bg-green-500/20' : 'text-white/50 hover:bg-white/10'}`}
                >
                  {filtro.activo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
                <button onClick={() => startEdit(filtro)} className="p-1 hover:bg-white/10 rounded text-white/80 hover:text-white"><Edit2 className="w-4 h-4" /></button>
                <button onClick={() => eliminarFiltro(filtro.id)} className="p-1 hover:bg-red-500/20 text-red-400 rounded"><Trash2 className="w-4 h-4" /></button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
