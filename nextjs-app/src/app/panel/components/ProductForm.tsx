import { useState, useEffect } from 'react'
import { X, Upload, Plus, Trash2 } from 'lucide-react'
import { Producto, Drop, supabase } from '@/lib/supabase'
import { formatPrice, toNumber } from '@/lib/formatters'
import toast from 'react-hot-toast'
import NextImage from 'next/image'

interface ProductFormProps {
  producto?: Producto | null
  categorias: any[]
  etiquetas: any[]
  drops?: Drop[]
  onSave: (data: any) => Promise<void>
  onCancel: () => void
}

export default function ProductForm({ producto, categorias, etiquetas, drops, onSave, onCancel }: ProductFormProps) {
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  
  const [formData, setFormData] = useState({
    nombre: '',
    descripcion: '',
    precio: '',
    precio_original: '',
    descuento_porcentaje: '',
    categoria_id: '',
    subcategoria_id: '',
    destacado: false,
    top: false,
    proximo_lanzamiento: false,
    nuevo_lanzamiento: false,
    descuento_activo: false,
    imagen_url: '',
    imagenes: [] as string[],
    variantes: [] as Array<{talle: string, color: string, color_nombre: string, stock: number, imagen_url?: string}>,
    sku: '',
    stock_minimo: '5',
    proveedor_nombre: '',
    proveedor_contacto: '',
    precio_costo: '',
    fecha_lanzamiento: '',
    drop_ids: [] as string[]
  })

  useEffect(() => {
    if (producto) {
      setFormData({
        nombre: producto.nombre || '',
        descripcion: producto.descripcion || '',
        precio: formatPrice(producto.precio),
        precio_original: formatPrice(producto.precio_original),
        descuento_porcentaje: producto.descuento_porcentaje?.toString() || '',
        categoria_id: producto.categoria_id || '',
        subcategoria_id: producto.subcategoria_id || '',
        destacado: producto.destacado || false,
        top: producto.top || false,
        proximo_lanzamiento: producto.proximo_lanzamiento || (producto as any).proximamente || false,
        nuevo_lanzamiento: producto.nuevo_lanzamiento || false,
        descuento_activo: !!producto.descuento_activo,
        imagen_url: producto.imagen_url || '',
        imagenes: producto.imagenes || [],
        variantes: (producto.variantes || []).map(v => ({
             ...v,
             color_nombre: v.color_nombre || v.color, // Fallback
             stock: v.stock || 0
        })),
        sku: producto.sku || '',
        stock_minimo: producto.stock_minimo?.toString() || '5',
        proveedor_nombre: producto.proveedor_nombre || '',
        proveedor_contacto: producto.proveedor_contacto || '',
        precio_costo: formatPrice(producto.precio_costo),
        fecha_lanzamiento: producto.fecha_lanzamiento ? new Date(producto.fecha_lanzamiento).toISOString().slice(0, 16) : '',
        drop_ids: (producto.drops || []).map(d => d.id)
      })
    }
  }, [producto])

  // Cálculo automático de descuento
  useEffect(() => {
    const precio = toNumber(formData.precio)
    const precioOriginal = toNumber(formData.precio_original)

    if (!isNaN(precio) && !isNaN(precioOriginal) && precioOriginal > 0) {
      if (precio < precioOriginal) {
        const descuento = ((precioOriginal - precio) / precioOriginal) * 100
        setFormData(prev => ({ ...prev, descuento_porcentaje: descuento.toFixed(2) }))
      } else {
        setFormData(prev => ({ ...prev, descuento_porcentaje: '0' }))
      }
    } else {
      setFormData(prev => ({ ...prev, descuento_porcentaje: '0' }))
    }
  }, [formData.precio, formData.precio_original])

  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploading(true)
    try {
      const uploadData = new FormData()
      uploadData.append('file', file)
      uploadData.append('folder', 'productos')

      const res = await fetch('/api/upload-image', { method: 'POST', body: uploadData })
      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}))
        throw new Error(errorData.details || errorData.error || 'Error al subir imagen')
      }
      
      const { url } = await res.json()
      
      const nuevasImagenes = [...formData.imagenes, url]
      setFormData({ 
        ...formData, 
        imagen_url: formData.imagen_url || url,
        imagenes: nuevasImagenes 
      })
      toast.success('Imagen subida correctamente')
    } catch (error: any) {
      console.error('Error uploading:', error)
      toast.error(error.message || 'Error al subir imagen')
    } finally {
      setUploading(false)
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setLoading(true)

    // Validaciones de descuento
    if (formData.descuento_activo) {
      const precio = toNumber(formData.precio)
      const precioOriginal = toNumber(formData.precio_original)
      
      if (!precioOriginal || precioOriginal <= precio) {
        toast.error('El precio original debe ser mayor al precio final cuando hay un descuento activo')
        setLoading(false)
        return
      }
    }

    try {
      // Convertir precios a formato numérico limpio antes de guardar
      const dataToSave = {
        ...formData,
        precio: toNumber(formData.precio),
        precio_original: toNumber(formData.precio_original),
        precio_costo: toNumber(formData.precio_costo)
      }
      await onSave(dataToSave)
    } catch (error: any) {
      console.error(error)
      toast.error(error.message || 'Error al guardar producto')
    } finally {
      setLoading(false)
    }
  }

  // Variante form state
  const [newVariant, setNewVariant] = useState({ talle: '', color: '#000000', color_nombre: '', stock: '', imagen_url: '' })
  const [showVariantForm, setShowVariantForm] = useState(false)

  const commonColors = [
    { name: 'Negro', hex: '#000000' },
    { name: 'Blanco', hex: '#FFFFFF' },
    { name: 'Gris', hex: '#808080' },
    { name: 'Gris Melange', hex: '#BEBEBE' },
    { name: 'Azul Marino', hex: '#000080' },
    { name: 'Azul Francia', hex: '#0000FF' },
    { name: 'Rojo', hex: '#FF0000' },
    { name: 'Bordeaux', hex: '#800000' },
    { name: 'Beige', hex: '#F5F5DC' },
    { name: 'Camel', hex: '#C19A6B' },
    { name: 'Marrón', hex: '#8B4513' },
    { name: 'Rosa', hex: '#FFC0CB' },
    { name: 'Fucsia', hex: '#FF00FF' },
    { name: 'Verde', hex: '#008000' },
    { name: 'Verde Militar', hex: '#4B5320' },
    { name: 'Amarillo', hex: '#FFFF00' },
    { name: 'Lila', hex: '#C8A2C8' }
  ]

  const commonSizes = [
    { label: 'Indumentaria', sizes: ['XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL'] },
    { label: 'Calzado', sizes: ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'] }
  ]

  function addVariant() {
    if (!newVariant.talle || !newVariant.color || !newVariant.stock) {
      toast.error('Completa talle, color y stock')
      return
    }
    setFormData({
      ...formData,
      variantes: [...formData.variantes, { 
        talle: newVariant.talle, 
        color: newVariant.color, 
        color_nombre: newVariant.color_nombre || newVariant.color,
        stock: parseInt(newVariant.stock),
        imagen_url: newVariant.imagen_url
      }]
    })
    setNewVariant({ talle: '', color: '#000000', color_nombre: '', stock: '', imagen_url: '' })
  }

  return (
    <div className="bg-black min-h-screen text-white">
      {/* Header Fijo */}
      <div className="sticky top-0 z-50 bg-[#06070c] border-b border-white/10 px-4 py-4 lg:px-8 lg:py-5 flex justify-between items-center shadow-sm shadow-black/50">
        <div className="flex items-center gap-3 lg:gap-4">
          <div className="w-8 h-8 lg:w-10 lg:h-10 bg-white text-black rounded-lg lg:rounded-xl flex items-center justify-center font-bold text-xs lg:text-base">
            {producto ? 'EP' : 'NP'}
          </div>
          <div>
            <h2 className="text-[10px] lg:text-sm font-black uppercase tracking-[0.2em] text-gray-400 hidden sm:block">Panel de Control</h2>
            <h1 className="text-base lg:text-xl font-bold text-white leading-tight">
              {producto ? 'Editando' : 'Nuevo'}
            </h1>
          </div>
        </div>
        <div className="flex items-center gap-2 lg:gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="px-3 lg:px-6 py-2 lg:py-2.5 text-xs lg:text-sm font-bold text-gray-400 hover:text-white transition-colors uppercase tracking-widest"
          >
            Atrás
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={loading}
            className="px-4 lg:px-8 py-2 lg:py-2.5 bg-white text-black rounded-lg lg:rounded-xl font-black text-[10px] lg:text-xs uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center gap-2 shadow-xl shadow-white/5"
          >
            {loading ? <div className="animate-spin rounded-full h-3 w-3 lg:h-4 lg:w-4 border-2 border-black/20 border-t-black" /> : 'Guardar'}
          </button>
        </div>
      </div>

      <div className="max-w-6xl mx-auto p-4 lg:p-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-10">
          
          {/* Columna Izquierda: Info Principal */}
          <div className="lg:col-span-8 space-y-6 lg:space-y-8">
            
            {/* Sección 1: Datos Básicos */}
            <div className="bg-[#06070c] rounded-[20px] lg:rounded-[32px] p-5 lg:p-8 border border-white/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Información General</h3>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Nombre Comercial</label>
                  <input 
                    value={formData.nombre}
                    onChange={e => setFormData({...formData, nombre: e.target.value})}
                    className="w-full bg-[#111] border border-white/5 p-4 rounded-2xl text-sm font-bold placeholder:text-white/20 focus:bg-black focus:border-white text-white transition-all outline-none"
                    required
                    placeholder="Ej: Campera Puffer 'North' Black"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Código SKU</label>
                  <input 
                    value={formData.sku}
                    onChange={e => setFormData({...formData, sku: e.target.value})}
                    className="w-full bg-[#111] border border-white/5 p-4 rounded-2xl text-sm font-bold placeholder:text-white/20 focus:bg-black focus:border-white text-white transition-all outline-none"
                    placeholder="ELEG-PUFF-001"
                  />
                </div>
                {!formData.descuento_activo && (
                  <div>
                    <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Precio</label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                      <input 
                        type="text"
                        value={formData.precio}
                        onChange={e => setFormData({...formData, precio: e.target.value})}
                        onBlur={() => {
                          if (formData.precio) {
                            const num = toNumber(formData.precio)
                            setFormData({...formData, precio: formatPrice(num)})
                          }
                        }}
                        className="w-full bg-[#111] border border-white/5 pl-8 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-white/20 focus:bg-black focus:border-white text-white transition-all outline-none"
                        placeholder="0"
                        required={!formData.descuento_activo}
                      />
                    </div>
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Categoría</label>
                  <select
                    value={formData.categoria_id}
                    onChange={e => setFormData({...formData, categoria_id: e.target.value, subcategoria_id: ''})}
                    className="w-full bg-[#111] border border-white/5 p-4 rounded-2xl text-sm font-bold focus:bg-black focus:border-white text-white transition-all outline-none"
                    required
                  >
                    <option value="">Seleccionar...</option>
                    {categorias.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Subcategoría</label>
                  <select
                    value={formData.subcategoria_id}
                    onChange={e => setFormData({...formData, subcategoria_id: e.target.value})}
                    className="w-full bg-[#111] border border-white/5 p-4 rounded-2xl text-sm font-bold focus:bg-black focus:border-white text-white transition-all outline-none"
                    disabled={!formData.categoria_id}
                  >
                    <option value="">Ninguna</option>
                    {categorias.find(c => String(c.id) === String(formData.categoria_id))?.subcategorias?.map((sub: any) => (
                      <option key={sub.id} value={sub.id}>{sub.nombre}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Costo</label>
                  <div className="relative">
                    <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                    <input 
                      type="text"
                      value={formData.precio_costo}
                      onChange={e => setFormData({...formData, precio_costo: e.target.value})}
                      onBlur={() => {
                        if (formData.precio_costo) {
                          const num = toNumber(formData.precio_costo)
                          setFormData({...formData, precio_costo: formatPrice(num)})
                        }
                      }}
                      className="w-full bg-[#111] border border-white/5 pl-8 pr-4 py-4 rounded-2xl text-sm font-bold placeholder:text-white/20 focus:bg-black focus:border-white text-white transition-all outline-none"
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>

              {/* Asignación de Drops */}
              <div className="p-6 bg-[#111] rounded-3xl border border-white/5 space-y-4">
                <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Asignar a Drops</h4>
                {drops && drops.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                    {drops.map(drop => (
                      <label key={drop.id} className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        formData.drop_ids.includes(drop.id) 
                          ? 'bg-accent/10 border-accent/30' 
                          : 'bg-black border-white/5 hover:bg-white/5'
                      }`}>
                        <input
                          type="checkbox"
                          checked={formData.drop_ids.includes(drop.id)}
                          onChange={(e) => {
                            const checked = e.target.checked
                            setFormData(prev => ({
                              ...prev,
                              drop_ids: checked 
                                ? [...prev.drop_ids, drop.id]
                                : prev.drop_ids.filter(id => id !== drop.id)
                            }))
                          }}
                          className="hidden"
                        />
                        <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${
                          formData.drop_ids.includes(drop.id)
                            ? 'bg-accent border-accent text-black'
                            : 'border-white/20'
                        }`}>
                          {formData.drop_ids.includes(drop.id) && <span className="text-[10px]">✓</span>}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className={`text-xs font-bold truncate ${formData.drop_ids.includes(drop.id) ? 'text-accent' : 'text-white'}`}>
                            {drop.nombre}
                          </p>
                          {drop.fecha_lanzamiento && (
                            <p className="text-[9px] text-white/40 font-mono mt-0.5">
                              {new Date(drop.fecha_lanzamiento).toLocaleDateString()}
                            </p>
                          )}
                        </div>
                      </label>
                    ))}
                  </div>
                ) : (
                  <p className="text-xs text-white/30 italic">No hay drops disponibles. Crea uno primero en la sección Drops.</p>
                )}
              </div>

              {/* Visibilidad y Lanzamiento */}
              <div className="p-6 bg-[#111] rounded-3xl border border-white/5 space-y-4">
                 <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Visibilidad y Lanzamiento</h4>
                 <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
                    <label className="flex flex-col items-center justify-center gap-3 p-4 bg-black rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition text-center h-full group">
                      <input 
                        type="checkbox" 
                        checked={formData.descuento_activo}
                        onChange={e => {
                          const isChecked = e.target.checked;
                          setFormData(prev => ({
                            ...prev, 
                            descuento_activo: isChecked,
                            // If activating, copy current price to original. If deactivating, maybe restore? 
                            // User request: "cuando tilde en oferta... aparezca el precio del producto, el precio en descuento"
                            precio_original: isChecked ? prev.precio : prev.precio_original
                          }))
                        }}
                        className="w-5 h-5 rounded border-gray-600 text-pink-500 focus:ring-pink-500 bg-gray-900 mb-1"
                      />
                      <span className="text-xl group-hover:scale-110 transition-transform">🏷️</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Oferta</span>
                    </label>

                    <label className="flex flex-col items-center justify-center gap-3 p-4 bg-black rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition text-center h-full group">
                      <input 
                        type="checkbox" 
                        checked={formData.nuevo_lanzamiento}
                        onChange={e => setFormData({...formData, nuevo_lanzamiento: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-600 text-green-500 focus:ring-green-500 bg-gray-900 mb-1"
                      />
                      <span className="text-xl group-hover:scale-110 transition-transform">✨</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Nuevo</span>
                    </label>
                    
                    <label className="flex flex-col items-center justify-center gap-3 p-4 bg-black rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition text-center h-full group">
                      <input 
                        type="checkbox" 
                        checked={formData.proximo_lanzamiento}
                        onChange={e => setFormData({
                            ...formData, 
                            proximo_lanzamiento: e.target.checked,
                            // Sync legacy column in form state so it gets sent to API
                            ...({ proximamente: e.target.checked } as any)
                        })}
                        className="w-5 h-5 rounded border-gray-600 text-blue-500 focus:ring-blue-500 bg-gray-900 mb-1"
                      />
                      <span className="text-xl group-hover:scale-110 transition-transform">🔒</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Próximo</span>
                    </label>

                    <label className="flex flex-col items-center justify-center gap-3 p-4 bg-black rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition text-center h-full group">
                      <input 
                        type="checkbox" 
                        checked={formData.destacado}
                        onChange={e => setFormData({...formData, destacado: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-600 text-yellow-500 focus:ring-yellow-500 bg-gray-900 mb-1"
                      />
                      <span className="text-xl group-hover:scale-110 transition-transform">⭐</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Destacado</span>
                    </label>

                    <label className="flex flex-col items-center justify-center gap-3 p-4 bg-black rounded-2xl border border-white/5 cursor-pointer hover:border-white/20 hover:bg-white/5 transition text-center h-full group">
                      <input 
                        type="checkbox" 
                        checked={formData.top}
                        onChange={e => setFormData({...formData, top: e.target.checked})}
                        className="w-5 h-5 rounded border-gray-600 text-purple-500 focus:ring-purple-500 bg-gray-900 mb-1"
                      />
                      <span className="text-xl group-hover:scale-110 transition-transform">👑</span>
                      <span className="text-[10px] font-bold text-white uppercase tracking-wider">Top Pick</span>
                    </label>
                 </div>
                 
                 {formData.proximo_lanzamiento && (
                   <div className="pt-2 animate-in fade-in slide-in-from-top-2">
                     <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Fecha de Lanzamiento (Para Timer)</label>
                     <input 
                        type="datetime-local"
                        value={formData.fecha_lanzamiento}
                        onChange={e => setFormData({...formData, fecha_lanzamiento: e.target.value})}
                        className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-white transition-all outline-none"
                     />
                   </div>
                 )}

                 {formData.descuento_activo && (
                   <div className="pt-4 mt-4 border-t border-white/5 animate-in fade-in slide-in-from-top-2">
                     <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Precio Original</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/40 font-bold">$</span>
                            <input 
                              type="text"
                              value={formData.precio_original}
                              onChange={e => setFormData({...formData, precio_original: e.target.value})}
                              onBlur={() => {
                                if (formData.precio_original) {
                                  const num = toNumber(formData.precio_original)
                                  setFormData({...formData, precio_original: formatPrice(num)})
                                }
                              }}
                              className="w-full bg-black border border-white/10 pl-8 pr-4 py-4 rounded-2xl text-sm font-bold text-white/70 focus:border-white transition-all outline-none"
                              placeholder="0"
                              required={formData.descuento_activo}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-pink-500 tracking-widest mb-2 px-1">Precio Oferta</label>
                          <div className="relative">
                            <span className="absolute left-4 top-1/2 -translate-y-1/2 text-pink-500 font-bold">$</span>
                            <input 
                              type="number"
                              step="1"
                              min="0"
                              onKeyDown={(e) => {
                                if (e.key === '.' || e.key === ',') e.preventDefault()
                              }}
                              value={formData.precio}
                              onChange={e => setFormData({...formData, precio: e.target.value})}
                              className="w-full bg-pink-500/10 border border-pink-500/50 pl-8 pr-4 py-4 rounded-2xl text-sm font-bold text-white focus:bg-pink-500/20 transition-all outline-none"
                              placeholder="0"
                              required={formData.descuento_activo}
                            />
                          </div>
                        </div>
                        <div>
                          <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Descuento</label>
                          <div className="bg-white text-black h-[54px] rounded-2xl flex items-center justify-center font-black text-xl">
                            {formData.descuento_porcentaje}% OFF
                          </div>
                        </div>
                     </div>
                   </div>
                 )}
              </div>

              <div>
                <label className="block text-[10px] font-black uppercase text-gray-400 tracking-widest mb-2 px-1">Descripción del Producto</label>
                <textarea 
                  value={formData.descripcion}
                  onChange={e => setFormData({...formData, descripcion: e.target.value})}
                  className="w-full bg-[#111] border border-white/5 p-4 rounded-2xl text-sm font-bold placeholder:text-white/20 focus:bg-black focus:border-white text-white transition-all outline-none min-h-[120px]"
                  placeholder="Detalla materiales, calce y cuidados..."
                />
              </div>
            </div>



            {/* Sección 3: Variantes y Stock */}
            <div className="bg-[#06070c] rounded-[32px] p-8 border border-white/10 shadow-sm space-y-6">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 bg-white rounded-full" />
                  <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Stock y Variantes</h3>
                </div>
                <button
                  type="button"
                  onClick={() => setShowVariantForm(!showVariantForm)}
                  className="px-4 py-2 rounded-xl text-xs font-black uppercase tracking-widest bg-white text-black hover:bg-gray-200 transition"
                >
                  {showVariantForm ? 'Cerrar' : 'Agregar variante'}
                </button>
              </div>

              {showVariantForm && (
                <div className="bg-[#111] rounded-[24px] p-6 border border-white/5">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-4 items-end">
                    
                    {/* Talle */}
                    <div className="lg:col-span-2">
                      <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 px-1">Talle</label>
                      <select
                        value={newVariant.talle}
                        onChange={e => setNewVariant({...newVariant, talle: e.target.value})}
                        className="w-full h-10 bg-[#06070c] border border-white/10 px-3 rounded-xl text-[11px] font-bold outline-none focus:border-white text-white transition-all appearance-none cursor-pointer mb-2"
                      >
                        <option value="">Elegir...</option>
                        {['UNI', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].map(t => <option key={t} value={t}>{t}</option>)}
                      </select>
                      
                      {/* Atajos de Talles */}
                      <div className="flex flex-col gap-2">
                        {commonSizes.map((group, gIdx) => (
                          <div key={gIdx} className="space-y-1">
                            <span className="text-[7px] font-black text-gray-600 uppercase tracking-widest pl-1">{group.label}</span>
                            <div className="flex flex-wrap gap-1">
                              {group.sizes.map(s => (
                                <button
                                  key={s}
                                  type="button"
                                  onClick={() => setNewVariant({...newVariant, talle: s})}
                                  className={`px-2 py-1 rounded text-[9px] font-bold transition-all border ${
                                    newVariant.talle === s 
                                      ? 'bg-white text-black border-white' 
                                      : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                                  }`}
                                >
                                  {s}
                                </button>
                              ))}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Nombre Color */}
                    <div className="lg:col-span-4">
                      <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 px-1">Nombre Comercial Color</label>
                      <input 
                        type="text"
                        value={newVariant.color_nombre}
                        onChange={e => setNewVariant({...newVariant, color_nombre: e.target.value})}
                        className="w-full h-10 bg-[#06070c] border border-white/10 px-4 rounded-xl text-[11px] font-bold placeholder:text-white/20 text-white outline-none focus:border-white transition-all"
                        placeholder="Ej: Negro Carbon, Azul Noche..."
                      />
                    </div>

                    {/* Selector HEX */}
                    <div className="lg:col-span-3">
                      <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 px-1">Color HEX</label>
                      <div className="flex gap-2">
                        <div className="relative flex-1">
                          <input 
                            type="text"
                            value={newVariant.color}
                            onChange={e => setNewVariant({...newVariant, color: e.target.value.toUpperCase()})}
                            className="w-full h-10 bg-[#06070c] border border-white/10 pl-10 pr-3 rounded-xl text-[10px] font-black uppercase tracking-widest text-white outline-none focus:border-white transition-all"
                          />
                          <div className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 rounded-full border border-white/20 shadow-sm" style={{ backgroundColor: newVariant.color }} />
                        </div>
                        <div className="relative w-10 h-10 rounded-xl overflow-hidden border border-white/10 bg-[#06070c] flex-shrink-0">
                          <input 
                            type="color"
                            value={newVariant.color}
                            onChange={e => setNewVariant({...newVariant, color: e.target.value.toUpperCase()})}
                            className="absolute -inset-2 w-[150%] h-[150%] cursor-pointer"
                          />
                        </div>
                      </div>
                    </div>

                    {/* Stock */}
                    <div className="lg:col-span-2">
                      <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 px-1">Unidades</label>
                      <input 
                        type="number"
                        step="1"
                        min="0"
                        onKeyDown={(e) => {
                          if (e.key === '.' || e.key === ',') e.preventDefault()
                        }}
                        value={newVariant.stock}
                        onChange={e => setNewVariant({...newVariant, stock: e.target.value})}
                        className="w-full h-10 bg-[#06070c] border border-white/10 px-4 rounded-xl text-sm font-black text-white outline-none focus:border-white transition-all"
                        placeholder="0"
                      />
                    </div>

                    {/* Botón Add */}
                    <div className="lg:col-span-1">
                      <button
                        type="button"
                        onClick={() => { addVariant(); setShowVariantForm(false); }}
                        className="w-full h-10 bg-white text-black rounded-xl flex items-center justify-center hover:bg-gray-200 transition shadow-xl shadow-white/5 active:scale-95"
                      >
                        <Plus className="w-5 h-5" />
                      </button>
                    </div>

                    {/* Imagen URL (Opcional) */}
                    <div className="lg:col-span-12">
                      <label className="block text-[9px] font-black uppercase text-gray-400 tracking-[0.2em] mb-2 px-1">Imagen URL de la Variante (Opcional)</label>
                      <input 
                        type="text"
                        value={newVariant.imagen_url}
                        onChange={e => setNewVariant({...newVariant, imagen_url: e.target.value})}
                        className="w-full h-10 bg-[#06070c] border border-white/10 px-4 rounded-xl text-[11px] font-bold placeholder:text-white/20 text-white outline-none focus:border-white transition-all"
                        placeholder="https://... (Deja vacío para usar imagen principal)"
                      />
                    </div>
                  </div>

                  {/* Biblioteca de Colores */}
                  <div className="mt-6 pt-6 border-t border-white/5">
                    <div className="flex items-center gap-2 mb-3">
                      <span className="text-sm">🎨</span>
                      <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Atajos de Colores Rápidos</label>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {commonColors.map((c) => (
                        <button
                          key={c.name}
                          type="button"
                          onClick={() => setNewVariant({ ...newVariant, color: c.hex.toUpperCase(), color_nombre: c.name })}
                          className={`group relative h-8 px-3 rounded-lg border flex items-center gap-2 transition-all ${
                            newVariant.color.toUpperCase() === c.hex.toUpperCase() 
                              ? 'bg-white border-white text-black' 
                              : 'bg-[#06070c] border-white/10 hover:border-white/30 text-white'
                          }`}
                        >
                          <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: c.hex }} />
                          <span className="text-[9px] font-black uppercase tracking-tight">{c.name}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Variantes en Inventario - Grid Mejorado */}
              <div className="space-y-4">
                <div className="flex justify-between items-center px-2">
                  <h4 className="text-[10px] font-black uppercase text-gray-300 tracking-[0.3em]">Variantes en Inventario</h4>
                  <div className="flex items-center gap-4">
                    <div className="flex flex-col items-end">
                      <label className="text-[8px] font-black text-gray-500 uppercase tracking-widest mb-1">Stock Mínimo Alerta</label>
                      <input 
                        type="number"
                        value={formData.stock_minimo}
                        onChange={e => setFormData({...formData, stock_minimo: e.target.value})}
                        className="w-16 h-8 bg-[#111] border border-white/10 rounded-lg text-center text-xs font-black text-white outline-none focus:border-white transition-all"
                      />
                    </div>
                    <span className="text-[9px] font-black text-gray-400 uppercase bg-white/5 px-3 py-1 rounded-full">{formData.variantes.length} Variantes</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                  {formData.variantes.map((v, idx) => (
                    <div key={idx} className="bg-[#06070c] border border-white/10 p-5 rounded-[24px] flex items-center gap-4 hover:border-white transition-all group">
                      {v.imagen_url ? (
                        <div className="w-12 h-12 rounded-2xl overflow-hidden border border-white/5 relative group-hover:border-white transition-colors">
                          <img src={v.imagen_url} alt={v.talle} className="w-full h-full object-cover" />
                          <div className="absolute inset-0 flex items-center justify-center bg-black/40 backdrop-blur-[1px]">
                             <span className="text-[9px] font-black text-white shadow-sm">{v.talle}</span>
                          </div>
                        </div>
                      ) : (
                        <div className="w-12 h-12 rounded-2xl bg-[#111] flex flex-col items-center justify-center border border-white/5 group-hover:bg-white group-hover:text-black transition-colors">
                          <span className="text-[7px] font-black uppercase opacity-40">Talle</span>
                          <span className="text-xs font-black">{v.talle}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <div className="w-3 h-3 rounded-full border border-white/10" style={{ backgroundColor: v.color }} />
                          <span className="text-[10px] font-black uppercase truncate tracking-tight text-white">{v.color_nombre}</span>
                        </div>
                        <span className="text-[8px] font-black text-gray-500 uppercase tracking-widest leading-none">{v.color}</span>
                      </div>
                      <div className="w-16">
                        <label className="block text-[7px] font-black text-gray-500 uppercase tracking-widest mb-1 text-center">Unid.</label>
                        <input 
                          type="number"
                          step="1"
                          min="0"
                          onKeyDown={(e) => {
                            if (e.key === '.' || e.key === ',') e.preventDefault()
                          }}
                          value={v.stock}
                          onChange={(e) => {
                            const val = e.target.value === '' ? 0 : parseInt(e.target.value)
                            const newVars = [...formData.variantes]
                            newVars[idx] = { ...newVars[idx], stock: val }
                            setFormData({ ...formData, variantes: newVars })
                          }}
                          className="w-full h-8 bg-[#111] rounded-lg text-center text-xs font-black outline-none focus:ring-1 focus:ring-white text-white transition-all"
                        />
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          const newVars = formData.variantes.filter((_, i) => i !== idx)
                          setFormData({...formData, variantes: newVars})
                        }}
                        className="w-8 h-8 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all flex items-center justify-center opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}

                  {formData.variantes.length === 0 && (
                    <div className="col-span-full py-16 flex flex-col items-center justify-center bg-white/5 border-2 border-dashed border-white/10 rounded-[32px]">
                      <div className="text-2xl mb-3 opacity-20 grayscale">🧥</div>
                      <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em]">Carga talles y colores para este producto</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Columna Derecha: Multimedia y Config */}
          <div className="lg:col-span-4 space-y-8">
            
            {/* Sección Multimedia */}
            <div className="bg-[#06070c] rounded-[32px] p-8 border border-white/10 shadow-sm space-y-6">
              <div className="flex items-center gap-3 mb-2">
                <div className="w-1.5 h-1.5 bg-white rounded-full" />
                <h3 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-400">Galería de Imágenes</h3>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {formData.imagenes.map((img, idx) => {
                  const isSupabaseUrl = img.includes('supabase.co')
                  const isLocalUrl = img.startsWith('/')
                  const isValidForNextImage = isSupabaseUrl || isLocalUrl
                  
                  return (
                  <div key={idx} className="relative group aspect-[3/4] rounded-2xl overflow-hidden border border-white/10">
                    {isValidForNextImage ? (
                      <NextImage 
                        src={img} 
                        alt={`Imagen producto ${idx + 1}`}
                        fill
                        className="object-cover"
                        sizes="(max-width: 768px) 50vw, 25vw"
                      />
                    ) : (
                      <img 
                        src={img} 
                        alt={`Imagen producto ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => (e.currentTarget.src = '/urban.png')}
                      />
                    )}
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          const newImgs = formData.imagenes.filter((_, i) => i !== idx)
                          setFormData({
                            ...formData,
                            imagenes: newImgs,
                            imagen_url: idx === 0 && newImgs.length > 0 ? newImgs[0] : (newImgs.length > 0 ? formData.imagen_url : '')
                          })
                        }}
                        className="w-8 h-8 rounded-full bg-red-500 text-white flex items-center justify-center hover:scale-110 transition"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    {idx === 0 && (
                      <div className="absolute top-2 left-2 px-2 py-0.5 bg-white text-black text-[8px] font-black uppercase tracking-widest rounded-full shadow-lg">PORTADA</div>
                    )}
                  </div>
                )})}
                
                <label className="aspect-[3/4] border-2 border-dashed border-white/10 rounded-2xl flex flex-col items-center justify-center cursor-pointer hover:border-white hover:bg-white/5 transition group">
                  {uploading ? (
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  ) : (
                    <>
                      <div className="w-10 h-10 bg-[#111] rounded-full flex items-center justify-center mb-2 group-hover:bg-white transition-colors">
                        <Upload className="w-4 h-4 text-gray-400 group-hover:text-black transition-colors" />
                      </div>
                      <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest group-hover:text-white">Subir</span>
                    </>
                  )}
                  <input type="file" className="hidden" accept="image/*" onChange={handleImageUpload} disabled={uploading} />
                </label>
              </div>
            </div>


          </div>
        </form>
      </div>
    </div>
  )
}
