'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ShoppingCart, Bookmark, ChevronDown, Home, Menu, X, Search, Music2 } from 'lucide-react'
import dynamic from 'next/dynamic'
import { useCartStore } from '@/store/cartStore'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryIcon } from './IconSelector'

const Cart = dynamic(() => import('./Cart'), { ssr: false })
const SavedProducts = dynamic(() => import('./SavedProducts'), { ssr: false })
const MusicPanel = dynamic(() => import('./MusicPanel'), { ssr: false })

interface HeaderProps {
  theme?: string
  toggleTheme?: () => void
  initialConfig?: any
}

export default function Header({ theme, toggleTheme, initialConfig }: HeaderProps) {
  const router = useRouter()
  const items = useCartStore((state) => state.items)
  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0)

  // Estados de UI
  const [showCart, setShowCart] = useState(false)
  const [showSaved, setShowSaved] = useState(false)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showProductsMenu, setShowProductsMenu] = useState(false)
  const [mounted, setMounted] = useState(false)
  const [hideNavbar, setHideNavbar] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const menuRef = useRef<HTMLDivElement>(null)
  const [showMusic, setShowMusic] = useState(false)

  // Search State
  const [isSearchOpen, setIsSearchOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      router.push(`/productos?q=${encodeURIComponent(searchQuery.trim())}`)
      setIsSearchOpen(false)
      setSearchQuery('')
    }
  }

  // Estados de Datos
  const [config, setConfig] = useState<any>({
    nombre_tienda: initialConfig?.nombre_tienda || 'URBAN',
    logo_url: initialConfig?.logo_url || '',
    lema_tienda: initialConfig?.lema_tienda || initialConfig?.subtitulo_lema || ''
  })

  const getInitialMensajes = () => {
    const msgs = []
    if (initialConfig?.anuncio_1) msgs.push(initialConfig.anuncio_1)
    if (initialConfig?.anuncio_2) msgs.push(initialConfig.anuncio_2)
    if (initialConfig?.anuncio_3) msgs.push(initialConfig.anuncio_3)
    return msgs
  }

  const [mensajes, setMensajes] = useState<string[]>(getInitialMensajes())
  const [velocidad, setVelocidad] = useState(Number(initialConfig?.slider_marquesina_velocidad) || 30)
  const [categorias, setCategorias] = useState<Array<{ id: string, nombre: string, slug: string, icono?: string, subcategorias?: Array<{ id: string, nombre: string, slug: string }> }>>([])
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [filtrosEspeciales, setFiltrosEspeciales] = useState<Array<{ id: string, nombre: string, clave: string, icono?: string, imagen_url?: string, activo: boolean }>>([])

  // Prefetching
  useEffect(() => {
    if (mounted) {
      router.prefetch('/')
      router.prefetch('/productos')
      router.prefetch('/cart')
    }
  }, [mounted, router])

  // Carga de Datos Inicial
  useEffect(() => {
    setMounted(true)

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        if (data) {
          const newConfig: any = {}
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              try { newConfig[item.clave] = JSON.parse(item.valor) } catch { newConfig[item.clave] = item.valor }
            })
          } else {
            Object.assign(newConfig, data)
          }

          setConfig((prev: any) => {
            const next = { ...prev, ...newConfig }
            // Update derived state if needed
            return next
          })

          if (newConfig.slider_marquesina_velocidad) setVelocidad(Number(newConfig.slider_marquesina_velocidad))

          const msgs = []
          if (newConfig.anuncio_1) msgs.push(newConfig.anuncio_1)
          if (newConfig.anuncio_2) msgs.push(newConfig.anuncio_2)
          if (newConfig.anuncio_3) msgs.push(newConfig.anuncio_3)
          if (msgs.length > 0) setMensajes(msgs)
        }
      } catch (err) {
        console.error('Error loading config', err)
      }
    }

    loadConfig()

    // Listen for config updates
    const handleConfigUpdate = () => {
      console.log('Config updated, reloading header...')
      loadConfig()
    }

    window.addEventListener('config-updated', handleConfigUpdate)
    return () => window.removeEventListener('config-updated', handleConfigUpdate)
  }, [])

  useEffect(() => {
    const loadCategorias = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()
        if (data) setCategorias(data)
      } catch (error) { console.error(error) }
    }

    const loadFiltros = async () => {
      try {
        const res = await fetch('/api/filters')
        const data = await res.json()
        if (Array.isArray(data)) setFiltrosEspeciales(data.filter((f: any) => f.activo))
      } catch (error) { console.error(error) }
    }

    loadCategorias()
    loadFiltros()

    const handleFiltrosUpdate = () => loadFiltros()
    window.addEventListener('filtros-updated', handleFiltrosUpdate)

    return () => {
      window.removeEventListener('filtros-updated', handleFiltrosUpdate)
    }
  }, [])

  // Scroll Handler
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY
      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        setHideNavbar(true)
      } else {
        setHideNavbar(false)
      }
      setLastScrollY(currentScrollY)
    }
    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  // Click Outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProductsMenu(false)
        setExpandedCategory(null)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  return (
    <>
      <div className={`sticky top-0 z-[100] transition-transform duration-300 ${hideNavbar ? '-translate-y-full' : 'translate-y-0'}`}>
        {/* 1. Announcement Bar */}
        {mensajes.length > 0 && (
          <div className="bg-black text-white py-3 overflow-hidden relative w-full border-b border-white/5">
            <div className="announcement-scroll">
              <div
                className="announcement-content"
                style={{
                  '--speed': `${velocidad}s`,
                  '--speed-mobile': `${velocidad / 2}s`
                } as any}
              >
                {[...mensajes, ...mensajes, ...mensajes, ...mensajes, ...mensajes, ...mensajes].map((mensaje, index) => (
                  <span key={`${index}`} className="announcement-item text-[12px] md:text-[13px] font-bold uppercase tracking-[0.2em] px-6 md:px-12 text-white/90">
                    {mensaje}
                  </span>
                ))}
              </div>
            </div>
            <style jsx>{`
              @media (max-width: 768px) {
                .announcement-content {
                  animation-duration: var(--speed-mobile) !important;
                }
              }
            `}</style>
          </div>
        )}

        {/* 2. Main Navbar - Liquid Glass */}
        <nav className="w-full border-b border-white/5 bg-black/60 backdrop-blur-xl supports-[backdrop-filter]:bg-black/30">
          <div className="relative mx-auto flex h-[77px] md:h-[96px] max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">

            {/* Left Side: Logo & Navigation */}
            <div className="flex items-center gap-8 md:gap-12">
              {/* Logo */}
              <Link href="/" className="flex flex-col items-start justify-center gap-0.5 cursor-pointer hover:opacity-80 transition-opacity group">
                {config.logo_url ? (
                  <img
                    src={config.logo_url}
                    alt={config.nombre_tienda}
                    className="h-8 md:h-10 w-auto object-contain"
                  />
                ) : (
                  <div className="text-white font-black text-xl md:text-2xl uppercase tracking-[0.2em] leading-none">
                    {config.nombre_tienda}
                  </div>
                )}
                <div className="hidden md:block text-[8px] font-bold text-white/40 uppercase tracking-[0.3em] group-hover:text-accent transition-colors">
                  {config.lema_tienda || 'Streetwear • Urban • Fits'}
                </div>
              </Link>

            </div>

            {/* Desktop Navigation Links (Centered) */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 hidden md:flex items-center gap-6">
              <Link href="/" className="text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 hover:text-white transition-colors">
                Inicio
              </Link>

              {/* Products Dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProductsMenu(!showProductsMenu)}
                  className="flex items-center gap-1 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 hover:text-white transition-colors"
                >
                  Productos
                  <ChevronDown className={`w-3 h-3 transition-transform ${showProductsMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showProductsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: 10 }}
                      className="absolute top-full left-0 mt-4 min-w-[360px] md:min-w-[480px] bg-[#0a0a0a] border border-white/10 rounded-2xl shadow-2xl overflow-hidden p-4 z-50 backdrop-blur-3xl"
                    >
                      <Link
                        href="/productos"
                        onClick={() => setShowProductsMenu(false)}
                        className="block px-5 py-3 text-[12px] font-black text-white uppercase tracking-[0.2em] hover:bg-white/5 rounded-xl transition-colors"
                      >
                        Ver Todo
                      </Link>

                      <div className="h-px bg-white/5 my-1" />

                      <div className="max-h-[60vh] overflow-y-auto custom-scrollbar">
                        {categorias.map((cat) => (
                          <div key={cat.id}>
                            <div className="flex items-center justify-between px-5 py-3 hover:bg-white/5 rounded-xl cursor-pointer group transition-colors">
                              <Link
                                href={`/productos?categoria=${cat.slug}`}
                                onClick={() => setShowProductsMenu(false)}
                                className="flex items-center gap-3 flex-1"
                              >
                                {cat.icono && <CategoryIcon iconName={cat.icono} className="w-4 h-4 text-white/50 group-hover:text-white transition-colors" />}
                                <span className="text-[12px] font-bold text-white/80 group-hover:text-white uppercase tracking-wider transition-colors">{cat.nombre}</span>
                              </Link>
                              {cat.subcategorias && cat.subcategorias.length > 0 && (
                                <button
                                  onClick={(e) => {
                                    e.preventDefault()
                                    setExpandedCategory(expandedCategory === cat.id ? null : cat.id)
                                  }}
                                  className="p-1.5 hover:bg-white/10 rounded-lg"
                                >
                                  <ChevronDown className={`w-4 h-4 text-white/50 transition-transform ${expandedCategory === cat.id ? 'rotate-180' : ''}`} />
                                </button>
                              )}
                            </div>

                            <AnimatePresence>
                              {expandedCategory === cat.id && cat.subcategorias && (
                                <motion.div
                                  initial={{ height: 0, opacity: 0 }}
                                  animate={{ height: 'auto', opacity: 1 }}
                                  exit={{ height: 0, opacity: 0 }}
                                  className="overflow-hidden bg-white/[0.02] rounded-b-xl"
                                >
                                  {cat.subcategorias.map((sub) => (
                                    <Link
                                      key={sub.id}
                                      href={`/productos?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                                      onClick={() => setShowProductsMenu(false)}
                                      className="block px-12 py-2.5 text-[11px] font-medium text-white/60 hover:text-white hover:bg-white/5 transition-colors uppercase tracking-widest"
                                    >
                                      {sub.nombre}
                                    </Link>
                                  ))}
                                </motion.div>
                              )}
                            </AnimatePresence>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Special Filters */}
              {filtrosEspeciales.filter(f => f.activo).slice(0, 6).map((filtro) => {
                let iconElement = null
                const clave = filtro.clave.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace('/', '').trim()

                if (clave === 'descuentos' || clave === 'ofertas') {
                  iconElement = (
                    <img
                      src="/discount-icon.gif?v=2"
                      alt="Descuento"
                      className="w-5 h-5 object-contain"
                    />
                  )
                } else if (clave === 'nuevos' || clave === 'nuevos-ingresos') {
                  iconElement = (
                    <img
                      src="/new-label.gif?v=2"
                      alt="Nuevo"
                      className="w-5 h-5 object-contain"
                    />
                  )
                } else if (clave === 'proximamente') {
                  iconElement = (
                    <img
                      src="/fire.gif?v=2"
                      alt="Próximamente"
                      className="w-5 h-5 object-contain"
                    />
                  )
                } else if (filtro.imagen_url) {
                  iconElement = (
                    <div className="relative w-6 h-6 flex-shrink-0">
                      <img
                        src={filtro.imagen_url}
                        alt={filtro.nombre}
                        className="w-full h-full object-contain"
                      />
                    </div>
                  )
                } else if (filtro.icono) {
                  // Fix: Case-insensitive check to prevent duplicate text like "Descuentos" and "DESCUENTOS"
                  // Also normalize accents to handle "Próximamente" vs "PROXIMAMENTE"
                  const normalizeText = (text: string) => text.trim().toUpperCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");

                  const iconTextNormalized = normalizeText(filtro.icono);
                  const nameTextNormalized = normalizeText(filtro.nombre);

                  if (iconTextNormalized !== nameTextNormalized && filtro.icono.length < 20) {
                    const isEmoji = /\p{Emoji}/u.test(filtro.icono);
                    if (isEmoji) {
                      iconElement = <span className="text-sm">{filtro.icono}</span>
                    } else {
                      iconElement = <CategoryIcon iconName={filtro.icono} className="w-4 h-4" />
                    }
                  } else {
                    iconElement = null;
                  }
                }

                // Ensure clean URL
                const filterSlug = filtro.clave.startsWith('/') ? filtro.clave.substring(1) : filtro.clave

                return (
                  <Link
                    key={filtro.id}
                    href={`/productos?filter=${filterSlug}`}
                    className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-[0.15em] text-white/70 hover:text-accent transition-colors whitespace-nowrap"
                  >
                    {iconElement}
                    {filtro.nombre}
                  </Link>
                )
              })}
            </div>

            {/* Right Side: Icons */}
            <div className="flex items-center gap-1 md:gap-2">
              {/* Music left of Search */}
              <button
                onClick={() => setShowMusic(!showMusic)}
                className="hidden md:flex relative h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                aria-label="Música"
              >
                <Music2 className="w-4 h-4" />
              </button>
              <div className="flex items-center">
                <AnimatePresence>
                  {isSearchOpen && (
                    <motion.form
                      initial={{ width: 0, opacity: 0 }}
                      animate={{ width: 180, opacity: 1 }}
                      exit={{ width: 0, opacity: 0 }}
                      onSubmit={handleSearch}
                      className="relative overflow-hidden mr-2 hidden md:block"
                    >
                      <input
                        autoFocus
                        type="text"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onBlur={() => !searchQuery && setIsSearchOpen(false)}
                        placeholder="BUSCAR..."
                        className="w-full bg-transparent border-b border-white/30 text-white text-[10px] py-1 px-2 outline-none placeholder:text-white/30 font-bold uppercase tracking-widest"
                      />
                    </motion.form>
                  )}
                </AnimatePresence>
                <button
                  onClick={() => setIsSearchOpen(!isSearchOpen)}
                  className="hidden md:flex relative h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white transition-colors"
                >
                  {isSearchOpen ? <X className="w-4 h-4" /> : <Search className="w-4 h-4" />}
                </button>
              </div>

              <button
                onClick={() => setShowSaved(true)}
                className="relative h-10 w-10 items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white transition-colors hidden md:flex"
              >
                <Bookmark className="w-4 h-4" />
              </button>

              <button
                onClick={() => setShowCart(true)}
                className="relative h-10 w-10 flex items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <ShoppingCart className="w-4 h-4" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 flex items-center justify-center rounded-full bg-accent text-ink text-[10px] font-black border border-black shadow-md">
                    {totalItems}
                  </span>
                )}
              </button>

              {/* Mobile Menu Toggle */}
              <button
                onClick={() => setShowMobileMenu(true)}
                className="md:hidden relative h-10 w-10 flex items-center justify-center rounded-full text-white/70 hover:bg-white/5 hover:text-white transition-colors"
              >
                <Menu className="w-5 h-5" />
              </button>
            </div>
          </div>
        </nav>
      </div>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {showMobileMenu && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMobileMenu(false)}
              className="fixed inset-0 bg-black/80 backdrop-blur-sm z-[150]"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-[80%] max-w-sm bg-[#0a0a0a] border-l border-white/10 z-[160] overflow-y-auto p-6 shadow-2xl"
            >
              <div className="flex items-center justify-between mb-8">
                <span className="text-lg font-black uppercase tracking-widest text-white">Menu</span>
                <button
                  onClick={() => setShowMobileMenu(false)}
                  className="p-2 rounded-full hover:bg-white/5 text-white/50 hover:text-white transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="space-y-6">
                <Link href="/" onClick={() => setShowMobileMenu(false)} className="block text-2xl font-black uppercase tracking-tighter text-white hover:text-accent transition-colors">
                  Inicio
                </Link>
                <Link href="/productos" onClick={() => setShowMobileMenu(false)} className="block text-2xl font-black uppercase tracking-tighter text-white hover:text-accent transition-colors">
                  Productos
                </Link>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Categorías</p>
                  {categorias.map((cat) => (
                    <Link
                      key={cat.id}
                      href={`/productos?categoria=${cat.slug}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors"
                    >
                      {cat.icono && <CategoryIcon iconName={cat.icono} className="w-4 h-4" />}
                      {cat.nombre}
                    </Link>
                  ))}

                  {/* Filtros Especiales */}
                  {filtrosEspeciales.map((filtro) => {
                    let iconElement = null
                    const clave = filtro.clave.toLowerCase().replace('/', '').trim()

                    if (clave === 'descuentos' || clave === 'ofertas') {
                      iconElement = <img src="/discount-icon.gif?v=2" alt="Descuentos" className="w-5 h-5 object-contain" />
                    } else if (clave === 'nuevos' || clave === 'nuevos-ingresos') {
                      iconElement = <img src="/new-label.gif?v=2" alt="Nuevos" className="w-5 h-5 object-contain" />
                    } else if (clave === 'proximamente') {
                      // Add random query param to bust cache just in case
                      iconElement = <img src="/fire.gif?v=2" alt="Próximamente" className="w-5 h-5 object-contain" />
                    } else if (filtro.imagen_url) {
                      iconElement = (
                        <div className="relative w-5 h-5 flex-shrink-0">
                          <img
                            src={filtro.imagen_url}
                            alt={filtro.nombre}
                            className="w-full h-full object-contain"
                          />
                        </div>
                      )
                    } else if (filtro.icono) {
                      iconElement = <span className="text-sm">{filtro.icono}</span>
                    }

                    return (
                      <Link
                        key={filtro.id}
                        href={`/productos?filter=${filtro.clave}`}
                        onClick={() => setShowMobileMenu(false)}
                        className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-white/70 hover:text-accent transition-colors"
                      >
                        {iconElement}
                        {filtro.nombre}
                      </Link>
                    )
                  })}
                </div>

                <div className="h-px bg-white/5" />

                <div className="space-y-4">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">Cuenta</p>
                  <button onClick={() => { setShowSaved(true); setShowMobileMenu(false) }} className="flex items-center gap-3 text-sm font-bold uppercase tracking-wider text-white/70 hover:text-white transition-colors w-full">
                    <Bookmark className="w-4 h-4" />
                    Guardados
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {mounted && showCart && <Cart onClose={() => setShowCart(false)} />}
      {mounted && showSaved && <SavedProducts onClose={() => setShowSaved(false)} />}
      {mounted && <MusicPanel open={showMusic} onClose={() => setShowMusic(false)} />}
    </>
  )
}
