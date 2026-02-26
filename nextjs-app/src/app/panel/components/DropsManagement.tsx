import { useState, useEffect } from 'react'
import { Plus, Edit, Trash2, Search, X, Save, Image as ImageIcon, ExternalLink, Link2 } from 'lucide-react'
import { Drop, type Producto } from '@/lib/supabase'
import toast from 'react-hot-toast'
import NextImage from 'next/image'

export default function DropsManagement() {
  const [drops, setDrops] = useState<Drop[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editingDrop, setEditingDrop] = useState<Drop | null>(null)
  const [saving, setSaving] = useState(false)
  const [linkedProducts, setLinkedProducts] = useState<Producto[]>([])
  const [allProducts, setAllProducts] = useState<Producto[]>([])
  const [loadingProducts, setLoadingProducts] = useState(false)
  const [updatingLinks, setUpdatingLinks] = useState(false)
  const [productSearch, setProductSearch] = useState('')

  // Form State
  const [formData, setFormData] = useState({
    nombre: '',
    fecha_lanzamiento: '',
    descripcion: '',
    imagen_url: ''
  })

  useEffect(() => {
    fetchDrops()
  }, [])

  async function fetchDrops() {
    try {
      setLoading(true)
      const res = await fetch('/api/drops')
      if (!res.ok) throw new Error('Error al cargar drops')
      const data = await res.json()
      setDrops(data)
    } catch (error) {
      toast.error('No se pudieron cargar los drops')
      console.error(error)
    } finally {
      setLoading(false)
    }
  }

  function handleNew() {
    setEditingDrop(null)
    setLinkedProducts([])
    setFormData({
      nombre: '',
      fecha_lanzamiento: '',
      descripcion: '',
      imagen_url: ''
    })
    setShowForm(true)
  }

  function handleEdit(drop: Drop) {
    setEditingDrop(drop)
    setFormData({
      nombre: drop.nombre,
      fecha_lanzamiento: drop.fecha_lanzamiento ? new Date(drop.fecha_lanzamiento).toISOString().slice(0, 16) : '',
      descripcion: drop.descripcion || '',
      imagen_url: drop.imagen_url || ''
    })
    loadDropProducts(drop.id)
    setShowForm(true)
  }

  async function loadDropProducts(dropId: string) {
    try {
      setLoadingProducts(true)

      const [assignedRes, allRes] = await Promise.all([
        fetch(`/api/drops/${dropId}/products`),
        allProducts.length === 0 ? fetch('/api/products?admin=true') : Promise.resolve(null as any)
      ])

      if (!assignedRes.ok) {
        const data = await assignedRes.json().catch(() => ({}))
        throw new Error(data.error || 'Error al cargar productos del drop')
      }

      const assignedData = await assignedRes.json()
      setLinkedProducts(Array.isArray(assignedData) ? assignedData : [])

      if (allRes) {
        if (!allRes.ok) {
          const data = await allRes.json().catch(() => ({}))
          throw new Error(data.error || 'Error al cargar productos')
        }
        const allData = await allRes.json()
        setAllProducts(Array.isArray(allData) ? allData : [])
      }
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'No se pudieron cargar los productos relacionados')
    } finally {
      setLoadingProducts(false)
    }
  }

  async function toggleProductOnDrop(product: Producto) {
    if (!editingDrop) return
    try {
      setUpdatingLinks(true)

      const currentIds = linkedProducts.map(p => p.id)
      const alreadyLinked = currentIds.includes(product.id)
      const newIds = alreadyLinked
        ? currentIds.filter(id => id !== product.id)
        : [...currentIds, product.id]

      const newLinked = allProducts.filter(p => newIds.includes(p.id))
      setLinkedProducts(newLinked)

      const res = await fetch(`/api/drops/${editingDrop.id}/products`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ productIds: newIds })
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Error al actualizar productos del drop')
      }

      toast.success(alreadyLinked ? 'Producto removido del drop' : 'Producto agregado al drop')
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'No se pudieron actualizar los productos del drop')
      if (editingDrop) {
        loadDropProducts(editingDrop.id)
      }
    } finally {
      setUpdatingLinks(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true)

    try {
      const url = editingDrop ? `/api/drops/${editingDrop.id}` : '/api/drops'
      const method = editingDrop ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al guardar')

      toast.success(editingDrop ? 'Drop actualizado' : 'Drop creado')
      setShowForm(false)
      fetchDrops()
    } catch (error: any) {
      toast.error(error.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Estás seguro de eliminar este Drop?')) return

    try {
      const res = await fetch(`/api/drops/${id}`, { method: 'DELETE' })
      const data = await res.json()

      if (!res.ok) throw new Error(data.error || 'Error al eliminar')

      toast.success('Drop eliminado')
      fetchDrops()
    } catch (error: any) {
      toast.error(error.message)
    }
  }

  const filteredDrops = drops.filter(d => 
    d.nombre.toLowerCase().includes(searchTerm.toLowerCase())
  )

  if (loading && !drops.length) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white/20 border-t-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="font-display text-3xl tracking-[0.08em] uppercase text-white">
          Drops <span className="text-white/40 text-base font-sans font-black tracking-[0.25em]">({drops.length})</span>
        </h1>
        <button
          onClick={handleNew}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em]">Nuevo Drop</span>
        </button>
      </div>

      {showForm ? (
        <div className="bg-[#06070c]/70 backdrop-blur-2xl p-6 rounded-[28px] border border-white/10 shadow-2xl">
          <div className="flex justify-between items-center mb-6 border-b border-white/5 pb-4">
            <h2 className="text-lg font-bold text-white uppercase tracking-wider">
              {editingDrop ? 'Editar Drop' : 'Nuevo Drop'}
            </h2>
            <button 
              onClick={() => setShowForm(false)}
              className="p-2 hover:bg-white/5 rounded-xl transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/45 uppercase tracking-[0.2em] mb-2">Nombre</label>
                  <input
                    type="text"
                    required
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent/50 transition-colors"
                    placeholder="Ej: Summer Collection 2024"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/45 uppercase tracking-[0.2em] mb-2">Fecha de Lanzamiento</label>
                  <input
                    type="datetime-local"
                    value={formData.fecha_lanzamiento}
                    onChange={e => setFormData({...formData, fecha_lanzamiento: e.target.value})}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent/50 transition-colors"
                  />
                  <p className="text-[9px] text-white/30 mt-1">Opcional. Se usará para ordenar y mostrar cuenta regresiva si corresponde.</p>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-white/45 uppercase tracking-[0.2em] mb-2">Descripción</label>
                  <textarea
                    value={formData.descripcion}
                    onChange={e => setFormData({...formData, descripcion: e.target.value})}
                    rows={4}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent/50 transition-colors resize-none"
                    placeholder="Descripción del drop..."
                  />
                </div>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-white/45 uppercase tracking-[0.2em] mb-2">Imagen URL</label>
                  <div className="flex gap-2">
                    <input
                      type="url"
                      value={formData.imagen_url}
                      onChange={e => setFormData({...formData, imagen_url: e.target.value})}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 text-white outline-none focus:border-accent/50 transition-colors"
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="aspect-video bg-white/5 border border-white/10 rounded-xl flex items-center justify-center overflow-hidden relative group">
                  {formData.imagen_url ? (
                    <>
                      <img 
                        src={formData.imagen_url} 
                        alt="Preview" 
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.style.display = 'none')}
                      />
                      <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                         <p className="text-white text-xs font-bold">Vista Previa</p>
                      </div>
                    </>
                  ) : (
                    <div className="text-center p-6">
                      <ImageIcon className="w-8 h-8 text-white/20 mx-auto mb-2" />
                      <p className="text-[10px] text-white/30 font-bold uppercase tracking-widest">Sin imagen</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end pt-4 border-t border-white/5">
              <button
                type="submit"
                disabled={saving}
                className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-xl font-bold hover:bg-white/90 transition-colors disabled:opacity-50"
              >
                {saving ? (
                  <span className="w-4 h-4 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                ) : (
                  <Save className="w-4 h-4" />
                )}
                <span>{editingDrop ? 'Guardar Cambios' : 'Crear Drop'}</span>
              </button>
            </div>
          </form>

          {editingDrop && (
            <div className="mt-8 border-t border-white/10 pt-6 space-y-4">
              <div className="flex items-center justify-between gap-4">
                <div>
                  <p className="text-[10px] font-black uppercase tracking-[0.25em] text-white/40">
                    Productos asociados
                  </p>
                  <p className="text-xs text-white/50">
                    Gestioná qué productos pertenecen a este drop. Los cambios se guardan en tiempo real.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Search className="w-4 h-4 text-white/40" />
                  <input
                    type="text"
                    placeholder="Buscar producto por nombre o SKU..."
                    value={productSearch}
                    onChange={(e) => setProductSearch(e.target.value)}
                    className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none focus:border-accent/60 transition-colors w-56"
                  />
                </div>
              </div>

              {loadingProducts ? (
                <div className="flex items-center gap-3 text-xs text-white/60">
                  <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                  Cargando productos del drop...
                </div>
              ) : (
                <>
                  {linkedProducts.length === 0 && (
                    <div className="text-[11px] text-white/40 bg-white/5 border border-dashed border-white/10 rounded-2xl px-4 py-3">
                      Este drop todavía no tiene productos asignados.
                    </div>
                  )}

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-80 overflow-y-auto custom-scrollbar pr-2">
                    {allProducts
                      .filter((p) => {
                        if (!productSearch.trim()) return true
                        const term = productSearch.toLowerCase()
                        return (
                          p.nombre.toLowerCase().includes(term) ||
                          (p.sku || '').toLowerCase().includes(term)
                        )
                      })
                      .map((product) => {
                        const isLinked = linkedProducts.some((p) => p.id === product.id)
                        const firstImage =
                          (Array.isArray(product.imagenes) && product.imagenes[0]) ||
                          product.imagen_url ||
                          ''

                        return (
                          <div
                            key={product.id}
                            className={`flex items-center gap-3 rounded-2xl border px-3 py-2.5 text-xs transition-all ${
                              isLinked
                                ? 'border-accent/60 bg-accent/10'
                                : 'border-white/10 bg-white/[0.03] hover:border-white/20'
                            }`}
                          >
                            <div className="w-10 h-10 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                              {firstImage ? (
                                <img
                                  src={firstImage}
                                  alt={product.nombre}
                                  className="w-full h-full object-cover"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none'
                                  }}
                                />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-white/20 text-[10px]">
                                  SIN IMG
                                </div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-bold text-white truncate text-xs">
                                {product.nombre}
                              </p>
                              <p className="text-[10px] text-white/45 font-mono truncate">
                                {product.sku || 'SIN-SKU'}
                              </p>
                            </div>
                            <div className="flex flex-col gap-1 items-end">
                              <button
                                type="button"
                                onClick={() => toggleProductOnDrop(product)}
                                disabled={updatingLinks}
                                className={`px-2.5 py-1 rounded-lg text-[10px] font-black uppercase tracking-[0.18em] transition-colors ${
                                  isLinked
                                    ? 'bg-white/10 text-accent border border-accent/50 hover:bg-white/20'
                                    : 'bg-accent text-ink border border-accent hover:brightness-95'
                                } disabled:opacity-50`}
                              >
                                {isLinked ? 'Quitar' : 'Agregar'}
                              </button>
                              {product.slug && (
                                <a
                                  href={`/productos/${product.slug}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[9px] text-white/45 hover:text-white/80 transition-colors"
                                >
                                  <ExternalLink className="w-3 h-3" />
                                  Ver en tienda
                                </a>
                              )}
                            </div>
                          </div>
                        )
                      })}
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      ) : (
        <>
          <div className="relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/45 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar drops..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full md:w-96 pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredDrops.map(drop => (
              <div key={drop.id} className="bg-[#06070c]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl group hover:border-white/20 transition-all">
                <div className="flex items-start gap-4">
                  <div className="h-16 w-16 rounded-xl overflow-hidden bg-white/5 flex-shrink-0 relative">
                    {drop.imagen_url ? (
                       <img src={drop.imagen_url} alt={drop.nombre} className="w-full h-full object-cover" />
                    ) : (
                       <div className="w-full h-full flex items-center justify-center text-white/20">
                         <ImageIcon className="w-6 h-6" />
                       </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-white truncate">{drop.nombre}</h3>
                    <p className="text-[10px] font-mono text-white/40 mt-1 truncate">/{drop.slug}</p>
                    {drop.fecha_lanzamiento && (
                      <p className="text-[10px] text-accent mt-2 font-bold uppercase tracking-wider">
                        {new Date(drop.fecha_lanzamiento).toLocaleDateString()}
                      </p>
                    )}
                  </div>
                  <div className="flex flex-col gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={() => handleEdit(drop)}
                      className="p-2 bg-white/5 hover:bg-white/10 rounded-lg text-white/70 hover:text-white transition-colors"
                    >
                      <Edit className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={() => handleDelete(drop.id)}
                      className="p-2 bg-white/5 hover:bg-red-500/20 rounded-lg text-white/70 hover:text-red-400 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
            
            {!filteredDrops.length && (
              <div className="col-span-full py-12 text-center text-white/30 text-sm font-bold">
                No se encontraron drops
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
