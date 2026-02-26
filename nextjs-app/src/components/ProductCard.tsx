'use client'

import React, { useState, useMemo, useCallback, useEffect } from 'react'
import { type Producto } from '@/lib/supabase'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'
import { ShoppingBag, ShoppingCart, Bookmark, Clock } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import toast from 'react-hot-toast'
import VariantModal from './VariantModal'
import CountdownTimer from './CountdownTimer'
// import { motion } from 'framer-motion'

interface Etiqueta {
  id: string
  nombre: string
  tipo: string
  color: string
  icono: string
}

interface ProductCardProps {
  producto: Producto & {
    etiquetas?: Etiqueta[]
    isTopProduct?: boolean
  }
}

function ProductCard({ producto }: ProductCardProps) {
  const addItem = useCartStore((state) => state.addItem)
  const [showModal, setShowModal] = useState(false)
  const [isSaved, setIsSaved] = useState(false)

  // Verificar si está guardado en localStorage al montar
  React.useEffect(() => {
    const saved = localStorage.getItem('savedProducts')
    if (saved) {
      const parsed = JSON.parse(saved)
      if (parsed.includes(producto.id)) setIsSaved(true)
    }
  }, [producto.id])

  const toggleSave = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    const saved = localStorage.getItem('savedProducts')
    let parsed: string[] = saved ? JSON.parse(saved) : []
    
    if (isSaved) {
      parsed = parsed.filter(id => id !== producto.id)
      toast.success('Producto removido de guardados', { icon: '🗑️' })
    } else {
      parsed.push(String(producto.id))
      toast.success('Producto guardado', { icon: '🔖' })
    }
    
    localStorage.setItem('savedProducts', JSON.stringify(parsed))
    setIsSaved(!isSaved)
    window.dispatchEvent(new Event('savedProductsUpdated'))
  }

  // Verificar si es próximo lanzamiento
  const isOriginallyProximo = (producto as any).proximo_lanzamiento || (producto as any).proximamente || false
  
  // Calculate unlocked state initially if date has passed
  const isTimeExpired = useMemo(() => {
      if (!isOriginallyProximo) return false
      const dateStr = (producto as any).fecha_lanzamiento
      if (!dateStr) return false
      const target = new Date(dateStr).getTime()
      if (isNaN(target)) return false
      return target <= Date.now()
  }, [isOriginallyProximo, (producto as any).fecha_lanzamiento])

  const [isUnlocked, setIsUnlocked] = useState(isTimeExpired)
  const isProximoLanzamiento = !isUnlocked && isOriginallyProximo
  
  // Verificar si es producto TOP
  const isTopProduct = (producto as any).isTopProduct || false

  // Variantes del producto (o array vacío si no hay)
  const variantes = useMemo(() => producto.variantes || [], [producto.variantes])
  const hasVariants = variantes.length > 0

  // Obtener talles únicos disponibles
  const availableSizes = useMemo(() => {
    if (!hasVariants) return []
    return Array.from(new Set(variantes.map(v => v.talle))).filter(Boolean)
  }, [variantes, hasVariants])

  // Obtener todos los colores únicos
  const allColors = useMemo(() => {
    if (!hasVariants) return []
    return Array.from(new Set(variantes.map(v => v.color))).filter(Boolean)
  }, [variantes, hasVariants])


  const productId = useMemo(() => String(producto.id), [producto.id])
  const productName = producto.nombre
  const productPrice = producto.precio
  const productOriginalPrice = producto.precio_original
  const productDiscount = useMemo(() => {
    if (!productOriginalPrice || productOriginalPrice <= productPrice) return 0
    return Math.round(((productOriginalPrice - productPrice) / productOriginalPrice) * 100)
  }, [productPrice, productOriginalPrice])

  const productImage = useMemo(() => {
    // Helper para validar URL
    const isValidUrl = (url: string) => {
      if (!url) return false
      if (url.startsWith('/')) return true // Local
      if (url.includes('supabase.co')) return true // Supabase
      return false // Cualquier otra cosa (incluyendo example.com) es inválida para Next/Image
    }

    // 1. Validar imagen_url (prioridad)
    if (producto.imagen_url && typeof producto.imagen_url === 'string' && producto.imagen_url.trim().length > 0) {
       if (isValidUrl(producto.imagen_url)) return producto.imagen_url
    }
    
    // 2. Validar array de imágenes
    if (Array.isArray(producto.imagenes) && producto.imagenes.length > 0) {
      // Buscar primera imagen válida (string o objeto con url)
      const validImg = producto.imagenes.find(img => {
        if (typeof img === 'string' && img.trim().length > 0) return isValidUrl(img)
        if (typeof img === 'object' && img !== null && (img as any).url && typeof (img as any).url === 'string') return isValidUrl((img as any).url)
        return false
      })

      if (validImg) {
        if (typeof validImg === 'string') return validImg
        return (validImg as any).url
      }
    }
    
    // Fallback
    return '/urban.png'
  }, [producto])

  const [imgSrc, setImgSrc] = useState<string>(productImage)

  // Actualizar imgSrc si cambia el producto
  React.useEffect(() => {
    setImgSrc(productImage)
  }, [productImage])

  const productHref = useMemo(() => `/productos/${producto.slug || producto.id}`, [producto.slug, producto.id])

  const hasDiscount = productDiscount > 0

  const formattedPrice = useMemo(() => formatPrice(productPrice), [productPrice])
  
  const formattedOriginalPrice = useMemo(
    () => productOriginalPrice ? formatPrice(productOriginalPrice) : null,
    [productOriginalPrice]
  )
  
  const transferPriceValue = useMemo(() => productPrice * 0.9, [productPrice])
  const transferPrice = useMemo(() => formatPrice(transferPriceValue), [transferPriceValue])


  // Determinar stock actual
  const currentStock = useMemo(() => {
    if (!hasVariants) return producto.stock_actual
    return variantes.reduce((acc, v) => acc + v.stock, 0)
  }, [producto.stock_actual, hasVariants, variantes])

  const handleAddToCart = useCallback((e?: React.MouseEvent) => {
    e?.preventDefault()
    e?.stopPropagation()

    if (!currentStock || currentStock <= 0) {
      toast.error('SIN STOCK')
      return
    }

    if (hasVariants) {
      setShowModal(true)
      return
    }

    addItem({
      id: productId,
      nombre: productName,
      precio: productPrice,
      cantidad: 1,
      imagen_url: productImage,
      stock: currentStock
    })
    toast.success(`✅ ${productName} agregado al carrito`)
    window.dispatchEvent(new Event('cartUpdated'))
  }, [currentStock, hasVariants, addItem, productId, productName, productPrice, productImage])

  const handleVariantConfirm = useCallback(
    (talle: string, color: string) => {
      const variant = variantes.find(v => v.talle === talle && v.color === color)
      const variantStock = variant ? variant.stock : producto.stock_actual

      addItem({
        id: productId,
        nombre: productName,
        precio: productPrice,
        cantidad: 1,
        imagen_url: productImage,
        talle,
        color,
        stock: variantStock
      })
      toast.success(`✅ ${productName} (${talle}, ${color}) agregado al carrito`)
      window.dispatchEvent(new Event('cartUpdated'))
    },
    [addItem, productId, productName, productPrice, productImage, variantes, producto.stock_actual]
  )

  // Verificar etiquetas
  const hasHotSale = producto.etiquetas?.some(e => e.tipo === 'hot_sale')
  const has2x1 = producto.etiquetas?.some(e => e.tipo === '2x1')

  const upcomingContent = (
    <div className="flex flex-col flex-grow items-center justify-center p-4">
       {(producto as any).fecha_lanzamiento ? (
         <div className="w-full mb-3">
           <CountdownTimer 
             targetDate={(producto as any).fecha_lanzamiento} 
             onExpire={() => setIsUnlocked(true)}
           />
         </div>
       ) : null}
       <button 
        type="button"
        disabled
        className="w-full bg-zinc-900 text-white py-3 rounded-lg font-black text-sm uppercase tracking-widest border border-white/10 relative overflow-hidden"
      >
        <span className="relative z-10">PRÓXIMAMENTE</span>
      </button>
    </div>
  )

  const pricingContainerClass = 'p-1 md:p-3 bg-black'

  const regularContent = (
    <div className="flex flex-col flex-grow">
      {hasVariants && (
        <div className="mb-2 md:mb-1 text-xs md:text-sm">
          <div className="flex items-center gap-2 text-gray-400">
            {availableSizes.length > 0 && (
              <span><span className="font-medium">Talles:</span> {availableSizes.slice(0, 3).join(', ')}{availableSizes.length > 3 ? '...' : ''}</span>
            )}
            {allColors.length > 0 && availableSizes.length > 0 && <span>•</span>}
            {allColors.length > 0 && (
              <div className="flex items-center gap-1">
                {allColors.slice(0, 3).map((color, idx) => (
                  <div
                    key={idx}
                    className="w-3 h-3 rounded-full border border-gray-600"
                    style={{ backgroundColor: color }}
                    title={color}
                  />
                ))}
                {allColors.length > 3 && <span className="text-gray-500">+{allColors.length - 3}</span>}
              </div>
            )}
          </div>
        </div>
      )}

      <div className="flex flex-col gap-3 md:gap-2 flex-grow">
        <div className={`flex flex-col gap-2 flex-grow ${pricingContainerClass}`}>
          <div className="flex flex-col gap-1 flex-grow">
            {/* El precio original ahora se muestra al lado del precio actual en el div de abajo */}
            
            {isUnlocked && isOriginallyProximo && (
               <div className="mb-2">
                  <span className="text-green-500 font-black text-xs tracking-[0.2em] uppercase animate-pulse drop-shadow-[0_0_8px_rgba(34,197,94,0.5)]">¡DESBLOQUEADO!</span>
               </div>
            )}

            <div className="flex items-baseline gap-2 mb-1">
              {formattedOriginalPrice && hasDiscount && (
                <p className="text-sm md:text-base font-medium text-gray-500 line-through">
                  $ <span suppressHydrationWarning>{formattedOriginalPrice}</span>
                </p>
              )}
              <p className="text-xl md:text-2xl font-bold text-white">
                $ <span suppressHydrationWarning>{formattedPrice}</span>
              </p>
            </div>

            <div className="flex flex-col gap-1 mt-1">
              <div className="flex flex-wrap items-center gap-1.5 text-gray-400 text-xs md:text-sm">
                <span className="px-1.5 py-0.5 bg-gray-800 rounded text-[10px] md:text-xs font-semibold text-gray-300 border border-gray-700">
                  TRANSF.
                </span>
                <span className="font-medium text-white/90">
                  $ <span suppressHydrationWarning>{transferPrice}</span>
                </span>
              </div>
              {(!currentStock || currentStock <= 0) && (
                <span className="text-[10px] md:text-xs font-black text-red-500 uppercase tracking-[0.2em]">
                  SIN STOCK
                </span>
              )}
            </div>

          </div>

          {/* Cuotas y botón comprar en una fila horizontal */}
          <div className="flex flex-col gap-2 mt-auto" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-1 text-gray-400 text-[10px] md:text-xs whitespace-nowrap">
              <span className="opacity-80">6 cuotas sin interés de</span>
              <span className="font-bold text-white/90 underline decoration-gray-700 underline-offset-2">
                $<span suppressHydrationWarning>{formatPrice(productPrice / 6)}</span>
              </span>
            </div>
            
            <div className="flex gap-2">
              <button
                type="button"
                onClick={handleAddToCart}
                disabled={!currentStock || currentStock <= 0}
                className="flex-1 bg-accent text-ink py-2 md:py-3 rounded-lg font-black text-sm md:text-base flex items-center justify-center gap-2 hover:brightness-95 transition disabled:opacity-50 disabled:cursor-not-allowed disabled:bg-white/10 disabled:text-white/40"
              >
                {!currentStock || currentStock <= 0 ? 'SIN STOCK' : (
                  <>
                    <ShoppingCart className="w-4 h-4" />
                    COMPRAR
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={toggleSave}
                className={`w-12 flex items-center justify-center rounded-lg border transition-colors ${isSaved ? 'bg-white text-black border-white' : 'bg-transparent border-white/20 text-white hover:bg-white/10'}`}
              >
                <Bookmark className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
              </button>
            </div>
          </div>
        </div>

        {has2x1 && (
          <div className="flex items-center gap-2 text-blue-400 text-xs md:text-sm">
            <span aria-hidden>🎁</span>
            <span>Llevá 2 y pagá 1</span>
          </div>
        )}
      </div>
    </div>
  )

  return (
    <div className={`bg-black border rounded-xl md:rounded-2xl overflow-hidden group transition w-full relative flex flex-col h-full hover:z-30 border-white/10 hover:border-white/20 shadow-lg shadow-black/50`}>
      {/* Badge PROXIMAMENTE */}
      {isProximoLanzamiento && (
        <div className="absolute top-3 left-3 z-30 bg-zinc-900 text-white text-[10px] md:text-xs font-black px-2.5 py-1 rounded-sm shadow-lg border border-white/20 tracking-widest backdrop-blur-md">
          PROXIMAMENTE
        </div>
      )}

      {/* Badge NUEVO */}
      {(producto as any).nuevo_lanzamiento && !isProximoLanzamiento && (
        <div className={`absolute ${hasDiscount ? 'top-10' : 'top-3'} left-3 z-30 bg-green-500 text-black text-[10px] md:text-xs font-black px-2.5 py-1 rounded-sm shadow-lg border border-white/20`}>
          NUEVO
        </div>
      )}

      {/* Badge de Descuento arriba a la izquierda */}
      {hasDiscount && !isProximoLanzamiento && (
        <div className="absolute top-3 left-3 z-30 bg-white text-black text-[10px] md:text-xs font-black px-2.5 py-1 rounded-sm shadow-lg border border-white/20">
          {productDiscount}% OFF
        </div>
      )}
      {/* Badge TOP Minimalista */}
      {isTopProduct && (
        <div className={`absolute ${
          hasDiscount 
            ? ((producto as any).nuevo_lanzamiento ? 'top-[4.5rem]' : 'top-10')
            : ((producto as any).nuevo_lanzamiento ? 'top-10' : 'top-3')
        } left-3 z-20 bg-black text-white border border-white/20 px-3 py-1 rounded-sm text-xs font-black flex items-center gap-1 shadow-lg backdrop-blur-md`}>
          TOP PICK
        </div>
      )}
      
      {/* Etiquetas/Badges */}
      <div className="absolute top-3 right-3 z-10 flex flex-col gap-2">
        {producto.etiquetas?.map((etiqueta) => (
          <div
            key={etiqueta.id}
            className={`product-badge ${etiqueta.tipo === 'hot_sale' ? 'hot-badge' : etiqueta.tipo === '2x1' ? 'promo-badge' : 'default-badge'}`}
            style={{ 
              background: etiqueta.tipo === 'hot_sale' 
                ? 'linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)'
                : etiqueta.tipo === '2x1'
                ? 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)'
                : etiqueta.color
            }}
          >
            {etiqueta.icono} {etiqueta.nombre}
          </div>
        ))}
      </div>

      {/* Efecto Minimalista Underground para productos TOP */}
      {isTopProduct && (
        <div className="absolute inset-0 pointer-events-none z-0">
          <div className="absolute inset-0 bg-transparent" />
        </div>
      )}
      
      {/* Fire Effect para HOT SALE */}
      {hasHotSale && <div className="fire-effect"></div>}

      {/* Imagen */}
      {isProximoLanzamiento ? (
        <div className="relative block w-full aspect-[4/5] bg-black overflow-hidden">
          <Image
            src={imgSrc}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-all duration-700 ${
              isProximoLanzamiento 
                ? 'group-hover:scale-105' 
                : 'group-hover:scale-110 group-hover:brightness-110'
            }`}
            onError={() => {
              console.warn(`Error loading image for ${productName}: ${imgSrc}`)
              setImgSrc('/urban.png')
            }}
          />
        </div>
      ) : (
        <Link href={productHref} className="relative block w-full aspect-[4/5] bg-black overflow-hidden">
          <Image
            src={imgSrc}
            alt={productName}
            fill
            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
            className={`object-cover transition-all duration-700 ${
              isProximoLanzamiento 
                ? 'group-hover:scale-105' 
                : 'group-hover:scale-110 group-hover:brightness-110'
            }`}
            onError={() => {
              console.warn(`Error loading image for ${productName}: ${imgSrc}`)
              setImgSrc('/urban.png')
            }}
          />
        </Link>
      )}
      
      {/* Product Info */}
      <div className="p-3 md:p-6 bg-black flex flex-col flex-grow">
        {isProximoLanzamiento ? (
          <div className="block mb-2 group/title">
            <h3 className={`font-bold text-white transition-colors leading-tight break-words line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem] ${
              producto.nombre.length > 25 
                ? 'text-[13px] md:text-base' 
                : 'text-[14px] md:text-lg'
            }`}>
              {producto.nombre}
            </h3>
          </div>
        ) : (
          <Link href={productHref} className="block mb-2 group/title">
            <h3 className={`font-bold text-white transition-colors group-hover/title:text-accent leading-tight break-words line-clamp-2 min-h-[2.5rem] md:min-h-[3.5rem] ${
              producto.nombre.length > 25 
                ? 'text-[13px] md:text-base' 
                : 'text-[14px] md:text-lg'
            }`}>
              {producto.nombre}
            </h3>
          </Link>
        )}
        
        <div className="mt-auto">
          {isProximoLanzamiento ? upcomingContent : regularContent}
        </div>
      </div>

      {/* Variant Selection Modal */}
      <VariantModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onConfirm={handleVariantConfirm}
        variantes={variantes}
        productName={producto.nombre}
      />
    </div>
  )
}

ProductCard.displayName = 'ProductCard'

export default React.memo(ProductCard)
