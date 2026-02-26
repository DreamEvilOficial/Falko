'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'
import { ArrowLeft, Plus, Minus, Trash2, ArrowRight, ShoppingBag, Info } from 'lucide-react'
import toast from 'react-hot-toast'
import NextImage from 'next/image'

export default function CartPage() {
  const router = useRouter()
  const { items, removeItem, updateQuantity, total, clearCart } = useCartStore()

  useEffect(() => {
    if (items.length === 0) router.push('/')
  }, [items.length, router])

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity < 1) {
      removeItem(id)
      return
    }
    updateQuantity(id, newQuantity)
  }

  if (items.length === 0) return null

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-white selection:text-black flex flex-col relative z-10">
      <div className="max-w-6xl mx-auto w-full px-4 md:px-6 relative z-10 flex flex-col flex-1 pb-10">
        {/* Compact Header */}
        <div className="pt-8 pb-6 flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <button 
              onClick={() => router.push('/')}
              className="group flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-[0.2em] mb-4"
            >
              <ArrowLeft className="w-3.5 h-3.5 group-hover:-translate-x-1 transition-transform" />
              <span>Tienda</span>
            </button>
            <h1 className="text-4xl font-black tracking-tighter uppercase italic leading-none">
              Tu <span className="text-accent">Carrito</span>
            </h1>
          </div>
          <div className="text-right hidden md:block">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest mb-1">Items en bolsa</p>
            <p className="text-2xl font-black">{items.length}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 flex-1">
          {/* List Area */}
          <div className="lg:col-span-8 space-y-4">
            <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 rounded-[40px] p-8 min-h-[400px]">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-xs font-black text-gray-500 uppercase tracking-[0.3em] flex items-center gap-2">
                  <ShoppingBag className="w-4 h-4" /> Detalle de Selección
                </h2>
                <button
                  onClick={() => { clearCart(); toast.success('Carrito vaciado') }}
                  className="text-[10px] font-bold text-red-500/50 hover:text-red-500 uppercase tracking-widest transition-colors"
                >
                  Vaciar Bolsa
                </button>
              </div>

              <div className="space-y-6">
                {items.map((item) => {
                  const itemKey = item.cartItemId || `${item.id}-${item.talle || ''}-${item.color || ''}`
                  return (
                  <div key={itemKey} className="group relative flex items-center gap-6 p-4 rounded-3xl hover:bg-white/[0.02] transition-colors">
                    <div className="w-24 h-24 bg-white/5 rounded-2xl overflow-hidden shrink-0 border border-white/10 relative">
                      <NextImage 
                        src={item.imagen_url || '/proximamente.png'} 
                        alt={item.nombre}
                        fill
                        className="object-cover group-hover:scale-110 transition-transform duration-700"
                        sizes="96px"
                      />
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <h3 className="text-sm font-black uppercase tracking-tight truncate">{item.nombre}</h3>
                          <div className="flex gap-2 mt-1">
                            {item.talle && <span className="text-[9px] font-bold px-1.5 py-0.5 bg-white/10 rounded">TALLE {item.talle}</span>}
                            {item.color && <div className="w-3 h-3 rounded-full border border-white/10" style={{backgroundColor: item.color}} />}
                          </div>
                        </div>
                        <button onClick={() => removeItem(itemKey)} className="text-gray-600 hover:text-white p-1">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="flex items-center gap-3 bg-white/5 p-1 rounded-xl border border-white/5">
                          <button onClick={() => handleQuantityChange(itemKey, item.cantidad - 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.05] rounded-lg transition-colors"><Minus className="w-3.5 h-3.5" /></button>
                          <span className="text-xs font-black min-w-[1.5rem] text-center">{item.cantidad}</span>
                          <button onClick={() => handleQuantityChange(itemKey, item.cantidad + 1)} className="w-7 h-7 flex items-center justify-center hover:bg-white/[0.05] rounded-lg transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                        </div>
                        <p className="text-lg font-black tracking-tighter">
                          ${ formatPrice(item.precio * item.cantidad) }
                        </p>
                      </div>
                    </div>
                  </div>
                )})}
              </div>
            </div>
          </div>

          {/* Sticky Sidebar */}
          <div className="lg:col-span-4">
            <div className="sticky top-8 space-y-6">
               <div className="bg-white/[0.03] backdrop-blur-xl border border-white/10 text-white p-8 rounded-[40px] shadow-2xl relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-8 opacity-10 text-accent"><ShoppingBag className="w-32 h-32 rotate-12" /></div>
                  <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-8">Resumen General</h3>
                  
                  <div className="space-y-4 mb-8">
                    <div className="flex justify-between text-sm">
                      <span className="font-bold opacity-60 uppercase text-[10px] tracking-widest text-white/60">Subtotal</span>
                      <span className="font-black">
                        ${ formatPrice(total()) }
                      </span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="font-bold opacity-60 uppercase text-[10px] tracking-widest text-white/60">Envío</span>
                      <span className="font-black text-white/70">POR CALCULAR</span>
                    </div>
                    <div className="h-[1px] bg-white/10 my-4" />
                    <div className="flex justify-between items-end">
                      <span className="font-black uppercase tracking-tighter text-xl leading-none">Total</span>
                      <span className="text-5xl font-black tracking-tighter leading-none">
                        $<span suppressHydrationWarning>
                          { formatPrice(total()) }
                        </span>
                      </span>
                    </div>
                  </div>

                  <button
                    onClick={() => router.push('/checkout')}
                    className="w-full bg-accent text-ink py-5 rounded-3xl font-black text-xs uppercase tracking-[0.2em] hover:brightness-95 active:scale-[0.98] transition-all flex items-center justify-center gap-3 group"
                  >
                    Ir al Checkout
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition-transform" />
                  </button>
               </div>

               <div className="p-6 bg-white/[0.03] backdrop-blur-md border border-white/10 rounded-3xl flex items-start gap-4">
                  <div className="w-8 h-8 rounded-xl bg-accent2/10 flex items-center justify-center shrink-0">
                    <Info className="w-4 h-4 text-accent2" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-500 leading-relaxed uppercase tracking-widest">
                    Envío gratuito en compras superiores a <span className="text-white">$50.000 ARS</span>
                  </p>
               </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
