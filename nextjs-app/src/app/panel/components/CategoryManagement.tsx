import { useState, useEffect } from 'react'
import { supabase, categoriasAPI } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Plus, Edit, Trash2, Save, X } from 'lucide-react'
import IconSelector, { CategoryIcon } from '@/components/IconSelector'

interface Categoria {
  id: string
  nombre: string
  slug: string
  icono?: string
  orden: number
  subcategorias?: Subcategoria[]
}

interface Subcategoria {
  id: string
  categoria_id: string
  nombre: string
  slug: string
  orden: number
}

export default function CategoryManagement() {
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [loading, setLoading] = useState(true)
  const [showCategoryForm, setShowCategoryForm] = useState(false)
  const [showSubcategoryForm, setShowSubcategoryForm] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Categoria | null>(null)
  const [selectedCategoryForSub, setSelectedCategoryForSub] = useState<string>('')
  const [showIconSelector, setShowIconSelector] = useState(false)

  const [categoryForm, setCategoryForm] = useState({
    nombre: '',
    icono: 'Tag',
    usarIcono: false,
    titulo_navegador: ''
  })

  const [subcategoryForm, setSubcategoryForm] = useState({
    nombre: '',
    categoria_id: ''
  })

  useEffect(() => {
    cargarCategorias()
  }, [])

  async function cargarCategorias() {
    try {
      // Use the API client or fetch directly
      const res = await fetch('/api/categories')
      const data = await res.json()
      // Subcategories are nested in the API response logic we implemented previously or we need to fetch them.
      // Assuming /api/categories returns nested subcategories logic is implemented in the API.
      // If not, we might need to adjust the API. Let's assume standard behavior for now from previous steps.
      setCategorias(data || [])
    } catch (error) {
      console.error('Error loading categories:', error)
      toast.error('Error al cargar categorías')
    } finally {
      setLoading(false)
    }
  }

  async function handleSaveCategory() {
    if (!categoryForm.nombre.trim()) {
      toast.error('Ingresa un nombre para la categoría')
      return
    }

    try {
      const slug = categoryForm.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      if (editingCategory) {
        const res = await fetch('/api/categories', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                id: editingCategory.id,
                nombre: categoryForm.nombre,
                slug,
                icono: categoryForm.usarIcono ? categoryForm.icono : null
            })
        })
        if (!res.ok) throw new Error('Error al actualizar')

        toast.success('Categoría actualizada')
        if (categoryForm.titulo_navegador.trim()) {
             await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clave: `categoria_title_${slug}`, valor: categoryForm.titulo_navegador.trim() })
            })
        }
      } else {
        const res = await fetch('/api/categories', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                nombre: categoryForm.nombre,
                slug,
                icono: categoryForm.usarIcono ? categoryForm.icono : null,
                activo: true,
                orden: categorias.length
            })
        })
        if (!res.ok) throw new Error('Error al crear')

        toast.success('Categoría creada')
        if (categoryForm.titulo_navegador.trim()) {
             await fetch('/api/config', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ clave: `categoria_title_${slug}`, valor: categoryForm.titulo_navegador.trim() })
            })
        }
      }

      setCategoryForm({ nombre: '', icono: 'Tag', usarIcono: false, titulo_navegador: '' })
      setEditingCategory(null)
      setShowCategoryForm(false)
      cargarCategorias()
      window.dispatchEvent(new Event('categorias-updated'))
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function handleSaveSubcategory() {
    if (!subcategoryForm.nombre.trim() || !subcategoryForm.categoria_id) {
      toast.error('Completa todos los campos')
      return
    }

    try {
      const slug = subcategoryForm.nombre.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, '')

      const res = await fetch('/api/categories/sub', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              categoria_id: subcategoryForm.categoria_id,
              nombre: subcategoryForm.nombre,
              slug,
              activo: true,
              orden: 0
          })
      })
      if (!res.ok) throw new Error('Error al crear subcategoría')

      toast.success('Subcategoría creada')
      setSubcategoryForm({ nombre: '', categoria_id: '' })
      setShowSubcategoryForm(false)
      setSelectedCategoryForSub('')
      cargarCategorias()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function handleDeleteCategory(id: string) {
    if (!confirm('¿Eliminar esta categoría? Esto también eliminará todas sus subcategorías.')) return

    try {
      const res = await fetch(`/api/categories?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')

      toast.success('Categoría eliminada')
      cargarCategorias()
      window.dispatchEvent(new Event('categorias-updated'))
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function handleDeleteSubcategory(id: string) {
    if (!confirm('¿Eliminar esta subcategoría?')) return

    try {
      const res = await fetch(`/api/categories/sub?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar subcategoría')

      toast.success('Subcategoría eliminada')
      cargarCategorias()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/15 border-t-accent"></div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center gap-4">
        <h1 className="font-display text-2xl md:text-3xl tracking-[0.08em] uppercase text-white truncate">Categorías</h1>
        <button
          onClick={() => {
            setCategoryForm({ nombre: '', icono: 'Tag', usarIcono: false, titulo_navegador: '' })
            setEditingCategory(null)
            setShowCategoryForm(true)
          }}
          className="flex-shrink-0 flex items-center gap-2 px-4 py-3 md:px-5 md:py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
        >
          <Plus className="w-5 h-5 md:w-4 md:h-4" />
          <span className="hidden md:inline text-[10px] font-black uppercase tracking-[0.28em]">Nueva Categoría</span>
          <span className="md:hidden text-[10px] font-black uppercase tracking-[0.28em]">Nueva</span>
        </button>
      </div>

      {/* Formulario de Categoría */}
      {showCategoryForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#06070c] w-full max-w-lg rounded-[28px] shadow-2xl border border-white/10 p-6 max-h-[90vh] overflow-y-auto custom-scrollbar">
              <div className="flex justify-between items-center mb-6">
                <h2 className="font-display text-xl tracking-[0.08em] uppercase text-white">
                  {editingCategory ? 'Editar Categoría' : 'Nueva Categoría'}
                </h2>
                <button onClick={() => setShowCategoryForm(false)} className="p-2 bg-white/5 rounded-xl text-white/45 hover:text-white transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-5">
            <div>
              <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Nombre</label>
              <input
                type="text"
                value={categoryForm.nombre}
                onChange={e => setCategoryForm({ ...categoryForm, nombre: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
                placeholder="Ej: Remeras"
              />
            </div>

            <div>
              <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Título navegador (opcional)</label>
              <input
                type="text"
                value={categoryForm.titulo_navegador}
                onChange={e => setCategoryForm({ ...categoryForm, titulo_navegador: e.target.value })}
                className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
                placeholder="Ej: Remerotas / Urban Indumentaria"
              />
              <p className="text-xs text-white/40 mt-2 font-bold">Se mostrará al entrar a la categoría (lado del favicon).</p>
            </div>

            <div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={categoryForm.usarIcono}
                  onChange={e => setCategoryForm({ ...categoryForm, usarIcono: e.target.checked })}
                  className="w-4 h-4 rounded border-white/15 bg-white/[0.03] text-accent focus:ring-accent focus:ring-offset-0"
                />
                <span className="text-sm font-bold text-white/80">Agregar icono a esta categoría</span>
              </label>
            </div>

            {categoryForm.usarIcono && (
              <div>
                <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Icono</label>
                <div className="flex items-center gap-4">
                  <button
                    type="button"
                    onClick={() => setShowIconSelector(true)}
                    className="flex items-center gap-2 px-4 py-3 border border-white/10 rounded-2xl bg-white/[0.03] hover:border-white/20 transition font-bold"
                  >
                    <CategoryIcon iconName={categoryForm.icono} className="w-5 h-5" />
                    Seleccionar Icono
                  </button>
                  <span className="text-sm text-white/45 font-bold">{categoryForm.icono}</span>
                </div>
              </div>
            )}

            <div className="flex gap-2">
              <button
                onClick={handleSaveCategory}
                className="flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
              >
                <Save className="w-4 h-4" />
                <span className="text-[10px] font-black uppercase tracking-[0.28em]">Guardar</span>
              </button>
              <button
                onClick={() => {
                  setShowCategoryForm(false)
                  setEditingCategory(null)
                }}
                className="px-5 py-3 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition text-white/70 font-black text-[10px] uppercase tracking-[0.28em]"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
        </div>
      )}

      {/* Lista de Categorías */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {categorias.map(categoria => (
          <div key={categoria.id} className="bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 p-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <CategoryIcon iconName={categoria.icono || 'Tag'} className="w-6 h-6 text-white/70" />
                <h3 className="text-lg font-black text-white">{categoria.nombre}</h3>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingCategory(categoria)
                    setCategoryForm({ nombre: categoria.nombre, icono: categoria.icono || 'Tag', usarIcono: !!categoria.icono, titulo_navegador: '' })
                    setShowCategoryForm(true)
                  }}
                  className="p-2 text-sky-300 hover:bg-white/[0.05] rounded-xl transition border border-transparent hover:border-white/10"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDeleteCategory(categoria.id)}
                  className="p-2 text-red-300 hover:bg-red-500/10 rounded-xl transition border border-transparent hover:border-red-500/15"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Subcategorías */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] font-black text-white/45 uppercase tracking-[0.28em]">Subcategorías</span>
                <button
                  onClick={() => {
                    setSelectedCategoryForSub(categoria.id)
                    setSubcategoryForm({ nombre: '', categoria_id: categoria.id })
                    setShowSubcategoryForm(true)
                  }}
                  className="text-[10px] font-black uppercase tracking-[0.28em] text-accent hover:brightness-95"
                >
                  + Agregar
                </button>
              </div>

              {categoria.subcategorias && categoria.subcategorias.length > 0 ? (
                <ul className="space-y-1">
                  {categoria.subcategorias.map(sub => (
                    <li key={sub.id} className="flex items-center justify-between text-sm text-white/65 bg-white/[0.03] border border-white/10 px-3 py-2 rounded-2xl">
                      <span className="font-bold">{sub.nombre}</span>
                      <button
                        onClick={() => handleDeleteSubcategory(sub.id)}
                        className="text-red-300 hover:text-red-200 transition"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-xs text-white/35 italic font-bold">Sin subcategorías</p>
              )}
            </div>
          </div>
        ))}
      </div>

      {categorias.length === 0 && (
        <div className="text-center py-12 text-white/45">
          <p className="font-black">No hay categorías creadas aún</p>
        </div>
      )}

      {/* Modal de Subcategoría */}
      {showSubcategoryForm && (
        <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-[#06070c] border border-white/10 rounded-[28px] p-6 max-w-md w-full shadow-2xl">
            <h3 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-4">Nueva Subcategoría</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black mb-2 text-white/45 uppercase tracking-[0.28em] px-1">Nombre</label>
                <input
                  type="text"
                  value={subcategoryForm.nombre}
                  onChange={e => setSubcategoryForm({ ...subcategoryForm, nombre: e.target.value })}
                  className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
                  placeholder="Ej: Remeras Básicas"
                />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleSaveSubcategory}
                  className="flex-1 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99] text-[10px] font-black uppercase tracking-[0.28em]"
                >
                  Guardar
                </button>
                <button
                  onClick={() => {
                    setShowSubcategoryForm(false)
                    setSelectedCategoryForSub('')
                  }}
                  className="flex-1 px-5 py-3 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition text-white/70 font-black text-[10px] uppercase tracking-[0.28em]"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Icon Selector */}
      {showIconSelector && (
        <IconSelector
          selectedIcon={categoryForm.icono}
          onSelect={icon => setCategoryForm({ ...categoryForm, icono: icon })}
          onClose={() => setShowIconSelector(false)}
        />
      )}
    </div>
  )
}
