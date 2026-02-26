'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'
import { ordenesAPI } from '@/lib/supabase'
import TransferPayment from '@/components/TransferPayment'
import { ArrowLeft, CreditCard, Building2, ShieldCheck, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

type PaymentMethod = 'mercadopago' | 'transferencia'

export default function PaymentPage() {
  const router = useRouter()
  const { items, total, coupon } = useCartStore()
  const [deliveryData, setDeliveryData] = useState<any>(null)
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>('mercadopago')
  const [loading, setLoading] = useState(false)
  const [showTransferModal, setShowTransferModal] = useState(false)
  const [createdOrder, setCreatedOrder] = useState<any>(null)
  const [orderNote, setOrderNote] = useState('')
  const [config, setConfig] = useState<any>({})

  const isBank = paymentMethod === 'transferencia'
  const discountAmount = isBank ? Math.round(deliveryData?.finalTotal * 0.1) : 0
  const payableTotal = (deliveryData?.finalTotal || 0) - discountAmount

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        setConfig(data)
      } catch (error) {}
    }
    loadConfig()

    const savedDeliveryData = localStorage.getItem('deliveryData')
    if (savedDeliveryData) setDeliveryData(JSON.parse(savedDeliveryData))
    else router.push('/checkout')

    if (items.length === 0) router.push('/cart')
  }, [items.length, router])

  const handlePayment = async () => {
    if (!deliveryData) return
    setLoading(true)
    try {
      const clienteEmail = deliveryData.formData?.email || config.email || 'cliente@tienda.com'
      const direccionCompleta = deliveryData.deliveryMethod === 'shipping' 
        ? `${deliveryData.formData.direccion} ${deliveryData.formData.numero}, ${deliveryData.formData.ciudad}`
        : 'Retiro en Local'
      
      const orden = await ordenesAPI.crear({
        cliente_nombre: `${deliveryData.formData.nombre} ${deliveryData.formData.apellido}`,
        cliente_email: clienteEmail,
        cliente_telefono: deliveryData.formData.telefono,
        direccion_envio: direccionCompleta,
        envio: deliveryData.shippingCost,
        subtotal: total(),
        descuento: discountAmount,
        total: payableTotal,
        estado: 'pendiente',
        metodo_pago: paymentMethod,
        notas: `DNI: ${deliveryData.formData.dniCuit}\nNota: ${orderNote}`,
        items: items, // Fix: Send items to API
        coupon_code: coupon?.codigo
      })
      
      setCreatedOrder(orden)

      if (paymentMethod === 'transferencia') {
        setShowTransferModal(true)
      } else {
        const response = await fetch('/api/mercadopago/create-preference', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            items: items.map(i => ({ 
              id: i.id, // Incluir ID para validación en el servidor
              title: i.nombre, 
              unit_price: i.precio, 
              quantity: i.cantidad,
              talle: i.talle,
              color: i.color
            })),
            shippingCost: deliveryData.shippingCost || 0,
            ordenId: orden.id,
            payer: { email: clienteEmail, name: deliveryData.formData.nombre }
          })
        })
        const data = await response.json()
        if (!response.ok) throw new Error(data.error)
        window.location.href = data.init_point
      }
    } catch (error: any) {
      toast.error(error.message || 'Error procesando el pago')
    } finally {
      setLoading(false)
    }
  }

  if (!deliveryData || items.length === 0) return null

  return (
    <div className="min-h-screen bg-[#000000FA] text-white flex flex-col items-center">
      <div className="fixed inset-0 pointer-events-none opacity-20">
        <div className="absolute top-[10%] left-[5%] w-[30%] h-[30%] bg-pink-500/5 rounded-full blur-[100px]" />
      </div>

      <div className="max-w-4xl w-full px-4 md:px-6 relative z-10 flex-1 pb-10 scale-100 md:scale-[1.03] origin-top transition-transform">
        <div className="pt-8 pb-4 flex items-end justify-between">
          <div>
            <button onClick={() => router.back()} className="group flex items-center gap-2 text-gray-600 hover:text-white transition-colors text-[9px] font-black uppercase tracking-[0.2em] mb-2">
              <ArrowLeft className="w-3 h-3 group-hover:-translate-x-1 transition-transform" />
              <span>Volver</span>
            </button>
            <h1 className="text-3xl font-black tracking-tighter uppercase italic">
              Metodo <span className="text-pink-500">Pago</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
             <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Seguro</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <section className="bg-white/[0.03] border border-white/5 p-5 rounded-[30px]">
              <div className="space-y-3">
                {[
                  { id: 'mercadopago', title: 'MERCADO PAGO', desc: 'Tarjetas y Débito', icon: <CreditCard className="w-5 h-5" /> },
                  { id: 'transferencia', title: 'TRANSFERENCIA', desc: '10% OFF EXTRA', icon: <Building2 className="w-5 h-5" />, off: true }
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setPaymentMethod(m.id as any)}
                    className={`w-full p-4 rounded-2xl border transition-all flex items-center justify-between group ${
                      paymentMethod === m.id ? 'bg-white border-white' : 'bg-white/5 border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${paymentMethod === m.id ? 'bg-black text-white' : 'bg-white/5 text-gray-500'}`}>{m.icon}</div>
                      <div className="text-left">
                        <p className={`text-[10px] font-black ${paymentMethod === m.id ? 'text-black' : 'text-white'}`}>{m.title}</p>
                        <p className={`text-[9px] font-bold ${paymentMethod === m.id ? 'text-black/40' : 'text-gray-500'}`}>{m.desc}</p>
                      </div>
                    </div>
                    {m.off && <div className={`px-2 py-0.5 rounded-full text-[8px] font-black ${paymentMethod === m.id ? 'bg-black text-white' : 'bg-pink-500 text-black'}`}>10% OFF</div>}
                  </button>
                ))}
              </div>
              <textarea
                value={orderNote}
                onChange={e => setOrderNote(e.target.value)}
                placeholder="NOTAS (OPCIONAL)"
                className="w-full bg-white/5 border border-white/10 p-4 rounded-2xl mt-4 outline-none text-xs font-bold uppercase min-h-[80px]"
              />
            </section>

            <button onClick={handlePayment} disabled={loading} className="w-full bg-white text-black py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest hover:bg-gray-200 transition-all flex items-center justify-center gap-3 group">
              {loading ? '...' : ( <>FINALIZAR COMPRA <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" /></> )}
            </button>
          </div>

          <div className="lg:col-span-5 w-full sticky top-8">
            <div className="bg-white text-black p-6 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10">
               <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Total Final</h3>
               <div className="space-y-1.5 border-t border-black/5 pt-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase opacity-50">
                    <span>Subtotal</span>
                    <span>
                      ${ formatPrice(total()) }
                    </span>
                  </div>
                  <div className="flex justify-between text-[10px] font-bold uppercase opacity-40">
                    <span>Envío</span>
                    <span>
                      ${ formatPrice(deliveryData.shippingCost) }
                    </span>
                  </div>
                  {isBank && (
                    <div className="flex justify-between text-[10px] font-black text-green-600 uppercase">
                      <span>10% OFF</span>
                      <span>
                        - ${ formatPrice(discountAmount) }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between items-end pt-1 mt-1 border-t border-black/5">
                    <span className="font-black uppercase tracking-tighter text-[10px]">Total</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">
                      ${ formatPrice(payableTotal) }
                    </span>
                  </div>
               </div>
            </div>
          </div>
        </div>
      </div>

      {showTransferModal && (
        <TransferPayment
          orderTotal={payableTotal}
          orderItems={items}
          orderId={createdOrder?.id}
          orderNumber={createdOrder?.numero_orden}
          customer={{ nombre: deliveryData?.formData?.nombre, apellido: deliveryData?.formData?.apellido }}
          onClose={() => setShowTransferModal(false)}
        />
      )}
    </div>
  )
}
