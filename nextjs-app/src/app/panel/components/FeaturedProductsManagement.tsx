'use client'

import { useState, useEffect } from 'react'
import { Search, Star, TrendingUp, Sparkles, Clock, Tag, X, Save, DollarSign, Percent } from 'lucide-react'
import { formatPrice, toNumber } from '@/lib/formatters'
import { Producto } from '@/lib/supabase'
import toast from 'react-hot-toast'

export default function FeaturedProductsManagement() {
  const [products, setProducts] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')

  // Modal States
  const [proximoModalOpen, setProximoModalOpen] = useState(false)
  const [ofertaModalOpen, setOfertaModalOpen] = useState(false)
  const [selectedProduct, setSelectedProduct] = useState<Producto | null>(null)
  
  // Proximo State
  const [tempDate, setTempDate] = useState('')
  const [tempProximoActive, setTempProximoActive] = useState(false)

  // Oferta State
  const [tempOfertaActive, setTempOfertaActive] = useState(false)
  const [tempPrices, setTempPrices] = useState({
    original: '',
    current: '',
    discount: ''
  })

  useEffect(() => {
    fetchProducts()
  }, [])

  async function fetchProducts() {
    try {
      const res = await fetch('/api/products')
      const data = await res.json()
      setProducts(data || [])
    } catch (error) {
      toast.error('Error al cargar productos')
    } finally {
      setLoading(false)
    }
  }

  async function toggleField(id: string, field: keyof Producto, currentValue: boolean) {
    const newValue = !currentValue
    
    // Handle specific logic for proximamente to ensure legacy column is also updated
    const updates = { [field]: newValue } as Partial<Producto>
    if (field === 'proximamente') {
        updates.proximo_lanzamiento = newValue
    }

    try {
      // Optimistic update
      setProducts(products.map(p => {
        if (p.id === id) {
            const updated = { ...p, ...updates }
            return updated
        }
        return p
      }))
      
      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates)
      })
      
      if (!res.ok) throw new Error('Error al actualizar')
      toast.success('Actualizado correctamente')
    } catch (error) {
      // Revert optimistic update
      setProducts(products.map(p => p.id === id ? { ...p, [field]: currentValue } : p))
      toast.error('Error al actualizar')
    }
  }

  function openProximoModal(product: Producto) {
    setSelectedProduct(product)
    setTempProximoActive(!!(product.proximo_lanzamiento || product.proximamente))
    
    if (product.fecha_lanzamiento) {
        // Convertir UTC almacenado a hora local para el input datetime-local
        const d = new Date(product.fecha_lanzamiento)
        // Ajustar el offset para obtener la representación local en formato ISO
        const localIso = new Date(d.getTime() - (d.getTimezoneOffset() * 60000)).toISOString().slice(0, 16)
        setTempDate(localIso)
    } else {
        setTempDate('')
    }
    setProximoModalOpen(true)
  }

  function openOfertaModal(product: Producto) {
    setSelectedProduct(product)
    setTempOfertaActive(!!product.descuento_activo)
    setTempPrices({
        original: formatPrice(product.precio_original || product.precio),
        current: formatPrice(product.precio),
        discount: product.descuento_porcentaje?.toString() || '0'
    })
    setOfertaModalOpen(true)
  }

  async function handleSaveProximo() {
    if (!selectedProduct) return
    
    // Validar fecha si está activo
    if (tempProximoActive && !tempDate) {
        toast.error('Debes establecer una fecha y hora')
        return
    }

    let isoDate = null
    if (tempDate) {
        // Convertir la hora local del input a UTC ISO string para guardar
        isoDate = new Date(tempDate).toISOString()
    }

    const updates = {
        proximo_lanzamiento: tempProximoActive,
        proximamente: tempProximoActive,
        fecha_lanzamiento: isoDate
    }

    try {
        const res = await fetch(`/api/products/${selectedProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        })

        if (!res.ok) throw new Error('Error al actualizar')

        setProducts(products.map(p => {
            if (p.id === selectedProduct.id) {
                return { ...p, ...updates }
            }
            return p
        }))

        toast.success('Lanzamiento actualizado')
        setProximoModalOpen(false)
    } catch (error) {
        toast.error('Error al actualizar')
    }
  }

  async function handleSaveOferta() {
    if (!selectedProduct) return
    
    const updates = {
        descuento_activo: tempOfertaActive,
        precio: toNumber(tempPrices.current),
        precio_original: toNumber(tempPrices.original),
        descuento_porcentaje: Number(tempPrices.discount) || 0
    }

    try {
        const res = await fetch(`/api/products/${selectedProduct.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(updates)
        })

        if (!res.ok) throw new Error('Error al actualizar')

        setProducts(products.map(p => {
            if (p.id === selectedProduct.id) {
                return { ...p, ...updates }
            }
            return p
        }))

        toast.success('Oferta actualizada')
        setOfertaModalOpen(false)
    } catch (error) {
        toast.error('Error al actualizar')
    }
  }

  function updatePriceFromDiscount(discountInput: string) {
     const discount = Number(discountInput)
     const original = toNumber(tempPrices.original)
     
     let current = tempPrices.current
     if (original > 0) {
         const calculatedCurrent = Math.round(original - (original * discount / 100))
         current = formatPrice(calculatedCurrent)
     }
     setTempPrices(prev => ({ ...prev, discount: discountInput, current }))
  }

  function updateDiscountFromPrice(currentInput: string) {
      const current = toNumber(currentInput)
      const original = toNumber(tempPrices.original)
      
      let discount = '0'
      if (original > 0) {
          const calculatedDiscount = Math.round(((original - current) / original) * 100)
          discount = Math.max(0, calculatedDiscount).toString()
      }
      setTempPrices(prev => ({ ...prev, current: currentInput, discount }))
  }

  const filteredProducts = products.filter(p => 
    p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
    (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
  )

  if (loading) return <div className="text-white p-8">Cargando productos...</div>

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div>
            <h1 className="text-2xl font-black uppercase text-white tracking-widest">Categorización</h1>
            <p className="text-white/50 text-xs">Gestiona etiquetas y visibilidad de productos</p>
        </div>
        <div className="relative w-full md:w-64">
           <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/50" />
           <input 
             type="text" 
             placeholder="Buscar producto..." 
             value={searchTerm}
             onChange={e => setSearchTerm(e.target.value)}
             className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-accent transition-colors"
           />
        </div>
      </div>

      <div className="bg-white/[0.03] border border-white/10 rounded-xl overflow-hidden backdrop-blur-sm">
        {/* Desktop Table */}
        <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left text-sm text-white/70">
            <thead className="bg-white/5 text-white font-black uppercase tracking-wider text-[10px]">
                <tr>
                <th className="p-4">Producto</th>
                <th className="p-4 text-center">Oferta</th>
                <th className="p-4 text-center">Destacado</th>
                <th className="p-4 text-center">Top</th>
                <th className="p-4 text-center">Nuevo</th>
                <th className="p-4 text-center">Próximamente</th>
                </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
                {filteredProducts.map(product => {
                    // Check logic for fallback image to match ProductCard logic roughly
                    const getSafeImage = (p: Producto) => {
                        const url = p.imagen_url || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : null)
                        if (!url) return '/urban.png'
                        if (url.startsWith('http') && !url.includes('supabase.co')) return '/urban.png'
                        return url
                    }
                    const img = getSafeImage(product)
                    
                    return (
                    <tr key={product.id} className="hover:bg-white/[0.02] transition-colors">
                        <td className="p-4">
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg overflow-hidden bg-white/5 flex-shrink-0 border border-white/10">
                                <img src={img} className="w-full h-full object-cover" alt="" onError={(e) => (e.currentTarget.src = '/urban.png')} />
                            </div>
                            <div className="min-w-0">
                                <div className="font-bold text-white text-xs uppercase truncate">{product.nombre}</div>
                                <div className="text-[10px] opacity-50 font-mono">{product.sku || 'SIN SKU'}</div>
                            </div>
                        </div>
                        </td>
                        <td className="p-4 text-center">
                        <button 
                            onClick={() => openOfertaModal(product)} 
                            className={`p-3 rounded-lg transition-all active:scale-95 ${product.descuento_activo ? 'bg-pink-500/20 text-pink-400 shadow-[0_0_15px_-5px_rgba(236,72,153,0.5)]' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}
                            title="Gestionar Oferta"
                        >
                            <Tag className="w-5 h-5" />
                        </button>
                        </td>
                        <td className="p-4 text-center">
                        <button 
                            onClick={() => toggleField(product.id, 'destacado', !!product.destacado)} 
                            className={`p-3 rounded-lg transition-all active:scale-95 ${product.destacado ? 'bg-yellow-500/20 text-yellow-400 shadow-[0_0_15px_-5px_rgba(250,204,21,0.5)]' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}
                            title="Alternar Destacado"
                        >
                            <Star className="w-5 h-5" fill={product.destacado ? "currentColor" : "none"} />
                        </button>
                        </td>
                        <td className="p-4 text-center">
                        <button 
                            onClick={() => toggleField(product.id, 'top', !!product.top)} 
                            className={`p-3 rounded-lg transition-all active:scale-95 ${product.top ? 'bg-purple-500/20 text-purple-400 shadow-[0_0_15px_-5px_rgba(168,85,247,0.5)]' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}
                            title="Alternar Top Product"
                        >
                            <TrendingUp className="w-5 h-5" />
                        </button>
                        </td>
                        <td className="p-4 text-center">
                        <button 
                            onClick={() => toggleField(product.id, 'nuevo_lanzamiento', !!product.nuevo_lanzamiento)} 
                            className={`p-3 rounded-lg transition-all active:scale-95 ${product.nuevo_lanzamiento ? 'bg-green-500/20 text-green-400 shadow-[0_0_15px_-5px_rgba(74,222,128,0.5)]' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}
                            title="Alternar Nuevo Lanzamiento"
                        >
                            <Sparkles className="w-5 h-5" />
                        </button>
                        </td>
                        <td className="p-4 text-center">
                        <div className="flex flex-col items-center gap-1">
                            <button 
                                onClick={() => openProximoModal(product)} 
                                className={`p-3 rounded-lg transition-all active:scale-95 ${product.proximo_lanzamiento || product.proximamente ? 'bg-blue-500/20 text-blue-400 shadow-[0_0_15px_-5px_rgba(96,165,250,0.5)]' : 'text-white/20 hover:text-white/50 hover:bg-white/5'}`}
                                title="Gestionar Próximamente"
                            >
                                <Clock className="w-5 h-5" />
                            </button>
                            {(product.proximo_lanzamiento || product.proximamente) && product.fecha_lanzamiento && (
                                <>
                                    {new Date(product.fecha_lanzamiento) <= new Date() ? (
                                        <span className="text-[9px] font-black uppercase text-green-400 bg-green-500/10 px-1.5 py-0.5 rounded border border-green-500/20 whitespace-nowrap animate-pulse">
                                            ¡DESBLOQUEADO!
                                        </span>
                                    ) : (
                                        <span className="text-[9px] font-mono text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded border border-blue-500/20 whitespace-nowrap">
                                            {new Date(product.fecha_lanzamiento).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}
                                        </span>
                                    )}
                                </>
                            )}
                        </div>
                        </td>
                    </tr>
                )})}
            </tbody>
            </table>
        </div>

        {/* Mobile Card View */}
        <div className="md:hidden grid grid-cols-1 gap-4 p-4">
            {filteredProducts.map(product => {
                const getSafeImage = (p: Producto) => {
                    const url = p.imagen_url || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : null)
                    if (!url) return '/urban.png'
                    if (url.startsWith('http') && !url.includes('supabase.co')) return '/urban.png'
                    return url
                }
                const img = getSafeImage(product)
                return (
                    <div key={product.id} className="bg-white/5 rounded-2xl p-4 border border-white/10">
                        <div className="flex items-start gap-4 mb-4">
                            <div className="w-16 h-16 rounded-xl overflow-hidden bg-black/20 border border-white/10 flex-shrink-0">
                                <img src={img} className="w-full h-full object-cover" alt="" onError={(e) => (e.currentTarget.src = '/urban.png')} />
                            </div>
                            <div className="min-w-0 flex-1">
                                <h3 className="font-bold text-white text-sm uppercase truncate">{product.nombre}</h3>
                                <p className="text-[10px] opacity-50 font-mono mb-2">{product.sku || 'SIN SKU'}</p>
                            </div>
                        </div>
                        
                        <div className="grid grid-cols-5 gap-2">
                            <button 
                                onClick={() => openOfertaModal(product)} 
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${product.descuento_activo ? 'bg-pink-500/10 text-pink-400 border border-pink-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}
                            >
                                <Tag className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => toggleField(product.id, 'destacado', !!product.destacado)} 
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${product.destacado ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}
                            >
                                <Star className="w-4 h-4" fill={product.destacado ? "currentColor" : "none"} />
                            </button>
                            <button 
                                onClick={() => toggleField(product.id, 'top', !!product.top)} 
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${product.top ? 'bg-purple-500/10 text-purple-400 border border-purple-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}
                            >
                                <TrendingUp className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => toggleField(product.id, 'nuevo_lanzamiento', !!product.nuevo_lanzamiento)} 
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${product.nuevo_lanzamiento ? 'bg-green-500/10 text-green-400 border border-green-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}
                            >
                                <Sparkles className="w-4 h-4" />
                            </button>
                            <button 
                                onClick={() => openProximoModal(product)} 
                                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-xl transition-all ${product.proximo_lanzamiento || product.proximamente ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-white/5 text-white/20 border border-white/5'}`}
                            >
                                <Clock className="w-4 h-4" />
                            </button>
                        </div>
                    </div>
                )
            })}
        </div>
      </div>

      {/* Proximo Modal */}
      {proximoModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 relative">
                <button 
                    onClick={() => setProximoModalOpen(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center mx-auto mb-4">
                        <Clock className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">Próximo Lanzamiento</h3>
                    <p className="text-white/50 text-xs">Configura la fecha de disponibilidad</p>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition">
                        <span className="font-bold text-sm text-white">Activar Próximamente</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${tempProximoActive ? 'bg-blue-500' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${tempProximoActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={tempProximoActive} onChange={e => setTempProximoActive(e.target.checked)} />
                    </label>

                    {tempProximoActive && (
                        <div className="space-y-2 animate-in fade-in slide-in-from-top-2">
                            <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">Fecha y Hora</label>
                            <input 
                                type="datetime-local"
                                value={tempDate}
                                onChange={e => setTempDate(e.target.value)}
                                className="w-full bg-black border border-white/10 p-4 rounded-2xl text-sm font-bold text-white focus:border-blue-500 transition-all outline-none"
                            />
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSaveProximo}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Cambios
                </button>
            </div>
        </div>
      )}

      {/* Oferta Modal */}
      {ofertaModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in">
            <div className="bg-[#0f0f0f] border border-white/10 rounded-3xl p-6 w-full max-w-md shadow-2xl space-y-6 relative">
                <button 
                    onClick={() => setOfertaModalOpen(false)}
                    className="absolute top-4 right-4 text-white/40 hover:text-white transition-colors"
                >
                    <X className="w-5 h-5" />
                </button>
                
                <div className="text-center space-y-2">
                    <div className="w-12 h-12 rounded-full bg-pink-500/20 text-pink-400 flex items-center justify-center mx-auto mb-4">
                        <Tag className="w-6 h-6" />
                    </div>
                    <h3 className="text-xl font-black uppercase text-white tracking-wider">Oferta Especial</h3>
                    <p className="text-white/50 text-xs">Configura precios y descuentos</p>
                </div>

                <div className="space-y-4">
                    <label className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 cursor-pointer hover:bg-white/10 transition">
                        <span className="font-bold text-sm text-white">Activar Oferta</span>
                        <div className={`w-12 h-6 rounded-full p-1 transition-colors ${tempOfertaActive ? 'bg-pink-500' : 'bg-white/10'}`}>
                            <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${tempOfertaActive ? 'translate-x-6' : 'translate-x-0'}`} />
                        </div>
                        <input type="checkbox" className="hidden" checked={tempOfertaActive} onChange={e => setTempOfertaActive(e.target.checked)} />
                    </label>

                    {tempOfertaActive && (
                        <div className="space-y-4 animate-in fade-in slide-in-from-top-2">
                            <div className="space-y-2">
                                <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">Precio Original</label>
                                <div className="relative">
                                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                    <input 
                                        type="text"
                                        value={tempPrices.original}
                                        onChange={e => {
                                            const val = e.target.value
                                            const numVal = toNumber(val)
                                            const currentVal = toNumber(tempPrices.current)
                                            
                                            // Update state first
                                            let newPrices = { ...tempPrices, original: val }
                                            
                                            // Recalculate discount if possible
                                            if (numVal > 0 && currentVal > 0) {
                                                 const discount = Math.round(((numVal - currentVal) / numVal) * 100)
                                                 newPrices.discount = Math.max(0, discount).toString()
                                            }
                                            setTempPrices(newPrices)
                                        }}
                                        className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 rounded-2xl text-sm font-bold text-white focus:border-pink-500 transition-all outline-none"
                                        placeholder="0"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">Precio Oferta</label>
                                    <div className="relative">
                                        <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                        <input 
                                            type="text"
                                            value={tempPrices.current}
                                            onChange={e => updateDiscountFromPrice(e.target.value)}
                                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 rounded-2xl text-sm font-bold text-white focus:border-pink-500 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <label className="text-[10px] font-black uppercase text-white/40 tracking-widest px-1">Descuento</label>
                                    <div className="relative">
                                        <Percent className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                                        <input 
                                            type="number"
                                            value={tempPrices.discount}
                                            onChange={e => updatePriceFromDiscount(e.target.value)}
                                            className="w-full bg-black border border-white/10 pl-10 pr-4 py-4 rounded-2xl text-sm font-bold text-white focus:border-pink-500 transition-all outline-none"
                                            placeholder="0"
                                        />
                                    </div>
                                </div>
                            </div>
                        </div>
                    )}
                </div>

                <button 
                    onClick={handleSaveOferta}
                    className="w-full py-4 bg-white text-black rounded-2xl font-black uppercase tracking-widest hover:brightness-90 transition-all active:scale-[0.98] flex items-center justify-center gap-2"
                >
                    <Save className="w-4 h-4" /> Guardar Cambios
                </button>
            </div>
        </div>
      )}
    </div>
  )
}
