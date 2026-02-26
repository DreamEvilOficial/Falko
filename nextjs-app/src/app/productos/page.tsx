'use client'

import { useState, useEffect, useMemo, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { type Producto } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import DynamicTitle from '@/components/DynamicTitle'
import Image from 'next/image'
import { SlidersHorizontal, X, Tag } from 'lucide-react'

function ProductosContent() {
  const [allProductos, setAllProductos] = useState<Producto[]>([])
  const [allCategorias, setAllCategorias] = useState<any[]>([])
  const [filtrosEspeciales, setFiltrosEspeciales] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [categoriaNombre, setCategoriaNombre] = useState('')
  const [subcategoriaNombre, setSubcategoriaNombre] = useState('')
  const searchParams = useSearchParams()

  const categoriaSlug = searchParams.get('categoria_slug') || searchParams.get('categoria')
  const subcategoriaSlug = searchParams.get('subcategoria_slug') || searchParams.get('subcategoria')
  const filterParam = searchParams.get('filter') || ''
  // Normalizar filtro: quitar slashes y pasar a minusculas
  const normalizedFilter = filterParam.replace(/^\/+|\/+$/g, '').toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  const searchQuery = searchParams.get('q') || ''

  // Filter States
  const [selectedSizes, setSelectedSizes] = useState<string[]>([])
  const [selectedColors, setSelectedColors] = useState<string[]>([])
  const [priceRange, setPriceRange] = useState({ min: '', max: '' })
  const [onlyOffers, setOnlyOffers] = useState(false)
  const [showMobileFilters, setShowMobileFilters] = useState(false)

  // Derived available filter options
  const availableOptions = useMemo(() => {
    const clothingSizes = new Set<string>()
    const shoeSizes = new Set<string>()
    const colors = new Set<string>()
    let min = Infinity
    let max = 0

    allProductos.forEach((p: any) => {
      const vars = p.variantes || []
      vars.forEach((v: any) => {
        if (v.talle) {
          const t = String(v.talle).toUpperCase()
          // Si es numérico (ej: "38", "40") o parece talle de calzado
          if (/^\d+(\.\d+)?$/.test(t) || ['35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45', '46'].includes(t)) {
            shoeSizes.add(t)
          } else {
            clothingSizes.add(t)
          }
        }
        if (v.color) colors.add(String(v.color.toLowerCase()))
      })
      if (p.precio < min) min = p.precio
      if (p.precio > max) max = p.precio
    })

    // Sort helper for clothing sizes
    const sizeOrder = ['XXXS', 'XXS', 'XS', 'S', 'M', 'L', 'XL', 'XXL', 'XXXL', 'UNI']
    const sortClothing = (a: string, b: string) => {
      const idxA = sizeOrder.indexOf(a)
      const idxB = sizeOrder.indexOf(b)
      if (idxA !== -1 && idxB !== -1) return idxA - idxB
      if (idxA !== -1) return -1
      if (idxB !== -1) return 1
      return a.localeCompare(b)
    }

    return {
      clothingSizes: Array.from(clothingSizes).sort(sortClothing),
      shoeSizes: Array.from(shoeSizes).sort((a, b) => Number(a) - Number(b)),
      colors: Array.from(colors).sort(),
      absMin: min === Infinity ? 0 : min,
      absMax: max
    }
  }, [allProductos])

  // Initial Load
  useEffect(() => {
    async function load() {
      try {
        setLoading(true)
        // Load products with server-side filtering optimization
        let productsUrl = '/api/products?active=true'

        // Apply server-side filters for better performance
        if (normalizedFilter === 'nuevos' || normalizedFilter === 'nuevos-ingresos') {
          productsUrl += '&new=true'
        } else if (normalizedFilter === 'proximamente') {
          productsUrl += '&upcoming=true'
        } else if (normalizedFilter === 'descuentos' || normalizedFilter === 'ofertas') {
          productsUrl += '&discount=true'
        }

        const resProd = await fetch(productsUrl)
        const dataProd = await resProd.json()
        setAllProductos(dataProd || [])

        // Load all categories for search mapping
        const resAllCats = await fetch('/api/categories')
        const dataAllCats = resAllCats.ok ? await resAllCats.json() : []
        setAllCategorias(dataAllCats)

        // Load special filters
        const resFilters = await fetch('/api/filters')
        const dataFilters = resFilters.ok ? await resFilters.json() : []
        setFiltrosEspeciales(dataFilters)

        if (categoriaSlug) {
          setCategoriaNombre('')
          setSubcategoriaNombre('')

          const cat = dataAllCats.find((c: any) => c.slug === categoriaSlug)

          if (cat) {
            setCategoriaNombre(cat.nombre)
            if (subcategoriaSlug && cat.subcategorias) {
              const sub = (cat.subcategorias as any[]).find(s => s.slug === subcategoriaSlug)
              if (sub) setSubcategoriaNombre(sub.nombre)
            }
          }
        }
      } catch (e) { console.error(e) } finally { setLoading(false) }
    }
    load()
  }, [categoriaSlug, subcategoriaSlug, filterParam])

  // Computation of filtered products
  const productosFiltrados = useMemo(() => {
    let result = [...allProductos]

    // 1. Category/Subcategory filtering
    if (categoriaSlug) {
      // Simplistic check. Ideally backend filters.
    }

    // 2. Special URL Filters
    if (normalizedFilter === 'descuentos' || normalizedFilter === 'ofertas') {
      result = result.filter(p => {
        const hasDiscount = p.descuento_activo === true || p.descuento_activo === 1
        const priceDiff = p.precio_original && p.precio_original > p.precio
        return hasDiscount || priceDiff
      })
    } else if (normalizedFilter === 'nuevos' || normalizedFilter === 'nuevos-ingresos') {
      result = result.filter(p => {
        if (p.nuevo_lanzamiento) return true
        // Check date if present (<= 30 days since launch)
        if (p.fecha_lanzamiento) {
          const launchDate = new Date(p.fecha_lanzamiento)
          const now = new Date()
          const diffTime = Math.abs(now.getTime() - launchDate.getTime())
          const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
          if (launchDate > now) return false // It's upcoming
          return diffDays <= 30
        }
        return false
      })
    } else if (normalizedFilter === 'proximamente') {
      result = result.filter(p => (p.proximo_lanzamiento || p.proximamente))
    } else if (normalizedFilter) {
      // Check dynamic filters
      const dynamicFilter = filtrosEspeciales.find(f => f.clave.replace(/^\/+|\/+$/g, '').toLowerCase() === normalizedFilter)

      if (dynamicFilter) {
        // Parse config if needed (it should be object from API but verify)
        let config = dynamicFilter.config
        if (typeof config === 'string') {
          try { config = JSON.parse(config) } catch (e) { config = null }
        }

        let filterApplied = false

        if (config) {
          if (config.contenidoTipo === 'productos' && Array.isArray(config.contenidoProductoIds) && config.contenidoProductoIds.length > 0) {
            // Filter by specific product IDs
            result = result.filter(p => config.contenidoProductoIds.includes(String(p.id)))
            filterApplied = true
          } else if (config.contenidoTipo === 'categorias' && Array.isArray(config.contenidoCategoriaIds) && config.contenidoCategoriaIds.length > 0) {
            // Filter by categories
            result = result.filter(p => config.contenidoCategoriaIds.includes(String(p.categoria_id)))
            filterApplied = true
          }
        }

        // Si no se aplicó filtro por configuración explícita (vacío o no configurado)
        // Intentamos inferir por palabras clave comunes
        if (!filterApplied) {
          if (normalizedFilter.includes('liquidacion') || normalizedFilter.includes('sale') || normalizedFilter.includes('outlet') || normalizedFilter.includes('off')) {
            result = result.filter(p => (p.precio_original && p.precio_original > p.precio) || p.descuento_activo)
          } else if (normalizedFilter.includes('nuevo')) {
            result = result.filter(p => p.nuevo_lanzamiento)
          }
        }
      }
    }

    // 3. User UI Filters
    if (onlyOffers) result = result.filter(p => (p.precio_original && p.precio_original > p.precio))
    if (priceRange.min) result = result.filter(p => p.precio >= Number(priceRange.min))
    if (priceRange.max) result = result.filter(p => p.precio <= Number(priceRange.max))

    if (selectedSizes.length > 0) {
      result = result.filter((p: any) => {
        const vars = p.variantes || []
        return vars.some((v: any) => selectedSizes.includes(String(v.talle)))
      })
    }

    if (selectedColors.length > 0) {
      result = result.filter((p: any) => {
        const vars = p.variantes || []
        return vars.some((v: any) => selectedColors.includes(String(v.color).toLowerCase()))
      })
    }

    if (searchQuery) {
      const q = searchQuery.toLowerCase()
      result = result.filter(p => {
        const cat = allCategorias.find(c => c.id === p.categoria_id)
        const catName = cat ? cat.nombre.toLowerCase() : ''

        let subcatName = ''
        if (cat && cat.subcategorias && p.subcategoria_id) {
          const sub = cat.subcategorias.find((s: any) => s.id === p.subcategoria_id)
          if (sub) subcatName = sub.nombre.toLowerCase()
        }

        return p.nombre.toLowerCase().includes(q) || catName.includes(q) || subcatName.includes(q)
      })
    }

    return result
  }, [allProductos, normalizedFilter, onlyOffers, priceRange, selectedSizes, selectedColors, searchQuery, categoriaSlug, allCategorias, filtrosEspeciales])

  // Title Logic
  const getTitleInfo = () => {
    if (searchQuery) {
      return { text: `BÚSQUEDA: "${searchQuery.toUpperCase()}"`, element: `BÚSQUEDA: "${searchQuery.toUpperCase()}"` }
    }

    // Fix: Prioritize hardcoded special filters to ensure correct display and avoid duplication
    if (normalizedFilter === 'descuentos' || normalizedFilter === 'ofertas') {
      return {
        text: 'DESCUENTOS',
        element: (
          <span className="flex items-center gap-3 md:gap-5">
            DESCUENTOS
            <img src="/discount-icon.gif?v=2" alt="Descuento" width={60} height={60} className="w-10 h-10 md:w-16 md:h-16 -mt-2 object-contain" />
          </span>
        )
      }
    }

    if (normalizedFilter === 'nuevos' || normalizedFilter === 'nuevos-ingresos') {
      return {
        text: 'NUEVOS INGRESOS',
        element: (
          <span className="flex items-center gap-3 md:gap-5">
            NUEVOS INGRESOS
            <img src="/new-label.gif?v=2" alt="Nuevo" width={60} height={60} className="w-10 h-10 md:w-16 md:h-16 -mt-2 object-contain" />
          </span>
        )
      }
    }

    if (normalizedFilter === 'proximamente') {
      return {
        text: 'PRÓXIMAMENTE',
        element: (
          <span className="flex items-center gap-3 md:gap-5">
            PRÓXIMAMENTE
            <img src="/fire.gif?v=2" alt="Próximamente" width={60} height={60} className="w-10 h-10 md:w-16 md:h-16 -mt-2 object-contain" />
          </span>
        )
      }
    }

    // Primero intentar buscar en filtros dinámicos
    const dynamicFilter = filtrosEspeciales.find(f => {
      const filterClave = f.clave.replace(/^\/+|\/+$/g, '').toLowerCase()
      return filterClave === normalizedFilter
    })

    if (dynamicFilter) {
      return {
        text: dynamicFilter.nombre.toUpperCase(),
        element: (
          <span className="flex items-center gap-3 md:gap-5">
            {dynamicFilter.nombre.toUpperCase()}
            {dynamicFilter.imagen_url ? (
              <div className="relative w-10 h-10 md:w-16 md:h-16 -mt-2">
                <Image
                  src={dynamicFilter.imagen_url}
                  alt={dynamicFilter.nombre}
                  fill
                  className="object-contain"
                  unoptimized
                />
              </div>
            ) : (
              // Fix: Compare case-insensitive to prevent duplication
              // Also normalize accents to handle "Próximamente" vs "PROXIMAMENTE"
              (() => {
                const normalizeText = (text: string) => text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
                const iconTextNormalized = normalizeText(dynamicFilter.icono || '');
                const nameTextNormalized = normalizeText(dynamicFilter.nombre || '');

                if (dynamicFilter.icono && iconTextNormalized !== nameTextNormalized && (/\p{Emoji}/u.test(dynamicFilter.icono) || dynamicFilter.icono.length < 20)) {
                  return <span className="text-2xl md:text-4xl">{dynamicFilter.icono}</span>
                }
                return null;
              })()
            )}
          </span>
        )
      }
    }

    if (normalizedFilter === 'proximamente') {
      return {
        text: 'PRÓXIMAMENTE',
        element: (
          <span className="flex items-center gap-3 md:gap-5">
            PRÓXIMAMENTE
            <img src="/fire.gif" alt="Próximamente" width={60} height={60} className="w-10 h-10 md:w-16 md:h-16 -mt-2 object-contain" />
          </span>
        )
      }
    }

    // Generic filter fallback
    if (normalizedFilter) {
      const text = normalizedFilter.replace(/-/g, ' ').toUpperCase()
      return { text, element: text }
    }

    const text = (subcategoriaNombre || categoriaNombre || (categoriaSlug ? categoriaSlug.replace(/-/g, ' ') : 'COLECCIÓN')).toUpperCase()
    return { text, element: text }
  }

  const { text: titleText, element: titleElement } = getTitleInfo()

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [normalizedFilter, categoriaSlug, subcategoriaSlug, searchQuery])

  return (
    <div className="min-h-screen bg-transparent text-white relative z-10 overflow-x-hidden">
      <DynamicTitle title={`${titleText} / Urban Indumentaria`} />

      <div className="max-w-[1400px] mx-auto px-4 md:px-10 pt-16 pb-20 relative z-10">

        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-8 mb-12 border-b border-white/5 pb-10">
          <div>
            <h1 className="text-5xl md:text-7xl font-black tracking-tighter uppercase italic leading-none">{titleElement}</h1>
            <div className="text-[10px] font-black text-white/45 uppercase tracking-[0.4em] mt-4 flex items-center gap-3">
              <div className="w-8 h-[1px] bg-white/10" /> EXPLORANDO {productosFiltrados.length} ARTÍCULOS
            </div>
          </div>

          <button
            onClick={() => setShowMobileFilters(true)}
            className="md:hidden flex items-center justify-center gap-2 bg-accent text-ink py-4 px-6 rounded-2xl font-black text-xs uppercase tracking-widest hover:brightness-95"
          >
            <SlidersHorizontal className="w-4 h-4" /> Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">

          {/* Desktop Sidebar - Liquid Glass */}
          <aside className="hidden md:block lg:col-span-3 space-y-8">
            <div className="sticky top-10 space-y-8">

              {/* Reset All */}
              {(selectedSizes.length > 0 || selectedColors.length > 0 || onlyOffers || priceRange.min || priceRange.max) && (
                <button
                  onClick={() => { setSelectedSizes([]); setSelectedColors([]); setPriceRange({ min: '', max: '' }); setOnlyOffers(false); }}
                  className="flex items-center gap-2 text-[10px] font-black text-pink-500 uppercase tracking-widest hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" /> REINICIAR FILTROS
                </button>
              )}

              {/* Price Filter */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] flex items-center justify-between">
                  Precio <span>$</span>
                </h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="number" placeholder="MÍN" value={priceRange.min}
                    onChange={e => setPriceRange({ ...priceRange, min: e.target.value })}
                    className="bg-white/5 border border-white/5 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/20"
                  />
                  <input
                    type="number" placeholder="MÁX" value={priceRange.max}
                    onChange={e => setPriceRange({ ...priceRange, max: e.target.value })}
                    className="bg-white/5 border border-white/5 p-3 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none focus:border-white/20"
                  />
                </div>
              </div>

              {/* Toggle Offers */}
              <button
                onClick={() => setOnlyOffers(!onlyOffers)}
                className={`w-full flex items-center justify-between p-4 rounded-2xl border transition-all ${onlyOffers ? 'bg-white text-black border-white' : 'bg-white/5 border-white/5 hover:border-white/20'
                  }`}
              >
                <span className="text-[10px] font-black uppercase tracking-widest">Solo en Ofertas</span>
                <Tag className={`w-4 h-4 ${onlyOffers ? 'text-black' : 'text-pink-500'}`} />
              </button>

              {/* Clothing Sizes */}
              {availableOptions.clothingSizes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Talles Indumentaria</h4>
                  <div className="flex flex-wrap gap-2">
                    {availableOptions.clothingSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                        className={`min-w-[40px] h-10 px-3 rounded-lg text-[10px] font-black uppercase transition-all border ${selectedSizes.includes(size)
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Shoe Sizes */}
              {availableOptions.shoeSizes.length > 0 && (
                <div className="space-y-4">
                  <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Talles Calzado</h4>
                  <div className="grid grid-cols-4 gap-2">
                    {availableOptions.shoeSizes.map(size => (
                      <button
                        key={size}
                        onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                        className={`h-10 rounded-lg text-[10px] font-black uppercase transition-all border ${selectedSizes.includes(size)
                          ? 'bg-white text-black border-white'
                          : 'bg-transparent text-gray-400 border-white/10 hover:border-white/30 hover:text-white'
                          }`}
                      >
                        {size}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Colors */}
              <div className="space-y-4">
                <h4 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em]">Color</h4>
                <div className="flex flex-wrap gap-3">
                  {availableOptions.colors.map(color => (
                    <button
                      key={color}
                      onClick={() => setSelectedColors(prev => prev.includes(color) ? prev.filter(c => c !== color) : [...prev, color])}
                      className={`w-8 h-8 rounded-full border-2 p-0.5 transition-all ${selectedColors.includes(color) ? 'border-white scale-110 shadow-lg shadow-white/10' : 'border-white/5 opacity-40 hover:opacity-100'
                        }`}
                    >
                      <div className="w-full h-full rounded-full" style={{ backgroundColor: color }} />
                    </button>
                  ))}
                </div>
              </div>

            </div>
          </aside>

          {/* Product Grid Area */}
          <main className="lg:col-span-9">
            {loading ? (
              <div className="flex justify-center py-40 opacity-20"><div className="w-10 h-10 border-2 border-white/20 border-t-white rounded-full animate-spin" /></div>
            ) : productosFiltrados.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-y-12 gap-x-6">
                {productosFiltrados.map((p) => (
                  <ProductCard key={p.id} producto={p} />
                ))}
              </div>
            ) : (
              <div className="aspect-video flex flex-col items-center justify-center bg-white/[0.02] rounded-[40px] border border-dashed border-white/5 p-10">
                <SlidersHorizontal className="w-10 h-10 text-gray-800 mb-6" />
                <p className="text-[10px] font-black text-gray-600 uppercase tracking-widest text-center">
                  No hay resultados con estos filtros.<br />Intentá con otros parámetros.
                </p>
              </div>
            )}
          </main>

        </div>
      </div>

      {/* Mobile Filter Drawer Overlay */}
      {showMobileFilters && (
        <div className="fixed inset-0 z-[100] bg-black/80 backdrop-blur-md p-6 flex flex-col animate-in fade-in duration-300">
          <div className="flex justify-between items-center mb-10">
            <h2 className="text-2xl font-black uppercase tracking-tighter italic">Filtros</h2>
            <button onClick={() => setShowMobileFilters(false)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center"><X /></button>
          </div>

          <div className="flex-1 overflow-y-auto space-y-8 pb-20">
            {/* Similar content as sidebar but optimized for touch */}
            <div className="space-y-4">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Precio</p>
              <div className="grid grid-cols-2 gap-4">
                <input type="number" placeholder="MÍN" value={priceRange.min} onChange={e => setPriceRange({ ...priceRange, min: e.target.value })} className="bg-white/5 p-5 rounded-2xl outline-none" />
                <input type="number" placeholder="MÁX" value={priceRange.max} onChange={e => setPriceRange({ ...priceRange, max: e.target.value })} className="bg-white/5 p-5 rounded-2xl outline-none" />
              </div>
            </div>

            {/* Mobile Sizes */}
            {availableOptions.clothingSizes.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Indumentaria</p>
                <div className="flex flex-wrap gap-3">
                  {availableOptions.clothingSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                      className={`min-w-[50px] h-12 rounded-xl text-xs font-black uppercase transition-all border ${selectedSizes.includes(size)
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-500 border-white/10'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {availableOptions.shoeSizes.length > 0 && (
              <div className="space-y-4">
                <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Calzado</p>
                <div className="grid grid-cols-4 gap-3">
                  {availableOptions.shoeSizes.map(size => (
                    <button
                      key={size}
                      onClick={() => setSelectedSizes(prev => prev.includes(size) ? prev.filter(s => s !== size) : [...prev, size])}
                      className={`h-12 rounded-xl text-xs font-black uppercase transition-all border ${selectedSizes.includes(size)
                        ? 'bg-white text-black border-white'
                        : 'bg-transparent text-gray-500 border-white/10'
                        }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Reset Mobile */}
            <button
              onClick={() => { setSelectedSizes([]); setSelectedColors([]); setPriceRange({ min: '', max: '' }); setOnlyOffers(false); setShowMobileFilters(false); }}
              className="w-full bg-pink-500 text-black py-5 rounded-3xl font-black uppercase text-xs tracking-widest"
            >
              Limpiar Filtros
            </button>
          </div>

          <button
            onClick={() => setShowMobileFilters(false)}
            className="w-full bg-white text-black py-6 rounded-3xl font-black uppercase text-xs tracking-[0.3em]"
          >
            Ver {productosFiltrados.length} Resultados
          </button>
        </div>
      )}

    </div>
  )
}

export default function ProductosPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div></div>}>
      <ProductosContent />
    </Suspense>
  )
}
