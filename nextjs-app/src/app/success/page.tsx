'use client'

import { useEffect, useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { CheckCircle, Home, ShoppingBag, Truck } from 'lucide-react'
import Link from 'next/link'
import { supabase } from '@/lib/supabase'
import ReviewForm from '@/components/ReviewForm'
import confetti from 'canvas-confetti'
import Image from 'next/image'

function SuccessContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const ordenId = searchParams.get('orden')
  
  const [loading, setLoading] = useState(true)
  const [order, setOrder] = useState<any>(null)
  const [reviewedItems, setReviewedItems] = useState<Set<string>>(new Set())

  useEffect(() => {
    if (!ordenId) {
      setLoading(false)
      return
    }

    const fetchOrder = async () => {
      try {
        const canUseClient = !!(supabase as any)?.from
        if (canUseClient) {
          const { data, error } = await supabase
            .from('ordenes')
            .select('*')
            .eq('id', ordenId)
            .single()
          if (error) throw error
          setOrder(data)
        } else {
          const res = await fetch(`/api/orders?id=${encodeURIComponent(ordenId)}`)
          if (!res.ok) throw new Error('Error cargando orden')
          const data = await res.json()
          setOrder(data)
        }
        
        // Disparar confetti
        confetti({
          particleCount: 100,
          spread: 70,
          origin: { y: 0.6 }
        })
      } catch (error) {
        console.error('Error fetching order:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchOrder()
  }, [ordenId])

  const handleReviewSubmitted = (itemId: string) => {
    setReviewedItems(prev => new Set(prev).add(itemId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black flex items-center justify-center">
        <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-pink-500"></div>
      </div>
    )
  }

  if (!ordenId || !order) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-4">
        <div className="bg-red-500/10 p-4 rounded-full mb-6">
          <ShoppingBag className="w-12 h-12 text-red-500" />
        </div>
        <h1 className="text-2xl font-bold mb-2">No se encontró la orden</h1>
        <p className="text-gray-400 mb-8">Parece que hubo un error al procesar tu solicitud.</p>
        <Link href="/" className="px-6 py-3 bg-white text-black rounded-lg font-bold hover:bg-gray-200 transition">
          Volver al Inicio
        </Link>
      </div>
    )
  }

  // Parse items if they are JSON string and ensure array shape
  let orderItems: any[] = []
  try {
    const raw = typeof order.items === 'string' ? JSON.parse(order.items) : order.items
    orderItems = Array.isArray(raw) ? raw : []
  } catch {
    orderItems = []
  }

  return (
    <div className="min-h-screen bg-black text-white py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Success Header */}
        <div className="text-center mb-12 animate-in fade-in slide-in-from-bottom-8 duration-700">
          <div className="inline-flex items-center justify-center w-20 h-20 bg-green-500/10 rounded-full mb-6 ring-1 ring-green-500/50">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>
          <h1 className="text-4xl font-bold mb-4 bg-gradient-to-r from-white to-gray-400 bg-clip-text text-transparent">
            ¡Gracias por tu compra!
          </h1>
          <p className="text-gray-400 text-lg">
            Tu orden #{order.numero_orden || (ordenId ? ordenId.slice(0, 8) : '')} ha sido confirmada.
          </p>
          <p className="text-sm text-gray-500 mt-2">
            Te enviamos un email con los detalles.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap justify-center gap-4 mb-16">
          <Link 
            href="/" 
            className="flex items-center gap-2 px-6 py-3 bg-white text-black rounded-full font-bold hover:bg-gray-200 transition hover:scale-105 active:scale-95"
          >
            <Home className="w-4 h-4" />
            Volver al Inicio
          </Link>
          <a 
            href={`https://www.correoargentino.com.ar/formularios/e-commerce?id=${order.tracking_code || order.numero_orden || ordenId}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-6 py-3 bg-pink-600 text-white rounded-full font-bold hover:bg-pink-700 transition hover:scale-105 active:scale-95"
            onClick={(e) => {
              const code = order.tracking_code || order.numero_orden || ordenId;
              if (!code) {
                e.preventDefault();
                alert('Código de seguimiento no disponible aún.');
              }
            }}
          >
            <Truck className="w-4 h-4" />
            Seguimiento de envío
          </a>
          <Link 
            href="/productos" 
            className="flex items-center gap-2 px-6 py-3 bg-gray-900 border border-gray-700 text-white rounded-full font-bold hover:bg-gray-800 transition hover:scale-105 active:scale-95"
          >
            <ShoppingBag className="w-4 h-4" />
            Seguir Comprando
          </Link>
        </div>

        {/* Review Section */}
        <div className="space-y-8 animate-in fade-in slide-in-from-bottom-8 duration-1000 delay-300">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {orderItems.map((item: any, index: number) => {
              // Buscar el ID real del producto. 
              // En el carrito item.id es el ID del producto (string).
              const isReviewed = reviewedItems.has(item.id)
              
              if (isReviewed) return null // Ocultar si ya se revisó en esta sesión

              return (
                <div key={`${item.id}-${index}`} className="flex flex-col gap-4">
                  {/* Product Preview */}
                  <div className="flex items-center gap-4 p-4 bg-gray-900/50 rounded-xl border border-gray-800">
                    <Image 
                      src={item.imagen_url || '/proximamente.png'} 
                      alt={item.nombre} 
                      width={64}
                      height={64}
                      className="object-cover rounded-lg"
                      unoptimized
                    />
                    <div>
                      <h4 className="font-semibold">{item.nombre}</h4>
                      <p className="text-sm text-gray-400">
                        {item.talle && `Talle: ${item.talle}`}
                        {item.color && ` • Color: ${item.color}`}
                      </p>
                    </div>
                  </div>

                  {/* Review Form */}
                  <ReviewForm 
                    productId={item.id} 
                    productName={item.nombre}
                    orderId={ordenId}
                    onSubmitted={() => handleReviewSubmitted(item.id)}
                  />
                </div>
              )
            })}
          </div>
          
          {reviewedItems.size > 0 && reviewedItems.size === orderItems.length && (
            <div className="text-center p-8 bg-green-500/10 rounded-2xl border border-green-500/20 animate-in zoom-in duration-300">
              <h3 className="text-xl font-bold text-green-400 mb-2">¡Todo listo!</h3>
              <p className="text-gray-300">Gracias por valorar tus productos. Tu opinión nos ayuda a mejorar.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default function SuccessPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-black flex items-center justify-center"><div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-white"></div></div>}>
      <SuccessContent />
    </Suspense>
  )
}
