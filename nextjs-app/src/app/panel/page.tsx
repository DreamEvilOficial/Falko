'use client'

import { useState, useEffect } from 'react'
import { productosAPI, categoriasAPI, etiquetasAPI, supabase, type Producto, type Drop } from '@/lib/supabase'
import { toNumber } from '@/lib/formatters'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { Menu, X } from 'lucide-react'

// Componentes
import AdminSidebar from './components/AdminSidebar'
import ProductList from './components/ProductList'
import ProductForm from './components/ProductForm'
import CategoryManagement from './components/CategoryManagement'
import SpecialFiltersManagement from './components/SpecialFiltersManagement'
import OrderManagement from './components/OrderManagement'
import ConfigurationPanel from './components/ConfigurationPanel'
import UserProfile from './components/UserProfile'
import OperatorManagement from './components/OperatorManagement'
import HomepageManagement from './components/HomepageManagement'
import DebtManagement from './components/DebtManagement'
import ReviewsManagement from './components/ReviewsManagement'
import FeaturedProductsManagement from './components/FeaturedProductsManagement'
import InventoryReport from './components/InventoryReport'
import StatsDashboard from './components/StatsDashboard'
import ShippingManagement from './components/ShippingManagement'
import CouponManagement from './components/CouponManagement'
import DropsManagement from './components/DropsManagement'

