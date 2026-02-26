'use client'

import { useEffect, useState, useMemo, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { productosAPI, type Producto } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import { ShoppingBag, ChevronLeft, ChevronRight, Minus, Plus, ArrowLeft, Ticket, Bell } from 'lucide-react'
import Image from 'next/image'
import toast from 'react-hot-toast'
import ProductCard from '@/components/ProductCard'
import dynamic from 'next/dynamic'
import { formatPrice } from '@/lib/formatters'

const ProductReviews = dynamic(() => import('@/components/ProductReviews'), {
  ssr: false,
  loading: () => <div className="text-gray-500 text-[10px] font-black uppercase tracking-widest text-center py-10 opacity-30">Cargando experiencias...</div>
})

interface Etiqueta { id: string; nombre: string; tipo: string; color: string; icono: string }

export default function ProductDetailPage() {
  const params = useParams()
  const router = useRouter()
  const productSlug = decodeURIComponent(params.id as string)
  
  const [producto, setProducto] = useState<(Producto & { etiquetas?: Etiqueta[] }) | null>(null)
  const [productosRelacionados, setProductosRelacionados] = useState<Producto[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedImage, setSelectedImage] = useState(0)
  const [selectedTalle, setSelectedTalle] = useState('')
  const [selectedColor, setSelectedColor] = useState('')
  const [cantidad, setCantidad] = useState(1)
  const [isImageLoading, setIsImageLoading] = useState(true)
  
  const addItem = useCartStore((state) => state.addItem)

  const cargarProducto = useCallback(async () => {
    try {
      setLoading(true)
      let data: Producto | undefined
      
      // Intentar por slug primero
      data = await productosAPI.obtenerPorSlug(productSlug)
      
      // Fallback por ID (si el slug no devolvió nada o si parece un ID)
      if (!data) {
        data = await productosAPI.obtenerPorId(productSlug)
      }
      
      if (!data || !data.activo) {
        setProducto(null)
        return
      }
      
      setProducto(data)
      
      if (data && data.categoria_id) {
        const d = data as Producto
        const todos = await productosAPI.obtenerTodos()
        setProductosRelacionados(
          todos
            .filter(p => p.categoria_id === d.categoria_id && p.id !== d.id && (p.stock_actual || 0) > 0)
            .slice(0, 4)
        )
      }
    } catch (error) {
      console.error('Error cargando producto:', error)
      // No mostramos toast de error si es simplemente un 404
    } finally {
      setLoading(false)
    }
  }, [productSlug])

  useEffect(() => { 
    window.scrollTo(0, 0)
    cargarProducto() 
  }, [productSlug, cargarProducto])

  const variantes = producto?.variantes || []
  const hasVariants = variantes.length > 0
  
  // Helper para verificar stock
  const checkStock = (talle: string, colorHex: string) => {
    const v = variantes.find(v => v.talle === talle && v.color === colorHex)
    return (v?.stock || 0) > 0
  }

  const availableSizes = useMemo(() => {
    // Obtener todos los talles únicos
    const sizes = Array.from(new Set(variantes.map(v => v.talle))).filter(Boolean)
    // Mapear a objetos con info de stock
    return sizes.map(t => ({
      name: t,
      hasStock: variantes.some(v => v.talle === t && v.stock > 0)
    }))
  }, [variantes])

  const availableColors = useMemo(() => {
    let filtered = variantes
    if (selectedTalle) {
      filtered = variantes.filter(v => v.talle === selectedTalle)
    }
    
    const uniqueColors = new Map()
    filtered.forEach(v => {
      if (v.color && !uniqueColors.has(v.color)) {
        uniqueColors.set(v.color, {
          hex: v.color,
          name: v.color_nombre || v.color, // Fallback a hex si no hay nombre
          stock: v.stock
        })
      }
    })
    
    return Array.from(uniqueColors.values())
  }, [variantes, selectedTalle])

  const stockDisponible = useMemo(() => {
    if (!hasVariants) return producto?.stock_actual || 0
    if (selectedTalle && selectedColor) return variantes.find(v => v.talle === selectedTalle && v.color === selectedColor)?.stock || 0
    return 0 // Si no hay selección completa, asumimos 0 para seguridad en botón, aunque mostremos info diferente
  }, [hasVariants, producto, variantes, selectedTalle, selectedColor])

  // Reset color si cambiamos talle y el color no existe en ese talle
  useEffect(() => {
    if (selectedTalle && selectedColor) {
      const exists = variantes.some(v => v.talle === selectedTalle && v.color === selectedColor)
      if (!exists) setSelectedColor('')
    }
  }, [selectedTalle, variantes]) // Remove selectedColor from dependency to avoid loop

  const imagenes = useMemo(() => {
    const imgs: string[] = []
    
    // Prioridad 1: Array de imágenes
    if (Array.isArray(producto?.imagenes) && producto.imagenes.length > 0) {
      imgs.push(...producto.imagenes)
    }
    
    // Prioridad 2: imagen_url principal (si no está ya en el array)
    if (producto?.imagen_url && !imgs.includes(producto.imagen_url)) {
      imgs.unshift(producto.imagen_url)
    }

    // Prioridad 3: Imágenes de variantes
    if (producto?.variantes) {
      producto.variantes.forEach((v: any) => {
        if (v.imagen_url && !imgs.includes(v.imagen_url)) {
          imgs.push(v.imagen_url)
        }
      })
    }
    
    // Fallback: Imagen de proximamente
    return imgs.length > 0 ? imgs : ['/proximamente.png']
  }, [producto?.imagenes, producto?.imagen_url, producto?.variantes])

  // Cambiar imagen al seleccionar variante
  useEffect(() => {
    if (selectedTalle && selectedColor) {
      const variant = variantes.find(v => v.talle === selectedTalle && v.color === selectedColor) as any
      if (variant?.imagen_url) {
        const idx = imagenes.indexOf(variant.imagen_url)
        if (idx !== -1) setSelectedImage(idx)
      }
    }
  }, [selectedTalle, selectedColor, variantes, imagenes])

  const { precioTransferencia, precioCuotas } = useMemo(() => ({
    precioTransferencia: producto ? Math.round(producto.precio * 0.9) : 0,
    precioCuotas: producto ? Math.round(producto.precio / 6) : 0
  }), [producto?.precio])

  const discountPercent = producto ? (producto.descuento_porcentaje || (producto.precio_original && producto.precio_original > producto.precio ? Math.round(((producto.precio_original - producto.precio) / producto.precio_original) * 100) : 0)) : 0
  
  if (loading) return <div className="min-h-screen bg-transparent flex items-center justify-center"><div className="w-8 h-8 border-2 border-white/10 border-t-white rounded-full animate-spin" /></div>
  if (!producto) return <div className="min-h-screen bg-transparent flex items-center justify-center text-xs font-black uppercase tracking-widest text-white/60">Producto no hallado</div>

  const isProximoLanzamiento = (producto as any).proximo_lanzamiento || (producto as any).proximamente
  const primaryDrop = Array.isArray((producto as any).drops) && (producto as any).drops.length > 0
    ? (producto as any).drops[0]
    : null

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-white selection:text-black pb-20 overflow-x-hidden relative z-10">
      <div className="max-w-5xl mx-auto px-4 md:px-6 relative z-10 scale-[0.95] origin-top transition-all pt-10">
        
        <div className="pb-6 flex items-center justify-between">
          <button onClick={() => router.back()} className="group flex items-center gap-2 text-white/50 hover:text-white transition-all text-[9px] font-black uppercase tracking-[0.2em]">
            <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
            <span>Volver</span>
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Images Section - Shrunken by 10% visually via col-span and padding */}
          <div className="lg:col-span-6 space-y-4 px-4">
            <div className="relative aspect-[4/5] bg-white/[0.02] border border-white/5 rounded-[35px] overflow-hidden group">
               {isImageLoading && (
                 <div className="absolute inset-0 flex items-center justify-center z-10 bg-black/20 backdrop-blur-sm transition-all duration-300">
                    <div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" />
                 </div>
               )}
               <Image 
                 src={imagenes[selectedImage]} 
                 alt={producto.nombre} 
                 fill 
                 className={`object-cover group-hover:scale-105 transition-all duration-700 ease-out ${isImageLoading ? 'scale-110 blur-lg grayscale' : 'scale-100 blur-0 grayscale-0'}`}
                 priority 
                 onLoad={() => setIsImageLoading(false)}
               />
               <div className="absolute inset-x-0 bottom-4 px-4 flex justify-between items-center opacity-0 group-hover:opacity-100 transition-opacity z-20">
                 <button onClick={(e) => { e.stopPropagation(); setIsImageLoading(true); setSelectedImage(prev => (prev - 1 + imagenes.length) % imagenes.length) }} className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><ChevronLeft className="w-5 h-5" /></button>
                 <button onClick={(e) => { e.stopPropagation(); setIsImageLoading(true); setSelectedImage(prev => (prev + 1) % imagenes.length) }} className="w-10 h-10 bg-white text-black rounded-xl flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"><ChevronRight className="w-5 h-5" /></button>
               </div>
            </div>
            {imagenes.length > 1 && (
               <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar">
                  {imagenes.map((img, i) => (
                    <button key={i} onClick={() => { if(selectedImage !== i) { setIsImageLoading(true); setSelectedImage(i); } }} className={`w-14 h-18 rounded-xl overflow-hidden border transition-all shrink-0 ${selectedImage === i ? 'border-white' : 'border-white/5 opacity-30 hover:opacity-100'}`}>
                      <Image src={img} alt="" width={60} height={80} className="w-full h-full object-cover" />
                    </button>
                  ))}
               </div>
            )}
          </div>

          {/* Details Section - Compacted and Shrunken by 20% */}
          <div className="lg:col-span-5 lg:col-offset-1 space-y-6">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-black tracking-tighter uppercase italic leading-none">{producto.nombre}</h1>
              {primaryDrop && (
                <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/10 border border-accent/40">
                  <span className="text-[8px] font-black text-accent tracking-[0.3em]">DROP</span>
                  <span className="text-[9px] font-black text-white uppercase tracking-[0.2em]">
                    {String(primaryDrop.nombre || '').toUpperCase()}
                  </span>
                </div>
              )}
              <p className="text-white/45 text-[10px] font-bold uppercase tracking-widest">REF: {producto.slug?.toUpperCase()}</p>
            </div>

            {/* Compact Price Panel */}
            <section className="bg-white/[0.03] border border-white/10 p-6 rounded-[35px] shadow-2xl relative overflow-hidden scale-[0.95] origin-left backdrop-blur-xl">
               <div className="absolute top-0 right-0 p-4 opacity-10 text-accent"><Ticket className="w-24 h-24 rotate-12" /></div>
               <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[8px] font-black text-white/45 uppercase tracking-widest block">Precio Online</span>
                      {discountPercent > 0 && (
                        <span className="bg-white text-black text-[10px] font-black px-2 py-0.5 rounded-sm">
                          {discountPercent}% OFF
                        </span>
                      )}
                    </div>
                    <div className="flex items-baseline gap-3">
                      <span className="text-3xl font-black tracking-tighter leading-none text-white">
                        $<span suppressHydrationWarning>
                          { formatPrice(producto.precio) }
                        </span>
                      </span>
                      {producto.precio_original && discountPercent > 0 && (
                        <span className="text-lg font-bold text-white/30 line-through decoration-white/30">
                          $<span suppressHydrationWarning>
                            { formatPrice(producto.precio_original) }
                          </span>
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="space-y-3 pt-4 border-t border-white/10">
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase text-accent tracking-tight">Efectivo / Transf.</p>
                       <span className="text-xl font-black text-accent">
                         $<span suppressHydrationWarning>
                           {formatPrice(precioTransferencia)}
                         </span>
                       </span>
                    </div>
                    <div className="flex items-center justify-between">
                       <p className="text-[10px] font-black uppercase text-accent2 tracking-tight">6 cuotas fijas de</p>
                       <span className="text-lg font-black text-accent2">
                         $<span suppressHydrationWarning>
                           {formatPrice(precioCuotas)}
                         </span>
                       </span>
                    </div>
                  </div>
               </div>
            </section>

            {/* Compact Selection Area */}
            <div className="space-y-6 bg-white/[0.03] border border-white/10 p-6 rounded-[35px] scale-[0.9] origin-top backdrop-blur-xl relative overflow-hidden">
              
            {isProximoLanzamiento ? (
                <div className="py-8 text-center space-y-6">
                  <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4 border border-white/10">
                    <Bell className="w-8 h-8 text-white/40" />
                  </div>
                  <div>
                    <h3 className="text-xl font-black text-white uppercase tracking-widest mb-2">Próximamente</h3>
                    <p className="text-white/40 text-xs font-medium max-w-[250px] mx-auto">
                      Este producto aún no está disponible para la venta.
                    </p>
                  </div>

                  <div className="bg-white/5 border border-white/10 rounded-xl p-4 inline-block">
                    <p className="text-white/60 text-xs font-bold uppercase tracking-widest flex items-center gap-2">
                      SIN STOCK
                    </p>
                  </div>
                </div>
              ) : (
                <>
              {availableSizes.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.2em]">Talle Disponible</label>
                  <div className="flex flex-wrap gap-1.5">
                    {availableSizes.map(({ name, hasStock }) => (
                      <button 
                        key={name} 
                        onClick={() => { setSelectedTalle(name); setSelectedColor('') }} 
                        disabled={!hasStock}
                        className={`px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all 
                          ${selectedTalle === name 
                            ? 'bg-accent text-ink shadow-lg shadow-accent/10' 
                            : hasStock 
                              ? 'bg-white/5 text-white/55 hover:text-white border border-transparent hover:border-white/10' 
                              : 'bg-white/5 text-white/20 cursor-not-allowed decoration-slice line-through opacity-50'
                          }`}
                      >
                        {name}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {availableColors.length > 0 && (
                <div className="space-y-3">
                  <label className="text-[9px] font-black text-white/55 uppercase tracking-[0.2em]">Color</label>
                  <div className="flex flex-wrap gap-2">
                    {availableColors.map(({ hex, name, stock }) => (
                      <button 
                        key={hex} 
                        onClick={() => setSelectedColor(hex)} 
                        disabled={stock <= 0}
                        title={`${name} ${stock <= 0 ? '(Sin Stock)' : ''}`}
                        className={`w-8 h-8 rounded-full border-2 transition-all p-0.5 relative group
                          ${selectedColor === hex 
                            ? 'border-accent scale-105 shadow-lg shadow-accent/10' 
                            : stock > 0 
                              ? 'border-white/10 opacity-50 hover:opacity-100' 
                              : 'border-white/5 opacity-20 cursor-not-allowed'
                          }`}
                      >
                        <div className="w-full h-full rounded-full" style={{ backgroundColor: hex }} />
                        {stock <= 0 && (
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="w-full h-0.5 bg-white/50 -rotate-45" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="pt-2 flex items-center justify-between">
                {(!hasVariants || (selectedTalle && selectedColor)) && stockDisponible <= 0 ? (
                  <div className="w-full">
                    <div className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                      <p className="text-[10px] font-bold text-white/60 uppercase tracking-widest">
                        SIN STOCK
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="flex items-center gap-3 bg-white/5 p-1.5 rounded-xl border border-white/10">
                       <button type="button" onClick={() => setCantidad(Math.max(1, cantidad - 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/55 hover:text-white transition-all"><Minus className="w-3 h-3" /></button>
                       <span className="text-sm font-black w-6 text-center">{cantidad}</span>
                       <button type="button" onClick={() => setCantidad(Math.min(stockDisponible, cantidad + 1))} className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-white/10 text-white/55 hover:text-white transition-all"><Plus className="w-3 h-3" /></button>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        if (hasVariants && (!selectedTalle || !selectedColor)) return toast.error('Elige opciones')
                        if (stockDisponible <= 0 || cantidad > stockDisponible) return toast.error('SIN STOCK')
                        addItem({
                          id: String(producto.id),
                          nombre: producto.nombre,
                          precio: producto.precio,
                          cantidad,
                          imagen_url: imagenes[selectedImage],
                          stock: stockDisponible,
                          ...(hasVariants && { talle: selectedTalle, color: selectedColor })
                        })
                        toast.success('Agregado')
                      }}
                      disabled={!!(hasVariants && (!selectedTalle || !selectedColor))}
                      className="flex-1 ml-4 bg-accent text-ink py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-2 group disabled:opacity-30"
                    >
                      <ShoppingBag className="w-4 h-4 group-hover:-rotate-12 transition-transform" />
                      {hasVariants && (!selectedTalle || !selectedColor) ? 'ELEGIR OPCIONES' : 'Sumar a la bolsa'}
                    </button>
                  </>
                )}
              </div>
              
              {hasVariants && selectedTalle && selectedColor && stockDisponible > 0 && (
                <div className="flex justify-end pt-2">
                  <span className="text-[9px] font-black text-green-400 uppercase tracking-widest animate-pulse">
                    ¡Quedan {stockDisponible} unidades!
                  </span>
                </div>
              )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Reviews Section */}
        <div className="mt-10">
          <ProductReviews productId={String(producto.id)} productName={producto.nombre} />
        </div>

        {/* Minimal Related Section */}
        {productosRelacionados.length > 0 && (
          <div className="mt-20 opacity-80">
            <h2 className="text-[10px] font-black uppercase tracking-[0.4em] text-white/45 text-center mb-10">MÁS PARA TU FIT</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {productosRelacionados.map((p) => <ProductCard key={p.id} producto={p} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function TicketIcon(props: any) {
  return (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 17v2"/><path d="M13 11v2"/></svg>
  )
}
