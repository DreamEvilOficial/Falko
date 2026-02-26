'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { ShoppingCart, ChevronDown, ChevronRight, Home, MessageCircle, Music2, Truck } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { motion, AnimatePresence } from 'framer-motion'
import { CategoryIcon } from './IconSelector'

const Cart = dynamic(() => import('./Cart'), { ssr: false })
const MusicPanel = dynamic(() => import('./MusicPanel'), { ssr: false })

export default function Navbar() {
  const items = useCartStore((state) => state.items)
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [showCart, setShowCart] = useState(false)
  const [logoUrl, setLogoUrl] = useState('/urban.png')
  const [nombreTienda, setNombreTienda] = useState('Urban Indumentaria')
  const [categorias, setCategorias] = useState<Array<{ id: string, nombre: string, slug: string, icono?: string, subcategorias?: Array<{ id: string, nombre: string, slug: string }> }>>([])
  const [showProductsMenu, setShowProductsMenu] = useState(false)
  const [expandedCategory, setExpandedCategory] = useState<string | null>(null)
  const [showMobileMenu, setShowMobileMenu] = useState(false)
  const [showMusic, setShowMusic] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const [mensajes, setMensajes] = useState<string[]>([])
  const [velocidad, setVelocidad] = useState(30)
  const [hideNavbar, setHideNavbar] = useState(false)
  const [lastScrollY, setLastScrollY] = useState(0)
  const [filtrosEspeciales, setFiltrosEspeciales] = useState<Array<{ id: string, nombre: string, clave: string, icono: string, activo: boolean, imagen_url?: string }>>([])

  const isImageUrl = (url: string) => {
    if (!url) return false
    return url.startsWith('http') || url.startsWith('https') || url.startsWith('/') || url.includes('.gif') || url.includes('.png') || url.includes('.jpg') || url.includes('.jpeg') || url.includes('.svg') || url.includes('.webp')
  }

  const totalItems = items.reduce((sum, item) => sum + item.cantidad, 0)

  // Prefetch automático de páginas principales
  useEffect(() => {
    if (mounted) {
      router.prefetch('/')
      router.prefetch('/productos')
      router.prefetch('/cart')
      router.prefetch('/contacto')
    }
  }, [mounted, router])

  useEffect(() => {
    setMounted(true)

    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()

        if (data) {
          const config: any = {}
          // Determine if data is array (new api) or object
          if (Array.isArray(data)) {
            data.forEach((item: any) => {
              try {
                config[item.clave] = JSON.parse(item.valor)
              } catch {
                config[item.clave] = item.valor
              }
            })
          } else {
            // Fallback if structure differs
            Object.assign(config, data)
          }

          if (config.logo_url) setLogoUrl(config.logo_url)
          if (config.nombre_tienda) setNombreTienda(config.nombre_tienda)
          if (config.slider_marquesina_velocidad) setVelocidad(Number(config.slider_marquesina_velocidad))

          // Actualizar mensajes del banner
          const nuevosMensajes = []
          if (config.anuncio_1) nuevosMensajes.push(config.anuncio_1)
          if (config.anuncio_2) nuevosMensajes.push(config.anuncio_2)
          if (config.anuncio_3) nuevosMensajes.push(config.anuncio_3)

          if (nuevosMensajes.length > 0) {
            setMensajes(nuevosMensajes)
          }
        }
      } catch (error) {
        console.error('Error loading config:', error)
      }
    }

    loadConfig()

    // Listen for config updates (local and cross-tab)
    window.addEventListener('config-updated', loadConfig)
    window.addEventListener('storage', (e) => {
      if (e.key === 'config-updated') loadConfig()
    })

    // Cargar categorías desde API local
    const loadCategorias = async () => {
      try {
        const res = await fetch('/api/categories')
        const data = await res.json()

        if (data) {
          // data from /api/categories already includes subcategories nested
          setCategorias(data)
        }
      } catch (error) {
        console.error('Error loading categorias:', error)
      }
    }

    loadCategorias()

    // Cargar filtros especiales desde API local
    const loadFiltros = async () => {
      try {
        const res = await fetch('/api/filters')
        const data = await res.json()

        if (Array.isArray(data)) {
          // Filter active ones if the API returns all (API currently returns all, so we filter here if needed or update API)
          // The API returns all, let's filter helper
          const activeFilters = data.filter((f: any) => f.activo)
          setFiltrosEspeciales(activeFilters)
        } else {
          setFiltrosEspeciales([])
        }
      } catch (error) {
        console.error('Error loading filtros:', error)
        setFiltrosEspeciales([])
      }
    }

    loadFiltros()

    window.addEventListener('config-updated', loadConfig)
    window.addEventListener('categorias-updated', loadCategorias)
    window.addEventListener('filtros-updated', loadFiltros)

    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'filtros-updated') {
        loadFiltros()
      } else if (e.key === 'categorias-updated') {
        loadCategorias()
      } else if (e.key === 'config-updated') {
        loadConfig()
      }
    }
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('config-updated', loadConfig)
      window.removeEventListener('categorias-updated', loadCategorias)
      window.removeEventListener('filtros-updated', loadFiltros)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [])

  // Cerrar menú al hacer clic afuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowProductsMenu(false)
        setExpandedCategory(null)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  // Ocultar/mostrar navbar en scroll
  useEffect(() => {
    const handleScroll = () => {
      const currentScrollY = window.scrollY

      if (currentScrollY > lastScrollY && currentScrollY > 100) {
        // Scrolling down y pasó los 100px
        setHideNavbar(true)
      } else {
        // Scrolling up
        setHideNavbar(false)
      }

      setLastScrollY(currentScrollY)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [lastScrollY])

  return (
    <>
      <div className={`sticky top-0 z-[1000000] transition-transform duration-300 ${hideNavbar ? '-translate-y-full' : 'translate-y-0'}`}>
        {/* AnnouncementSlider integrado - Scroll continuo */}
        {mensajes.length > 0 && (
          <div className="bg-black text-white py-4 overflow-hidden relative w-full border-b border-gray-800">
            <div className="announcement-scroll">
              <div
                className="announcement-content"
                style={{
                  '--speed': `${velocidad}s`,
                  '--speed-mobile': `${velocidad / 2}s`
                } as any}
              >
                {mensajes.map((mensaje, index) => (
                  <span key={`msg-1-${index}`} className="announcement-item text-[11px] font-medium uppercase tracking-[0.2em] px-6 md:px-12">
                    {mensaje}
                  </span>
                ))}
                {/* Duplicar para loop infinito */}
                {mensajes.map((mensaje, index) => (
                  <span key={`msg-2-${index}`} className="announcement-item text-[11px] font-medium uppercase tracking-[0.2em] px-6 md:px-12">
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

        {/* Navbar */}
        <nav className="bg-black">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Logo centrado */}
            <div className="flex justify-center items-center py-7 border-b border-gray-800">
              <Link href="/" prefetch={true} className="flex flex-col items-center gap-1">
                <Image
                  src={logoUrl || '/urban.png'}
                  alt={nombreTienda}
                  width={260}
                  height={72}
                  priority
                  sizes="(max-width: 768px) 160px, 260px"
                  className="h-[62px] md:h-[80px] w-auto object-contain"
                />
              </Link>
            </div>

            {/* Menú de navegación - Desktop */}
            <div className="hidden md:flex items-center justify-center gap-10 py-5 relative">
              {/* Inicio */}
              <Link
                href="/"
                className="flex items-center gap-2 text-white text-sm font-medium hover:text-gray-300 transition uppercase tracking-wider"
              >
                <Home className="w-4 h-4" />
                Inicio
              </Link>

              {/* Menú desplegable de Productos */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setShowProductsMenu(!showProductsMenu)}
                  className="flex items-center gap-1 text-white text-sm font-medium hover:text-gray-300 transition uppercase tracking-wider"
                >
                  Productos
                  <ChevronDown className={`w-4 h-4 transition-transform ${showProductsMenu ? 'rotate-180' : ''}`} />
                </button>

                <AnimatePresence>
                  {showProductsMenu && (
                    <motion.div
                      initial={{ opacity: 0, y: -10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -10 }}
                      className="absolute top-full left-1/2 -translate-x-1/2 mt-4 bg-black border border-gray-800 rounded-2xl shadow-xl p-6 min-w-[800px] z-[999999]"
                    >
                      <div className="grid grid-cols-2 gap-8">
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 mb-4 px-2">Categorías</div>
                          <div className="space-y-1">
                            <Link
                              href="/productos"
                              prefetch={true}
                              onClick={() => setShowProductsMenu(false)}
                              className="flex items-center justify-center w-full px-5 py-3 mb-4 rounded-lg bg-white text-black text-[15px] font-bold uppercase tracking-wider hover:bg-gray-100 transition-colors"
                            >
                              Ver Todo
                            </Link>
                            {categorias.map((cat) => (
                              <div key={cat.id}>
                                <Link
                                  href={`/productos?categoria=${cat.slug}`}
                                  prefetch={true}
                                  onClick={() => setShowProductsMenu(false)}
                                  className="flex items-center justify-between px-5 py-3 rounded-lg text-white/90 hover:bg-gray-800 text-[15px] font-medium uppercase tracking-wider group transition-colors"
                                >
                                  <span>{cat.nombre}</span>
                                  <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                                </Link>
                              </div>
                            ))}
                          </div>
                        </div>
                        <div>
                          <div className="text-[11px] font-black uppercase tracking-[0.3em] text-white/60 mb-4 px-2">Filtros</div>
                          <div className="space-y-1">
                            {filtrosEspeciales.map((filtro) => (
                              <Link
                                key={filtro.id}
                                href={`/productos?filter=${filtro.clave}`}
                                onClick={() => setShowProductsMenu(false)}
                                className="flex items-center justify-between px-5 py-3 rounded-lg text-white/90 hover:bg-gray-800 text-[15px] font-medium uppercase tracking-wider group transition-colors"
                              >
                                <span>{filtro.nombre}</span>
                                <ChevronRight className="w-4 h-4 text-gray-500 group-hover:text-white transition-colors" />
                              </Link>
                            ))}
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Seguimiento */}
              <Link
                href="/seguimiento"
                className="flex items-center gap-2 text-white text-sm font-medium hover:text-gray-300 transition uppercase tracking-wider"
              >
                <Truck className="w-4 h-4" />
                Seguimiento
              </Link>

              {/* Filtros especiales */}
              {filtrosEspeciales.map((filtro) => {
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
                } else if (filtro.imagen_url || isImageUrl(filtro.icono)) {
                  const src = filtro.imagen_url || filtro.icono
                  iconElement = (
                    <img
                      src={src}
                      alt={filtro.nombre}
                      className="w-5 h-5 object-contain"
                    />
                  )
                } else {
                  // Start Fix
                  const iconText = filtro.icono ? filtro.icono.trim() : '';
                  const nameText = filtro.nombre.trim();

                  if (iconText.toUpperCase() === nameText.toUpperCase()) {
                    iconElement = null;
                  } else if (filtro.icono && filtro.icono.length < 20) {
                    const isEmoji = /\p{Emoji}/u.test(filtro.icono);
                    if (isEmoji) {
                      iconElement = <span className="text-base">{filtro.icono}</span>
                    } else {
                      // Assume it might be an icon name
                      iconElement = <CategoryIcon iconName={filtro.icono} className="w-4 h-4" />
                    }
                  } else {
                    // Fallback for long text or unknown
                    if (filtro.icono) {
                      iconElement = <span className="text-base">{filtro.icono}</span>
                    } else {
                      iconElement = <span className="text-base">{'🏷️'}</span>
                    }
                  }
                  // End Fix
                }

                const filterSlug = filtro.clave.startsWith('/') ? filtro.clave.substring(1) : filtro.clave

                return (
                  <Link
                    key={filtro.id}
                    href={`/productos?filter=${filterSlug}`}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                  >
                    {iconElement}
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                      {filtro.nombre}
                    </span>
                  </Link>
                )
              })}


              {/* Carrito con badge verde */}
              <button
                onClick={() => setShowCart(true)}
                className="relative p-2 hover:bg-gray-800 rounded-full transition ml-4"
              >
                <ShoppingCart className="w-5 h-5 text-white" />
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 bg-[#B7FF2A] text-black text-xs rounded-full w-5 h-5 flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>

              <button
                onClick={() => setShowMusic(!showMusic)}
                className="relative p-2 hover:bg-gray-800 rounded-full transition"
              >
                <Music2 className="w-5 h-5 text-white" />
              </button>
            </div>

            {/* Botón hamburguesa móvil */}
            <div className="flex md:hidden items-center justify-between py-3">
              <button
                aria-label="Abrir menú"
                onClick={() => setShowMobileMenu(!showMobileMenu)}
                className="p-2 border border-gray-800 rounded-lg text-white hover:bg-gray-800"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path fillRule="evenodd" d="M3 6.75A.75.75 0 013.75 6h16.5a.75.75 0 010 1.5H3.75A.75.75 0 013 6.75zm0 5.25a.75.75 0 01.75-.75h16.5a.75.75 0 010 1.5H3.75a.75.75 0 01-.75-.75zm.75 4.5a.75.75 0 000 1.5h16.5a.75.75 0 000-1.5H3.75z" clipRule="evenodd" />
                </svg>
              </button>
              <button
                aria-label="Abrir música"
                onClick={() => setShowMusic(!showMusic)}
                className="p-2 ml-2 border border-gray-800 rounded-lg text-white hover:bg-gray-800"
              >
                <Music2 className="w-5 h-5" />
              </button>
            </div>

            {/* Panel de menú móvil */}
            {showMobileMenu && (
              <div className="md:hidden bg-black border border-gray-800 rounded-xl p-3 space-y-2">
                <Link href="/" prefetch={true} onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 text-white text-sm rounded hover:bg-gray-800">Inicio</Link>
                <Link href="/productos" prefetch={true} onClick={() => setShowMobileMenu(false)} className="block px-3 py-2 text-white text-sm rounded hover:bg-gray-800">Todos los Productos</Link>
                <div className="border-t border-gray-800 my-1" />
                {categorias.map((cat) => (
                  <div key={cat.id}>
                    <Link
                      href={`/productos?categoria=${cat.slug}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="block px-3 py-2 text-white text-sm rounded hover:bg-gray-800"
                    >
                      {cat.nombre}
                    </Link>
                    {cat.subcategorias && cat.subcategorias.length > 0 && (
                      <div className="pl-3">
                        {cat.subcategorias.map((sub) => (
                          <Link
                            key={sub.id}
                            href={`/productos?categoria=${cat.slug}&subcategoria=${sub.slug}`}
                            onClick={() => setShowMobileMenu(false)}
                            className="block px-3 py-2 text-gray-300 text-sm rounded hover:bg-gray-800 hover:text-white"
                          >
                            {sub.nombre}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
                {filtrosEspeciales.length > 0 && <div className="border-t border-gray-800 my-1" />}
                {filtrosEspeciales.map((filtro) => {
                  let iconElement = null
                  const clave = filtro.clave.toLowerCase().replace('/', '').trim()

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
                  } else if (filtro.imagen_url || isImageUrl(filtro.icono)) {
                    const src = filtro.imagen_url || filtro.icono
                    iconElement = (
                      <img
                        src={src}
                        alt={filtro.nombre}
                        className="w-5 h-5 object-contain"
                      />
                    )
                  } else {
                    iconElement = <span className="text-base">{filtro.icono || '🏷️'}</span>
                  }

                  const filterSlug = filtro.clave.startsWith('/') ? filtro.clave.substring(1) : filtro.clave

                  return (
                    <Link
                      key={filtro.id}
                      href={`/productos?filter=${filterSlug}`}
                      onClick={() => setShowMobileMenu(false)}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                    >
                      {iconElement}
                      <span className="text-[10px] font-black uppercase tracking-widest text-white/70 group-hover:text-white transition-colors">
                        {filtro.nombre}
                      </span>
                    </Link>
                  )
                })}
              </div>
            )}
          </div>
        </nav>
      </div>

      {showCart && <Cart onClose={() => setShowCart(false)} />}
      <MusicPanel open={showMusic} onClose={() => setShowMusic(false)} />
    </>
  )
}
