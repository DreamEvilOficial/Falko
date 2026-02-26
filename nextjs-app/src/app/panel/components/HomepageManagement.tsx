import { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { Layout, Plus, Trash2, ArrowUp, ArrowDown, Save, Image as ImageIcon } from 'lucide-react'

interface HomepageSection {
  id: string
  tipo: 'filtro' | 'categoria'
  referencia_id: string
  titulo: string
  subtitulo: string
  gif_url: string
  orden: number
  activo: boolean
}

export default function HomepageManagement() {
  const [sections, setSections] = useState<HomepageSection[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isAdding, setIsAdding] = useState(false)
  const [showTopPicks, setShowTopPicks] = useState(true)

  const [newSection, setNewSection] = useState<Partial<HomepageSection>>({
    tipo: 'filtro',
    referencia_id: '',
    titulo: '',
    subtitulo: '',
    gif_url: '',
    orden: 0,
    activo: true
  })

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    try {
      const resSections = await fetch('/api/sections')
      const sectionsData = await resSections.json()
      
      const resCats = await fetch('/api/categories')
      const catsData = await resCats.json()

      const resConfig = await fetch('/api/config')
      const configData = await resConfig.json()

      setSections(sectionsData || [])
      setCategorias(catsData || [])
      if (configData && typeof configData.show_top_picks !== 'undefined') {
        setShowTopPicks(configData.show_top_picks)
      }
    } catch (error) {
      toast.error('Error al cargar datos')
    } finally {
      setLoading(false)
    }
  }

  async function toggleTopPicks() {
    const newValue = !showTopPicks
    setShowTopPicks(newValue)
    try {
      await fetch('/api/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clave: 'show_top_picks', valor: newValue })
      })
      toast.success('Configuración actualizada')
    } catch {
      toast.error('Error al actualizar')
      setShowTopPicks(!newValue)
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    const toastId = toast.loading('Subiendo imagen...')
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('folder', 'homepage')

      const res = await fetch('/api/upload', { method: 'POST', body: formData })
      if (!res.ok) throw new Error('Error al subir')
      
      const { publicUrl } = await res.json()
      
      setNewSection(prev => ({ ...prev, gif_url: publicUrl }))
      toast.success('Imagen subida correctamente', { id: toastId })
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Error al subir imagen', { id: toastId })
    }
  }

  async function handleAdd() {
    if (!newSection.titulo) {
      toast.error('El título es obligatorio')
      return
    }
    if (!newSection.referencia_id) {
      toast.error('Debes seleccionar un filtro o categoría')
      return
    }

    try {
      const res = await fetch('/api/sections', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
           ...newSection,
           orden: sections.length
        })
      })
      if (!res.ok) {
        try {
          const data = await res.json()
          throw new Error(data?.details || data?.error || 'Error al guardar')
        } catch {
          throw new Error('Error al guardar')
        }
      }
      
      toast.success('Sección añadida')
      setIsAdding(false)
      fetchData()
    } catch (error: any) {
      toast.error('Error: ' + error.message)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('¿Eliminar esta sección de la home?')) return
    try {
      const res = await fetch(`/api/sections?id=${id}`, { method: 'DELETE' })
      if (!res.ok) throw new Error('Error al eliminar')
      
      toast.success('Sección eliminada')
      fetchData()
    } catch (error: any) {
      toast.error('Error al eliminar')
    }
  }

  async function move(id: string, direction: 'up' | 'down') {
    const index = sections.findIndex(s => s.id === id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === sections.length - 1) return

    const newSections = [...sections]
    const targetIndex = direction === 'up' ? index - 1 : index + 1
    const [movedItem] = newSections.splice(index, 1)
    newSections.splice(targetIndex, 0, movedItem)

    // Actualizar orden localmente
    setSections(newSections.map((s, i) => ({ ...s, orden: i })))

    // Actualizar en BD
    try {
        const updates = newSections.map((s, i) => 
            fetch('/api/sections', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id: s.id, orden: i })
            })
        )
        await Promise.all(updates)
    } catch (error) {
        console.error('Error reordering', error)
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
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <h1 className="font-display text-2xl md:text-3xl tracking-[0.08em] uppercase text-white flex items-center gap-3">
          <Layout className="w-6 h-6 text-white/70" /> Inicio
        </h1>
        <button 
          onClick={() => setIsAdding(true)}
          className="w-full md:w-auto flex items-center justify-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em]">Añadir Sección</span>
        </button>
      </div>

      {isAdding && (
        <div className="bg-[#06070c]/70 backdrop-blur-2xl p-6 rounded-[28px] border border-dashed border-white/15 space-y-4 shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)]">
          <h3 className="font-display text-xl tracking-[0.08em] uppercase text-white">Nueva Sección</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <select 
              className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-sm transition hover:border-white/20 focus:border-accent/40"
              onChange={e => setNewSection({...newSection, tipo: e.target.value as any})}
            >
              <option value="filtro">Basada en Filtro (Destacados, Ofertas...)</option>
              <option value="categoria">Basada en Categoría</option>
            </select>
            
            {newSection.tipo === 'filtro' ? (
              <select 
                className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-sm transition hover:border-white/20 focus:border-accent/40"
                onChange={e => setNewSection({...newSection, referencia_id: e.target.value})}
              >
                <option value="">Seleccionar Filtro...</option>
                <option value="destacados">Destacados</option>
                <option value="nuevos">Nuevos</option>
                <option value="descuentos">Descuentos</option>
                <option value="proximamente">Próximamente</option>
              </select>
            ) : (
              <select 
                className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl outline-none appearance-none cursor-pointer font-bold text-sm transition hover:border-white/20 focus:border-accent/40"
                onChange={e => setNewSection({...newSection, referencia_id: e.target.value})}
              >
                <option value="">Seleccionar Categoría...</option>
                {categorias.map(cat => (
                  <option key={cat.id} value={cat.slug}>{cat.nombre}</option>
                ))}
              </select>
            )}

            <input 
              type="text" placeholder="Título (ej: VERANO 2024)" className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none transition hover:border-white/20 focus:border-accent/40"
              onChange={e => setNewSection({...newSection, titulo: e.target.value})}
            />
            <input 
              type="text" placeholder="Subtítulo (opcional)" className="px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none transition hover:border-white/20 focus:border-accent/40"
              onChange={e => setNewSection({...newSection, subtitulo: e.target.value})}
            />
            <div className="relative">
              <input 
                type="text" placeholder="URL de GIF de ícono (ej: /fire.gif)" className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold outline-none transition hover:border-white/20 focus:border-accent/40 pr-12"
                value={newSection.gif_url}
                onChange={e => setNewSection({...newSection, gif_url: e.target.value})}
              />
              <div className="absolute right-2 top-1/2 -translate-y-1/2">
                 <label className="cursor-pointer p-2 hover:bg-white/10 rounded-lg transition-colors flex items-center justify-center">
                    <ImageIcon className="w-4 h-4 text-white/50" />
                    <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
                 </label>
              </div>
            </div>
          </div>
          <div className="flex gap-2">
            <button onClick={handleAdd} className="flex-1 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99] text-[10px] font-black uppercase tracking-[0.28em]">Guardar</button>
            <button onClick={() => setIsAdding(false)} className="px-5 py-3 border border-white/10 rounded-2xl bg-white/[0.02] hover:bg-white/[0.04] hover:border-white/20 transition text-white/70 font-black text-[10px] uppercase tracking-[0.28em]">Cancelar</button>
          </div>
        </div>
      )}

      <div className="space-y-4">
        {/* Toggle Top Picks */}
        <div className="bg-[#06070c]/70 backdrop-blur-2xl p-6 rounded-[28px] border border-white/10 shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] flex items-center justify-between">
          <div>
              <h3 className="font-display text-xl tracking-[0.08em] uppercase text-white mb-1">Top Picks</h3>
              <p className="text-xs text-white/50 font-medium">Mostrar sección de productos destacados en la parte superior</p>
          </div>
          <button 
              onClick={toggleTopPicks}
              className={`w-14 h-8 rounded-full transition-colors relative ${showTopPicks ? 'bg-accent' : 'bg-white/10'}`}
          >
              <div className={`absolute top-1 w-6 h-6 rounded-full bg-white transition-transform shadow-sm ${showTopPicks ? 'left-7' : 'left-1'}`} />
          </button>
        </div>

        {sections.map((section, idx) => (
          <div key={section.id} className="bg-[#06070c]/70 backdrop-blur-2xl p-4 rounded-[24px] shadow-[0_30px_120px_-90px_rgba(0,0,0,0.9)] border border-white/10 flex items-center gap-4">
            <div className="flex flex-col gap-1">
              <button disabled={idx === 0} onClick={() => move(section.id, 'up')} className="p-2 hover:bg-white/[0.05] rounded-xl disabled:opacity-20 transition">
                <ArrowUp className="w-4 h-4 text-white/70" />
              </button>
              <button disabled={idx === sections.length - 1} onClick={() => move(section.id, 'down')} className="p-2 hover:bg-white/[0.05] rounded-xl disabled:opacity-20 transition">
                <ArrowDown className="w-4 h-4 text-white/70" />
              </button>
            </div>
            
            <div className="w-12 h-12 bg-white/[0.03] border border-white/10 rounded-2xl flex items-center justify-center overflow-hidden flex-shrink-0">
              {section.gif_url ? (
                <img src={section.gif_url} alt="" className="w-8 h-8 object-contain" />
              ) : (
                <Layout className="w-6 h-6 text-white/35" />
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="font-black text-white truncate">{section.titulo}</h4>
              <p className="text-[10px] text-white/45 font-black uppercase tracking-[0.26em]">{section.tipo}: {section.referencia_id}</p>
            </div>

            <button onClick={() => handleDelete(section.id)} className="p-2 text-red-300 hover:bg-red-500/10 rounded-2xl transition border border-transparent hover:border-red-500/15">
              <Trash2 className="w-5 h-5" />
            </button>
          </div>
        ))}

        {sections.length === 0 && (
          <div className="text-center py-12 text-white/45 border border-dashed border-white/15 rounded-[28px] bg-[#06070c]/70">
            <span className="font-black">No has configurado secciones para la página de inicio.</span>
          </div>
        )}
      </div>
    </div>
  )
}