export default function AdminPage() {
  const router = useRouter()
  const [mounted, setMounted] = useState(false)
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState('productos')
  const [sidebarOpen, setSidebarOpen] = useState(true)

  // Auto-close sidebar on mobile on mount
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setSidebarOpen(false)
      } else {
        setSidebarOpen(true)
      }
    }

    // Set initial state
    handleResize()

    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const [requireLogin, setRequireLogin] = useState(false)
  const [loginLoading, setLoginLoading] = useState(false)
  const [loginData, setLoginData] = useState({ username: '', password: '' })
  
  // Data State
  const [productos, setProductos] = useState<Producto[]>([])
  const [categorias, setCategorias] = useState<any[]>([])
  const [etiquetas, setEtiquetas] = useState<any[]>([])
  const [drops, setDrops] = useState<Drop[]>([])
  
  // UI State
  const [showProductForm, setShowProductForm] = useState(false)
  const [editingProduct, setEditingProduct] = useState<Producto | null>(null)
  
  // Config State
  const [storeName, setStoreName] = useState('URBAN')

  useEffect(() => {
    setMounted(true)
    checkAuthAndLoadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const permissions = {
    catalog: !!(user?.admin || user?.permiso_categorias || user?.permiso_productos),
    sales: !!(user?.admin || user?.permiso_productos),
    adminSales: !!(user?.admin || user?.permiso_ordenes),
    config: !!(user?.admin || user?.permiso_configuracion),
  }

  useEffect(() => {
    if (!user) return
    const allowedTabs: string[] = []

    if (permissions.catalog) {
      allowedTabs.push('home', 'productos', 'drops', 'categorias', 'destacados', 'filtros')
    }

    if (permissions.sales) {
      allowedTabs.push('ventas', 'cupones', 'inventario', 'resenas', 'estadisticas', 'envios')
    }

    if (permissions.adminSales) {
      allowedTabs.push('deudas')
    }

    if (permissions.adminSales || permissions.config) {
      allowedTabs.push('operadores')
    }

    if (permissions.config) {
      allowedTabs.push('configuracion')
    }

    allowedTabs.push('perfil')

    if (!allowedTabs.includes(activeTab)) {
      setActiveTab(allowedTabs[0] || 'perfil')
    }
  }, [user, permissions.catalog, permissions.sales, permissions.adminSales, permissions.config, activeTab])

  if (!mounted) return null

  async function checkAuthAndLoadData() {
    try {
      const res = await fetch('/api/auth/session')
      
      if (!res.ok) {
        setRequireLogin(true)
        return
      }

      const data = await res.json()
      console.log('Session verified in dashboard:', data)
      setUser(data.user)
      await cargarDatos()
    } catch (error: any) {
      console.error('Critical auth check error:', error)
      toast.error(`Error de Dashboard: ${error.message || 'Error desconocido'}`)
      setRequireLogin(true)
    } finally {
      setLoading(false)
    }
  }

  async function cargarDatos() {
    try {
      // Usar obtenerTodosAdmin para ver incluso los pausados
      const prodsPromise = productosAPI.obtenerTodosAdmin()
      const catsPromise = categoriasAPI.obtenerTodas()
      const tagsPromise = etiquetasAPI.obtenerTodas()
      const dropsPromise = fetch('/api/drops').then(res => {
        if (!res.ok) throw new Error('Error drops')
        return res.json()
      })
      const configPromise = fetch('/api/config').then(res => {
        if (!res.ok) throw new Error('Error configs')
        return res.json()
      })

      // Usar allSettled para que si falla uno no falle todo
      const [prodsRes, catsRes, tagsRes, dropsRes, configRes] = await Promise.allSettled([
        prodsPromise,
        catsPromise,
        tagsPromise,
        dropsPromise,
        configPromise
      ])

      if (prodsRes.status === 'fulfilled') {
        setProductos(prodsRes.value)
      } else {
        console.error('Error productos:', prodsRes.reason)
        toast.error('Error al cargar productos')
      }

      if (catsRes.status === 'fulfilled') {
        const cats = catsRes.value; // API returns directly array
        setCategorias(cats)
      } else {
         // Fallback or empty
         setCategorias([])
      }

      if (tagsRes.status === 'fulfilled') {
        const tags = tagsRes.value; // API returns directly array
        setEtiquetas(tags)
      }

      if (dropsRes.status === 'fulfilled') {
        setDrops(dropsRes.value)
      }
      
      if (configRes.status === 'fulfilled') {
        const raw = String(configRes.value?.nombre_tienda || '').trim()
        if (raw && !/berta/i.test(raw)) setStoreName(raw)
      }
      
    } catch (error) {
      console.error('Error loading data:', error)
      toast.error('Error crítico al cargar datos')
    }
  }

  async function handleSaveProduct(data: any) {
    try {
      // Calcular stock total
      const totalStock = data.variantes.reduce((sum: number, v: any) => sum + (v.stock || 0), 0)
      const slug = data.nombre.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '')

      // Resolver categoría y subcategoría a IDs/SLUGs fiables
      let categoria_id = data.categoria_id || null
      let subcategoria_id = data.subcategoria_id || null

      try {
        const cats = await categoriasAPI.obtenerTodas();

        if (cats && (data.categoria || data.categoria_slug || data.categoria_id)) {
          const targetCat = cats.find((c: any) => 
            (data.categoria_slug && c.slug === data.categoria_slug) ||
            (data.categoria && (c.slug === data.categoria || c.nombre === data.categoria)) ||
            (data.categoria_id && String(c.id) === String(data.categoria_id))
          )
          if (targetCat) {
            categoria_id = targetCat.id
            if (Array.isArray(targetCat.subcategorias) && (data.subcategoria || data.subcategoria_slug || data.subcategoria_id)) {
              const targetSub = targetCat.subcategorias.find((s: any) => 
                (data.subcategoria_slug && s.slug === data.subcategoria_slug) ||
                (data.subcategoria && (s.slug === data.subcategoria || s.nombre === data.subcategoria)) ||
                (data.subcategoria_id && String(s.id) === String(data.subcategoria_id))
              )
              if (targetSub) {
                subcategoria_id = targetSub.id
              }
            }
          }
        }
      } catch (e) {
        console.warn('No se pudo resolver categoría/subcategoría:', e)
      }

      const normalizadoCategoriaId =
        !categoria_id || categoria_id === 'Seleccionar...' ? null : categoria_id
      const normalizadoSubcategoriaId =
        !subcategoria_id || subcategoria_id === 'Ninguna' ? null : subcategoria_id

      const productoData = {
        id: editingProduct ? editingProduct.id : undefined,
        nombre: data.nombre,
        descripcion: data.descripcion,
        precio: toNumber(data.precio),
        precio_original: data.precio_original ? toNumber(data.precio_original) : null,
        descuento_porcentaje: data.descuento_porcentaje ? Number(data.descuento_porcentaje) : 0,
        categoria_id: normalizadoCategoriaId,
        subcategoria_id: normalizadoSubcategoriaId || undefined,
        imagen_url: data.imagen_url,
        imagenes: data.imagenes,
        variantes: data.variantes,
        destacado: data.destacado,
        top: data.top,
        proximo_lanzamiento: data.proximo_lanzamiento,
        nuevo_lanzamiento: data.nuevo_lanzamiento,
        descuento_activo: data.descuento_activo,
        sku: data.sku,
        stock_minimo: data.stock_minimo ? Number(data.stock_minimo) : 5,
        proveedor_nombre: data.proveedor_nombre || undefined,
        proveedor_contacto: data.proveedor_contacto || undefined,
        precio_costo: data.precio_costo ? toNumber(data.precio_costo) : undefined,
        slug,
        stock_actual: totalStock,
        activo: true,
        drop_ids: Array.isArray(data.drop_ids) ? data.drop_ids : []
      }

      if (editingProduct) {
        await productosAPI.actualizar(editingProduct.id, productoData)
        toast.success('Producto actualizado')
      } else {
        await productosAPI.crear(productoData)
        toast.success('Producto creado')
      }

      setShowProductForm(false)
      setEditingProduct(null)
      await cargarDatos() // Recargar lista esperando a que termine
    } catch (error: any) {
      console.error(error)
      toast.error('Error al guardar: ' + error.message)
    }
  }

  async function handleDeleteProduct(id: string) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return

    try {
      await productosAPI.eliminar(id)
      setProductos(productos.filter(p => p.id !== id))
      toast.success('Producto eliminado')
    } catch (error) {
      toast.error('Error al eliminar producto')
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen bg-transparent">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white/20 border-t-accent"></div>
      </div>
    )
  }

  if (requireLogin) {
    return (
      <div className="min-h-screen bg-[#000000FA] flex items-center justify-center p-4 selection:bg-white selection:text-black">
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
        </div>
        <div className="w-full max-w-md relative">
          <div className="bg-black/40 backdrop-blur-xl border border-white/10 p-8 rounded-3xl shadow-2xl relative overflow-hidden group">
            <div className="absolute top-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
            <div className="flex flex-col items-center mb-10">
              <div className="w-14 h-14 bg-white text-black rounded-2xl flex items-center justify-center mb-6 shadow-[0_0_20px_rgba(255,255,255,0.2)] transition-transform group-hover:scale-110 duration-500">
                <Menu className="w-7 h-7" />
              </div>
              <h1 className="text-2xl font-bold text-white tracking-tight">Acceso Privado</h1>
              <p className="text-gray-500 text-sm mt-2">URBAN • Gestión de Tienda</p>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault()
                if (loginLoading) return
                setLoginLoading(true)
                try {
                  const res = await fetch('/api/auth/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(loginData)
                  })
                  const data = await res.json()
                  if (res.ok) {
                    toast.success('Acceso concedido')
                    setRequireLogin(false)
                    checkAuthAndLoadData()
                  } else {
                    toast.error(data.error || 'Credenciales incorrectas')
                  }
                } catch {
                  toast.error('Error de conexión con el servidor')
                } finally {
                  setLoginLoading(false)
                }
              }}
              className="space-y-5"
            >
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Usuario</label>
                <div className="relative group/input">
                  <input
                    type="text"
                    placeholder="Usuario"
                    className="w-full bg-white/5 border border-white/5 text-white pl-4 pr-4 py-3.5 rounded-2xl outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all text-sm"
                    required
                    value={loginData.username}
                    onChange={e => setLoginData({ ...loginData, username: e.target.value })}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-gray-500 uppercase tracking-widest ml-1">Contraseña</label>
                <div className="relative group/input">
                  <input
                    type="password"
                    placeholder="••••••••"
                    className="w-full bg-white/5 border border-white/5 text-white pl-4 pr-4 py-3.5 rounded-2xl outline-none focus:border-white/20 focus:bg-white/[0.08] transition-all text-sm"
                    required
                    value={loginData.password}
                    onChange={e => setLoginData({ ...loginData, password: e.target.value })}
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loginLoading}
                className="w-full mt-4 bg-white text-black font-bold py-4 rounded-2xl flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98] transition-all shadow-[0_10px_20px_rgba(255,255,255,0.1)]"
              >
                {loginLoading ? 'Cargando...' : 'Entrar al Panel'}
              </button>
            </form>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen bg-[#05060a]">
      <style dangerouslySetInnerHTML={{
        __html: `
          input[type="text"],
          input[type="password"],
          input[type="email"],
          input[type="number"],
          input[type="url"],
          textarea,
          select {
            color: #F4F6FB !important;
          }
          input::placeholder,
          textarea::placeholder {
            color: rgba(244, 246, 251, 0.35) !important;
          }
        `
      }} />
      {/* Sidebar - Desktop */}
      <div className={`hidden lg:block sticky top-0 h-screen overflow-y-auto border-r border-white/5 bg-[#05060a] z-50 w-64 flex-shrink-0 transition-all duration-300`}>
        <AdminSidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab} 
          sidebarOpen={true}
          storeName={storeName}
          permissions={permissions}
          onNavigate={() => {}}
        />
      </div>

      {/* Sidebar - Mobile Overlay */}
      <div className={`lg:hidden fixed inset-0 z-50 pointer-events-none transition-opacity duration-300 ${sidebarOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0'}`}>
        <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSidebarOpen(false)} />
        <div className={`absolute left-0 top-0 bottom-0 w-64 bg-[#05060a] border-r border-white/10 transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
           <AdminSidebar 
            activeTab={activeTab} 
            setActiveTab={setActiveTab} 
            sidebarOpen={true}
            storeName={storeName}
            permissions={permissions}
            onNavigate={() => setSidebarOpen(false)}
          />
        </div>
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile Header */}
        <header className="lg:hidden bg-[#05060a]/80 backdrop-blur-xl border-b border-white/10 p-4 flex items-center justify-between sticky top-0 z-40">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setSidebarOpen(true)} 
              className="w-10 h-10 flex items-center justify-center rounded-xl bg-white/5 text-white/70 hover:text-white hover:bg-white/10 transition-all active:scale-95"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-sm font-black uppercase tracking-widest text-white">Admin Panel</h1>
              <p className="text-[10px] font-mono text-white/40">{storeName}</p>
            </div>
          </div>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-8">
          {activeTab === 'productos' && permissions.catalog && (
            showProductForm ? (
              <ProductForm 
                producto={editingProduct}
                categorias={categorias}
                etiquetas={etiquetas}
                drops={drops}
                onSave={handleSaveProduct}
                onCancel={() => {
                  setShowProductForm(false)
                  setEditingProduct(null)
                }}
              />
            ) : (
              <ProductList 
                productos={productos}
                categorias={categorias}
                drops={drops}
                onEdit={(p) => {
                  setEditingProduct(p)
                  setShowProductForm(true)
                }}
                onDelete={handleDeleteProduct}
                onNew={() => {
                  setEditingProduct(null)
                  setShowProductForm(true)
                }}
              />
            )
          )}

          {activeTab === 'destacados' && permissions.catalog && (
            <FeaturedProductsManagement />
          )}

          {activeTab === 'drops' && permissions.catalog && (
            <DropsManagement />
          )}

          {activeTab === 'categorias' && permissions.catalog && (
            <CategoryManagement />
          )}

          {activeTab === 'filtros' && permissions.catalog && (
            <SpecialFiltersManagement />
          )}

          {activeTab === 'home' && permissions.catalog && (
            <HomepageManagement />
          )}

          {activeTab === 'estadisticas' && permissions.sales && (
            <StatsDashboard />
          )}

          {activeTab === 'envios' && permissions.sales && (
            <ShippingManagement />
          )}

          {activeTab === 'ventas' && permissions.sales && (
            <OrderManagement />
          )}

          {activeTab === 'cupones' && permissions.sales && (
            <CouponManagement />
          )}

          {activeTab === 'inventario' && permissions.sales && (
            <InventoryReport />
          )}

          {activeTab === 'perfil' && (
            <UserProfile user={user} />
          )}

          {activeTab === 'operadores' && (permissions.adminSales || permissions.config) && (
            <OperatorManagement />
          )}

          {activeTab === 'deudas' && permissions.adminSales && (
            <DebtManagement />
          )}

          {activeTab === 'resenas' && permissions.sales && (
            <ReviewsManagement />
          )}

          {activeTab === 'configuracion' && permissions.config && (
            <ConfigurationPanel />
          )}
        </main>
      </div>
    </div>
  )
}
