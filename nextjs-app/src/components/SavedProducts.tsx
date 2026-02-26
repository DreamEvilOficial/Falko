'use client'

import { X, Trash2, ShoppingCart, Bookmark } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { productosAPI } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'
import toast from 'react-hot-toast'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeLocalStorage } from '@/lib/security'

interface SavedProductsProps {
  onClose: () => void
}

export default function SavedProducts({ onClose }: SavedProductsProps) {
  const router = useRouter()
  const [items, setItems] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const addItem = useCartStore((state) => state.addItem)

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    loadSavedProducts()
    
    const handleStorageUpdate = () => loadSavedProducts()
    window.addEventListener('savedProductsUpdated', handleStorageUpdate)
    
    return () => {
      window.removeEventListener('savedProductsUpdated', handleStorageUpdate)
    }
  }, [])

  async function loadSavedProducts() {
    try {
      const idsRaw = sanitizeLocalStorage('savedProducts')
      if (!idsRaw) {
        setItems([])
        setLoading(false)
        return
      }

      const ids = Array.isArray(idsRaw) ? idsRaw.map((x: any) => String(x)) : []
      if (ids.length === 0) {
        setItems([])
        setLoading(false)
        return
      }

      const all = await productosAPI.obtenerTodos()
      const filtered = (all || []).filter((p: any) => ids.includes(String(p.id)))
      setItems(filtered)
    } catch (error) {
      console.error('Error loading saved products:', error)
      toast.error('Error al cargar productos guardados')
    } finally {
      setLoading(false)
    }
  }

  const handleRemoveItem = (id: string, e?: React.MouseEvent) => {
    e?.stopPropagation()
    const saved = localStorage.getItem('savedProducts')
    if (!saved) return

    let ids = JSON.parse(saved)
    ids = ids.filter((savedId: string) => savedId !== String(id))
    
    localStorage.setItem('savedProducts', JSON.stringify(ids))
    // Actualizar estado local inmediatamente
    setItems((prev) => prev.filter((item) => String(item.id) !== String(id)))
    // Disparar evento para otros componentes
    window.dispatchEvent(new Event('savedProductsUpdated'))
    toast.success('Producto removido')
    
    if (ids.length === 0) {
      // Si no quedan items, podríamos cerrar el modal o mostrar estado vacío
    }
  }

  const handleClearAll = () => {
    localStorage.removeItem('savedProducts')
    setItems([])
    window.dispatchEvent(new Event('savedProductsUpdated'))
    toast.success('Lista de guardados vacía')
  }

  const handleAddToCart = (product: any, e: React.MouseEvent) => {
    e.stopPropagation()

    if ((product as any).proximo_lanzamiento) {
      toast.error('Producto próximamente disponible')
      return
    }

    if (typeof product.stock_actual === 'number' && product.stock_actual <= 0) {
      toast.error('Sin stock')
      return
    }

    const imageUrl =
      product.imagen_url ||
      (Array.isArray(product.imagenes) && product.imagenes.length > 0
        ? product.imagenes[0]
        : '/proximamente.png')

    addItem({
      id: String(product.id),
      nombre: product.nombre,
      precio: product.precio,
      cantidad: 1,
      imagen_url: imageUrl,
      stock: product.stock_actual
    })
    toast.success('Agregado al carrito')
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose()
    }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center p-0 md:p-4" onClick={handleOverlayClick}>
      {/* Overlay Backdrop */}
      <div className="absolute inset-0 bg-black/85 backdrop-blur-md" onClick={onClose} />
      
      <div 
        className="relative w-full md:max-w-[460px] bg-[#07080d]/85 border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          height: 'auto',
          maxHeight: '85vh'
        }}
      >
        {/* Header - Fixed */}
        <div className="flex-shrink-0 flex items-center justify-between px-6 py-5 border-b border-white/10 bg-[#07080d]/70">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-black text-white tracking-tight uppercase italic flex items-center gap-2">
              <Bookmark className="w-5 h-5" /> Guardados
            </h2>
            {items.length > 0 && (
              <span className="bg-white/15 text-white text-xs font-black px-2 py-0.5 rounded-full border border-white/20">
                {items.length}
              </span>
            )}
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden min-h-[300px]">
          {loading ? (
            <div className="flex items-center justify-center h-full py-20">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white"></div>
            </div>
          ) : items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center h-full">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Bookmark className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-lg font-bold text-white mb-2">No tienes guardados</p>
              <p className="text-sm text-white/50 mb-6">Guarda tus items favoritos para no perderlos de vista.</p>
              <button 
                onClick={onClose} 
                className="px-8 py-2 bg-white/10 text-white rounded-xl font-black hover:bg-white/20 transition-colors text-sm uppercase tracking-widest border border-white/10"
              >
                Explorar productos
              </button>
            </div>
          ) : (
            <div className="p-4 space-y-4">
              {items.map((item) => {
                const isProximoLanzamiento = (item as any).proximo_lanzamiento

                return (
                  <div
                    key={item.id}
                    onClick={() => {
                      if (isProximoLanzamiento) {
                        toast.error('Producto próximamente disponible')
                        return
                      }
                      router.push(`/productos/${item.slug || item.id}`)
                      onClose()
                    }}
                    className={`flex gap-4 p-2 rounded-2xl items-center group hover:bg-white/[0.03] transition-colors border border-transparent hover:border-white/5 ${
                      isProximoLanzamiento ? 'cursor-not-allowed opacity-70' : 'cursor-pointer'
                    }`}
                  >
                  {/* Foto */}
                  <div className="relative w-20 h-24 bg-white/5 rounded-xl overflow-hidden shrink-0 group">
                    <Image 
                      src={item.imagen_url || (item.imagenes && item.imagenes.length > 0 ? item.imagenes[0] : '/proximamente.png')} 
                      alt={item.nombre} 
                      fill 
                      className="object-cover group-hover:scale-110 transition-transform duration-500" 
                      unoptimized
                    />
                  </div>
                  
                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-white text-sm leading-tight line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                      {item.nombre}
                    </h3>
                    
                    <div className="flex items-center justify-between mt-2">
                      <p className="text-white font-black text-sm">
                        $<span suppressHydrationWarning>
                          { formatPrice(item.precio) }
                        </span>
                      </p>
                      <button
                        onClick={(e) => handleAddToCart(item, e)}
                        disabled={isProximoLanzamiento}
                        className="p-2 bg-white/10 hover:bg-accent hover:text-ink text-white rounded-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        title={isProximoLanzamiento ? 'Próximamente disponible' : 'Agregar al carrito'}
                      >
                        <ShoppingCart className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  
                  <button
                    onClick={(e) => handleRemoveItem(item.id, e)}
                    className="p-2.5 text-white/35 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                    title="Remover de guardados"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Footer - Fixed Bottom */}
        {items.length > 0 && (
          <div className="p-6 border-t border-white/10 bg-[#07080d]/70 flex-shrink-0">
            <button
              onClick={handleClearAll}
              className="w-full py-2 text-[11px] text-white/35 hover:text-red-500 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
            >
              <Trash2 className="w-3 h-3" />
              Borrar todos
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
