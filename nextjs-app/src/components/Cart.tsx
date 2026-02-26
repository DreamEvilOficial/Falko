'use client'

import { useCartStore } from '@/store/cartStore'
import { X, Plus, Trash2, ArrowRight, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { productosAPI } from '@/lib/supabase'
import toast from 'react-hot-toast'
import { formatPrice } from '@/lib/formatters'

interface CartProps {
  onClose: () => void
}

export default function Cart({ onClose }: CartProps) {
  const [couponCode, setCouponCode] = useState('')
  const { items, removeItem, updateQuantity, total, clearCart, addItem, applyCoupon, coupon, removeCoupon, getDiscount } = useCartStore()

  useEffect(() => {
    if (coupon) setCouponCode(coupon.codigo)
  }, [coupon])

  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) return
    
    try {
      const res = await fetch(`/api/coupons?code=${couponCode}`)
      const data = await res.json()
      
      if (!res.ok) throw new Error(data.error || 'Cupón inválido')
      
      applyCoupon(data)
      toast.success('Cupón aplicado con éxito')
    } catch (error: any) {
      toast.error(error.message)
      setCouponCode('')
    }
  }
  const router = useRouter()
  const [suggestedProducts, setSuggestedProducts] = useState<any[]>([])
  const [showSuggestions, setShowSuggestions] = useState(false)

  const hasInvalidStock = items.some((item) => {
    if (typeof item.stock !== 'number') return false
    if (item.stock <= 0) return true
    if (item.cantidad > item.stock) return true
    return false
  })

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = ''
    }
  }, [])

  useEffect(() => {
    // Cargar productos sugeridos (ej: destacados o random)
    const loadSuggested = async () => {
      try {
        const destacados = await productosAPI.obtenerDestacados()
        const conStock = destacados.filter((p: any) => {
          const baseStock = typeof p.stock_actual === 'number' ? p.stock_actual : 0
          const variantesStock = Array.isArray(p.variantes)
            ? p.variantes.reduce((sum: number, v: any) => sum + (v?.stock || 0), 0)
            : 0
          const totalStock = baseStock || variantesStock
          return totalStock > 0
        })
        const filtered = conStock
          .filter((p: any) => !items.find(i => i.id === String(p.id)))
          .slice(0, 3)
        setSuggestedProducts(filtered)
      } catch (error) {
        console.error('Error loading suggestions:', error)
      }
    }
    loadSuggested()
  }, [items])

  const handleCheckout = () => {
    if (hasInvalidStock) {
      toast.error('Hay productos sin stock en tu carrito')
      return
    }
    router.push('/checkout')
    onClose()
  }

  const handleClearCart = () => {
    clearCart()
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleUpdateQuantity = (id: string, quantity: number) => {
    const item = items.find(i => (i.cartItemId || `${i.id}-${i.talle || ''}-${i.color || ''}`) === id);
    if (item && item.stock !== undefined && quantity > item.stock) {
        // Optional: Toast warning
        return; 
    }
    updateQuantity(id, quantity)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleRemoveItem = (id: string) => {
    removeItem(id)
    window.dispatchEvent(new Event('cartUpdated'))
  }

  const handleAddSuggested = (product: any) => {
    const baseStock = typeof product.stock_actual === 'number' ? product.stock_actual : 0
    const variantesStock = Array.isArray(product.variantes)
      ? product.variantes.reduce((sum: number, v: any) => sum + (v?.stock || 0), 0)
      : 0
    const totalStock = baseStock || variantesStock || undefined

    addItem({
      id: String(product.id),
      nombre: product.nombre,
      precio: product.precio,
      cantidad: 1,
      imagen_url: product.imagen_url || (product.imagenes && product.imagenes.length > 0 ? product.imagenes[0] : '/proximamente.png'),
      stock: totalStock
    })
    document.dispatchEvent(new Event('cartUpdated'))
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
        className="relative w-full max-w-md md:max-w-5xl bg-[#07080d]/90 border-t md:border border-white/10 rounded-t-3xl md:rounded-3xl shadow-2xl flex flex-col overflow-hidden transition-all duration-300 ease-out backdrop-blur-xl"
        onClick={(e) => e.stopPropagation()} 
        style={{ 
          maxHeight: '85vh'
        }}
      >
        <div className="pointer-events-none absolute top-0 left-0 w-32 h-32 bg-accent/5 blur-[50px] rounded-full -z-10" />
        <div className="pointer-events-none absolute top-0 right-0 w-32 h-32 bg-white/5 blur-[50px] rounded-full -z-10" />
        
        <button 
          onClick={onClose} 
          className="absolute top-5 right-6 p-2 hover:bg-white/5 rounded-full transition-colors text-white/50 hover:text-white z-50"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex-1 overflow-y-auto custom-scrollbar overflow-x-hidden pt-2">
          {items.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 px-6 text-center flex-1 h-full">
              <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <Trash2 className="w-8 h-8 text-white/20" />
              </div>
              <p className="text-lg font-bold text-white mb-2">Carrito vacío</p>
              <button 
                onClick={onClose} 
                className="px-8 py-2 bg-accent text-ink rounded-xl font-black hover:brightness-95 transition-colors text-sm uppercase tracking-widest"
              >
                Seguir mirando
              </button>
            </div>
          ) : (
            <div className="px-6 py-6 md:px-8 md:py-8">
              <div className="grid grid-cols-1 md:grid-cols-12 gap-6 md:gap-8">
                <div className="md:col-span-7 space-y-4">
                  <div className="flex items-center gap-3 mb-6">
                    <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">Tu Bolsa</h2>
                    <span className="bg-accent/15 text-accent text-xs font-black px-2 py-0.5 rounded-full border border-accent/20">
                      {items.length}
                    </span>
                  </div>
                  {items.map((item) => {
                    const itemKey = item.cartItemId || `${item.id}-${item.talle || ''}-${item.color || ''}`
                    return (
                    <div
                      key={itemKey}
                      className="flex gap-4 p-3 md:p-4 rounded-2xl items-center group hover:bg-white/[0.03] transition-colors"
                    >
                      <div className="relative w-24 h-28 md:w-28 md:h-32 bg-white/5 rounded-xl overflow-hidden shrink-0 group">
                        <img 
                          src={item.imagen_url && item.imagen_url !== '' ? item.imagen_url : '/proximamente.png'} 
                          alt={item.nombre} 
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            target.src = '/proximamente.png';
                          }} 
                        />
                      </div>
                      <div className="flex-1 min-w-0 py-1">
                        <h3 className="font-bold text-white text-sm md:text-base leading-tight line-clamp-2 mb-1 group-hover:text-accent transition-colors">
                          {item.nombre}
                        </h3>
                        {(item.talle || item.color) && (
                          <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mb-2">
                            {item.talle && (
                              <span className="text-[10px] font-bold text-white/55 bg-white/5 px-1.5 py-0.5 rounded border border-white/10 uppercase">
                                Talle: {item.talle}
                              </span>
                            )}
                            {item.color && (
                              <div className="flex items-center gap-1.5">
                                <span
                                  className="w-3 h-3 rounded-full border border-white/20 shadow-sm"
                                  style={{ backgroundColor: String(item.color) }}
                                />
                                {!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(String(item.color)) && (
                                  <span className="text-[10px] text-white/55 font-medium capitalize">{String(item.color)}</span>
                                )}
                              </div>
                            )}
                          </div>
                        )}
                        <div className="flex items-center justify-between mt-auto">
                          <div className="flex flex-col">
                            <p className="text-white font-black text-sm md:text-base">
                              ${ formatPrice(item.precio) }
                            </p>
                            {typeof item.stock === 'number' && item.stock <= 0 && (
                              <span className="text-[10px] font-bold text-red-500">Sin stock</span>
                            )}
                            {typeof item.stock === 'number' && item.stock > 0 && item.cantidad > item.stock && (
                              <span className="text-[10px] font-bold text-amber-400">Stock insuficiente</span>
                            )}
                          </div>

                        </div>
                      </div>
                      <button
                        onClick={() => handleRemoveItem(itemKey)}
                        className="p-2.5 text-white/35 hover:text-red-500 hover:bg-red-500/10 rounded-full transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  )})}
                </div>
                <div className="md:col-span-5 space-y-4 h-fit">
                  <div className="p-6 border border-white/10 bg-[#07080d]/40 rounded-2xl">
                    {hasInvalidStock && (
                      <p className="mb-4 text-[11px] font-bold uppercase tracking-[0.2em] text-red-400">
                        Ajustá tu carrito: hay productos sin stock
                      </p>
                    )}
                    <div className="mb-6">
                      <div className="flex gap-2 mb-4">
                        <input
                          type="text"
                          placeholder="CÓDIGO DE CUPÓN"
                          value={couponCode}
                          onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                          disabled={!!coupon}
                          className="flex-1 bg-white/5 border border-white/10 rounded-xl px-4 py-2 text-xs font-bold text-white outline-none focus:border-white/30 disabled:opacity-50"
                        />
                        {coupon ? (
                          <button
                            onClick={() => { removeCoupon(); setCouponCode('') }}
                            className="bg-red-500/10 text-red-500 border border-red-500/20 px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-red-500/20 transition-colors"
                          >
                            Quitar
                          </button>
                        ) : (
                          <button
                            onClick={handleApplyCoupon}
                            disabled={!couponCode.trim()}
                            className="bg-white text-black px-4 rounded-xl font-bold text-[10px] uppercase tracking-widest hover:bg-gray-200 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          >
                            Aplicar
                          </button>
                        )}
                      </div>

                      <div className="space-y-2 mb-4">
                        <div className="flex justify-between text-white/55 text-sm font-medium">
                           <span>Subtotal</span>
                           <span>${ formatPrice(total()) }</span>
                        </div>
                        {coupon && (
                          <div className="flex justify-between text-green-400 text-sm font-bold">
                            <span>Descuento ({coupon.codigo})</span>
                            <span>-${ formatPrice(getDiscount()) }</span>
                          </div>
                        )}
                        <div className="flex justify-between items-end pt-2 border-t border-white/10">
                          <span className="text-white text-sm font-bold">Total</span>
                          <span className="text-3xl font-black text-white tracking-tighter">
                            $<span suppressHydrationWarning>
                              { formatPrice(total() - getDiscount()) }
                            </span>
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-3">
                      <button
                        onClick={handleCheckout}
                        disabled={items.length === 0 || hasInvalidStock}
                        className="w-full h-14 flex items-center justify-center gap-3 bg-accent text-ink rounded-2xl font-black text-lg hover:brightness-95 transition-all shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
                      >
                        <span>Ir al Checkout</span>
                        <ArrowRight className="w-6 h-6" />
                      </button>
                      <button
                        onClick={handleClearCart}
                        className="w-full py-2 text-[11px] text-white/35 hover:text-red-500 font-bold uppercase tracking-widest transition-colors flex items-center justify-center gap-2"
                      >
                        <Trash2 className="w-3 h-3" />
                        Vaciar carrito
                      </button>
                    </div>
                  </div>
                  {suggestedProducts.length > 0 && (
                    <div className="border border-white/10 rounded-2xl bg-white/[0.02]">
                      <div className="px-6 py-4 flex items-center justify-between">
                        <h3 className="text-xs font-black text-white/45 uppercase tracking-[0.35em] flex items-center gap-2">
                          <span className="text-accent">+</span> Completa el fit
                        </h3>
                        <button 
                          onClick={() => setShowSuggestions(!showSuggestions)} 
                          className="p-2 rounded-lg hover:bg-white/5 text-white/60"
                          aria-label="Alternar sugerencias"
                        >
                          <ChevronDown className={`w-4 h-4 transition-transform ${showSuggestions ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                      {showSuggestions && (
                        <div className="px-6 pb-6 grid grid-cols-2 gap-3 max-h-[300px] overflow-y-auto custom-scrollbar">
                          {suggestedProducts.map((prod) => (
                            <div 
                              key={prod.id} 
                              className="group cursor-pointer"
                              onClick={() => handleAddSuggested(prod)}
                            >
                              <div className="relative aspect-[3/4] rounded-2xl overflow-hidden mb-2 border border-white/10 group-hover:border-accent/30 transition-colors">
                                <img 
                                  src={prod.imagen_url || prod.imagenes?.[0] || '/proximamente.png'} 
                                  alt={prod.nombre} 
                                  className="w-full h-full object-cover transition-transform group-hover:scale-110 duration-500" 
                                  onError={(e) => {
                                    const target = e.target as HTMLImageElement;
                                    target.src = '/proximamente.png';
                                  }}
                                />
                                <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                                  <Plus className="w-6 h-6 text-white" />
                                </div>
                              </div>
                              <p className="text-[11px] font-bold text-white truncate">{prod.nombre}</p>
                              <p className="text-[10px] text-accent font-black">
                                ${ formatPrice(prod.precio) }
                              </p>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
