'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import NextImage from 'next/image'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'
import { ordenesAPI } from '@/lib/supabase'
import { Truck, Store, MapPin, ArrowRight, ArrowLeft, ShieldCheck, ChevronRight } from 'lucide-react'
import toast from 'react-hot-toast'

type DeliveryMethod = 'shipping' | 'pickup'

type CheckoutFormData = {
  nombre: string
  apellido: string
  telefono: string
  email?: string
  direccion: string
  numero: string
  departamento: string
  barrio: string
  ciudad: string
  provincia: string
  codigoPostal: string
  dniCuit: string
}

export default function CheckoutPage() {
  const router = useRouter()
  const { items, total, coupon, getDiscount } = useCartStore()
  const [deliveryMethod, setDeliveryMethod] = useState<DeliveryMethod>('shipping')
  const [shippingCost, setShippingCost] = useState(0)
  const [calculatingShipping, setCalculatingShipping] = useState(false)
  const [config, setConfig] = useState<any>({})
  const [isSubmitting, setIsSubmitting] = useState(false)
 
  const [formData, setFormData] = useState<CheckoutFormData>({
    nombre: '',
    apellido: '',
    email: '',
    telefono: '',
    direccion: '',
    numero: '',
    departamento: '',
    barrio: '',
    ciudad: '',
    provincia: '',
    codigoPostal: '',
    dniCuit: ''
  })
  const [errors, setErrors] = useState<Partial<Record<keyof CheckoutFormData, string>>>({})
  
  const [shippingOption, setShippingOption] = useState<'correo' | 'andreani'>('correo')
  const [receiveEmails, setReceiveEmails] = useState(false)

  const PROVINCIAS = [
    'Buenos Aires', 'CABA', 'Catamarca', 'Chaco', 'Chubut', 'Córdoba', 'Corrientes', 
    'Entre Ríos', 'Formosa', 'Jujuy', 'La Pampa', 'La Rioja', 'Mendoza', 'Misiones', 
    'Neuquén', 'Río Negro', 'Salta', 'San Juan', 'San Luis', 'Santa Cruz', 'Santa Fe', 
    'Santiago del Estero', 'Tierra del Fuego', 'Tucumán'
  ]

  useEffect(() => {
    if (items.length === 0) router.push('/')
  }, [items.length, router])

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const data = await res.json()
        setConfig(data || {})
      } catch (error) {}
    }
    loadConfig()
    window.addEventListener('config-updated', loadConfig)
    return () => window.removeEventListener('config-updated', loadConfig)
  }, [])

  const validateField = (field: keyof CheckoutFormData, value: string) => {
    if (field === 'nombre' || field === 'apellido') {
      if (!value.trim()) return 'Este campo es obligatorio'
      if (value.trim().length < 2) return 'Debe tener al menos 2 caracteres'
    }
    if (field === 'email') {
        if (!value.trim()) return 'Ingresá tu email para recibir el comprobante'
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())) return 'Formato de email inválido'
    }
    if (field === 'telefono') {
      if (!value.trim()) return 'Ingresá un número válido'
      if (!/^[0-9+\s()-]{6,}$/.test(value.trim())) return 'Formato de teléfono inválido'
    }
    if (field === 'dniCuit') {
      const trimmed = value.trim()
      if (!trimmed) return 'Ingresá tu DNI o CUIT'
      if (!/^[0-9]{6,11}$/.test(trimmed)) return 'Ingresá solo números (6 a 11 dígitos)'
    }
    if (deliveryMethod === 'shipping') {
      if (field === 'direccion' || field === 'numero' || field === 'codigoPostal' || field === 'ciudad' || field === 'provincia') {
        if (!value.trim()) return 'Este campo es obligatorio'
      }
    }
    return ''
  }

  const handleFieldChange = (field: keyof CheckoutFormData) => (e: React.ChangeEvent<HTMLInputElement>) => {
    let value = e.target.value
    if (field === 'dniCuit') {
      value = value.replace(/\D/g, '').slice(0, 11)
    }
    setFormData(prev => ({ ...prev, [field]: value }))
    const error = validateField(field, value)
    setErrors(prev => ({ ...prev, [field]: error }))
  }

  const calculateShipping = useCallback(async () => {
    setCalculatingShipping(true)
    setTimeout(() => {
      const isCaba = formData.codigoPostal.startsWith('1')
      const baseCost = shippingOption === 'correo' ? (isCaba ? 3500 : 4500) : (isCaba ? 5200 : 6500)
      setShippingCost(baseCost)
      setCalculatingShipping(false)
    }, 500)
  }, [formData.codigoPostal, shippingOption])

  useEffect(() => {
    let threshold = 50000
    let forceFree = false

    if (config?.shipping_rules) {
      threshold = Number(config.shipping_rules.threshold)
      forceFree = config.shipping_rules.enabled
    } else {
      threshold = Number(config?.envio_gratis_umbral ?? 50000)
      forceFree = config?.envio_gratis_forzado === true || config?.envio_gratis_forzado === 'true'
    }

    const isFree = deliveryMethod === 'pickup' || forceFree || total() >= threshold
    if (isFree) { setShippingCost(0); return; }
    if (formData.codigoPostal.length >= 4) calculateShipping()
    else setShippingCost(0)
  }, [formData.codigoPostal, deliveryMethod, shippingOption, config, items.length, total, calculateShipping])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (isSubmitting) return
    const fieldsToValidate: (keyof CheckoutFormData)[] =
      deliveryMethod === 'shipping'
        ? ['nombre', 'apellido', 'email', 'telefono', 'dniCuit', 'direccion', 'numero', 'codigoPostal', 'ciudad', 'provincia']
        : ['nombre', 'apellido', 'email', 'telefono', 'dniCuit']

    const nextErrors: Partial<Record<keyof CheckoutFormData, string>> = {}
    fieldsToValidate.forEach(field => {
      const value = formData[field] || ''
      const error = validateField(field, value)
      if (error) nextErrors[field] = error
    })

    setErrors(prev => ({ ...prev, ...nextErrors }))

    if (Object.values(nextErrors).some(Boolean)) {
      toast.error('Revisá los datos marcados en rojo')
      return
    }

    setIsSubmitting(true)
    const toastId = toast.loading('Guardando datos de entrega...')

    try {
      const finalTotal = total() - getDiscount() + shippingCost
      const direccionCompleta = deliveryMethod === 'shipping' 
        ? `${formData.direccion} ${formData.numero}, ${formData.ciudad}, ${formData.provincia}`
        : 'Retiro en Local'

      localStorage.setItem('deliveryData', JSON.stringify({
        formData, 
        deliveryMethod, 
        shippingCost, 
        shippingOption, 
        finalTotal,
        direccion_envio: direccionCompleta,
        receiveEmails
      }))

      toast.success('Datos guardados', { id: toastId })
      router.push('/payment')
    } catch (error) {
      console.error(error)
      toast.error('Error al procesar los datos', { id: toastId })
      setIsSubmitting(false)
    }
  }

  if (items.length === 0) return null

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
              Entrega <span className="text-pink-500">Datos</span>
            </h1>
          </div>
          <div className="flex items-center gap-2 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
             <ShieldCheck className="w-3.5 h-3.5 text-green-500" />
             <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">Seguro</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-7 space-y-4">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-1.5 p-1 bg-white/5 border border-white/10 rounded-2xl">
                <button type="button" onClick={() => setDeliveryMethod('shipping')} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${deliveryMethod === 'shipping' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                  Envío
                </button>
                <button type="button" onClick={() => setDeliveryMethod('pickup')} className={`flex items-center justify-center gap-2 py-3 rounded-xl font-black text-[9px] uppercase tracking-widest transition-all ${deliveryMethod === 'pickup' ? 'bg-white text-black shadow-lg' : 'text-gray-500 hover:text-white'}`}>
                  Retiro
                </button>
              </div>

              <div className="space-y-3">
                <section className="bg-white/[0.03] border border-white/5 p-5 rounded-[30px]">
                  <h3 className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-4">Información Personal</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <input
                        required
                        type="text"
                        placeholder="NOMBRE"
                        value={formData.nombre}
                        onChange={handleFieldChange('nombre')}
                        className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase tracking-tight min-h-[48px] ${errors.nombre ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                      />
                      {errors.nombre && <p className="text-[10px] text-red-500 font-semibold">{errors.nombre}</p>}
                    </div>
                    <div className="col-span-2 sm:col-span-1 space-y-1">
                      <input
                        required
                        type="text"
                        placeholder="APELLIDO"
                        value={formData.apellido}
                        onChange={handleFieldChange('apellido')}
                        className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase tracking-tight min-h-[48px] ${errors.apellido ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                      />
                      {errors.apellido && <p className="text-[10px] text-red-500 font-semibold">{errors.apellido}</p>}
                    </div>
                    <div className="col-span-2 space-y-1">
                      <input
                        required
                        type="email"
                        placeholder="EMAIL (PARA ENVÍO DE COMPROBANTE)"
                        value={formData.email}
                        onChange={handleFieldChange('email')}
                        className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase tracking-tight min-h-[48px] ${errors.email ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                      />
                      {errors.email && <p className="text-[10px] text-red-500 font-semibold">{errors.email}</p>}
                    </div>
                    <div className="col-span-2 space-y-1">
                      <input
                        required
                        type="tel"
                        placeholder="WHATSAPP / CELULAR"
                        className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase tracking-tight min-h-[48px] ${errors.telefono ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                        value={formData.telefono}
                        onChange={handleFieldChange('telefono')}
                      />
                      {errors.telefono && <p className="text-[10px] text-red-500 font-semibold">{errors.telefono}</p>}
                    </div>
                  </div>
                </section>

                {deliveryMethod === 'shipping' ? (
                  <section className="bg-white/[0.03] border border-white/5 p-5 rounded-[30px] animate-in fade-in slide-in-from-top-2">
                    <h3 className="text-[9px] font-black text-gray-700 uppercase tracking-widest mb-4">Ubicación de Envío</h3>
                    <div className="grid grid-cols-12 gap-3">
                      <div className="col-span-12 sm:col-span-8 space-y-1">
                        <input
                          required
                          type="text"
                          placeholder="DOMICILIO"
                          className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold min-h-[48px] ${errors.direccion ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                          value={formData.direccion}
                          onChange={handleFieldChange('direccion')}
                        />
                        {errors.direccion && <p className="text-[10px] text-red-500 font-semibold">{errors.direccion}</p>}
                      </div>
                      <div className="col-span-12 sm:col-span-4 space-y-1">
                        <input
                          required
                          type="text"
                          placeholder="NUMERO"
                          className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold min-h-[48px] ${errors.numero ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                          value={formData.numero}
                          onChange={handleFieldChange('numero')}
                        />
                        {errors.numero && <p className="text-[10px] text-red-500 font-semibold">{errors.numero}</p>}
                      </div>
                      <div className="col-span-12 sm:col-span-4 space-y-1">
                        <input
                          required
                          type="text"
                          placeholder="CODIGO POSTAL"
                          className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold min-h-[48px] ${errors.codigoPostal ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                          value={formData.codigoPostal}
                          onChange={handleFieldChange('codigoPostal')}
                        />
                        {errors.codigoPostal && <p className="text-[10px] text-red-500 font-semibold">{errors.codigoPostal}</p>}
                      </div>
                      <div className="col-span-12 sm:col-span-8 space-y-1">
                        <input
                          required
                          type="text"
                          placeholder="CIUDAD"
                          className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase min-h-[48px] ${errors.ciudad ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                          value={formData.ciudad}
                          onChange={handleFieldChange('ciudad')}
                        />
                        {errors.ciudad && <p className="text-[10px] text-red-500 font-semibold">{errors.ciudad}</p>}
                      </div>
                      <div className="col-span-12 space-y-1">
                        <select
                          required
                          className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase min-h-[48px] ${errors.provincia ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                          value={formData.provincia}
                          onChange={(e) => {
                            setFormData(prev => ({ ...prev, provincia: e.target.value }))
                            if (errors.provincia) setErrors(prev => ({ ...prev, provincia: '' }))
                          }}
                        >
                          <option value="" className="bg-black">SELECCIONAR PROVINCIA</option>
                          {PROVINCIAS.map(prov => (
                            <option key={prov} value={prov} className="bg-black text-white">{prov}</option>
                          ))}
                        </select>
                        {errors.provincia && <p className="text-[10px] text-red-500 font-semibold">{errors.provincia}</p>}
                      </div>
                    </div>
                  </section>
                ) : (
                  <div className="p-4 border border-dashed border-white/10 rounded-[25px] flex items-center gap-3">
                    <div className="w-8 h-8 bg-white text-black rounded-lg flex items-center justify-center shrink-0"><MapPin className="w-4 h-4" /></div>
                    <p className="text-[10px] font-black uppercase tracking-widest">Mitre 692, Cañada de Gomez</p>
                  </div>
                )}

                <section className="bg-white/[0.03] border border-white/5 p-5 rounded-[30px]">
                  <div className="space-y-1">
                    <input
                      required
                      type="text"
                      placeholder="DNI / CUIL DE FACTURACIÓN"
                      value={formData.dniCuit}
                      onChange={handleFieldChange('dniCuit')}
                      inputMode="numeric"
                      pattern="[0-9]*"
                      className={`w-full bg-white/5 border p-3 rounded-xl outline-none text-xs font-bold uppercase min-h-[48px] ${errors.dniCuit ? 'border-red-500 focus:border-red-500' : 'border-white/10 focus:border-white/30'}`}
                    />
                    {errors.dniCuit && <p className="text-[10px] text-red-500 font-semibold">{errors.dniCuit}</p>}
                  </div>
                </section>
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className={`w-full bg-white text-black py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 group ${
                  isSubmitting ? 'opacity-60 cursor-not-allowed' : 'hover:bg-gray-200'
                }`}
              >
                {isSubmitting ? 'PROCESANDO...' : 'CONTINUAR AL PAGO'}
                <ChevronRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </button>
            </form>
          </div>

          <div className="lg:col-span-5 w-full sticky top-8">
              <div className="bg-white text-black p-6 rounded-[32px] shadow-[0_32px_64px_-16px_rgba(0,0,0,0.5)] border border-white/10">
                <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-6 flex items-center justify-between">
                  Resumen de Compra
                  <span className="text-black/20 italic">{items.length} items</span>
                </h3>
                <div className="space-y-4 mb-6 max-h-[30vh] overflow-y-auto custom-scrollbar pr-2">
                   {items.map((item, i) => (
                     <div key={i} className="flex items-center gap-2">
                        <div className="w-8 h-8 bg-black/5 rounded overflow-hidden shrink-0 relative">
                          <NextImage 
                            src={item.imagen_url || '/proximamente.png'} 
                            alt={item.nombre}
                            fill
                            className="object-cover"
                            sizes="32px"
                          />
                        </div>
                        <div className="flex-1 truncate">
                          <p className="text-[9px] font-black uppercase truncate">{item.nombre}</p>
                          {(item.talle || item.color) && (
                            <p className="text-[7px] font-bold text-gray-500 uppercase tracking-widest">
                              {[item.talle, item.color].filter(Boolean).join(' / ')}
                            </p>
                          )}
                        </div>
                        <p className="text-[10px] font-black tracking-tight">
                          ${ formatPrice(item.precio * item.cantidad) }
                        </p>
                     </div>
                   ))}
                </div>
                <div className="space-y-1.5 border-t border-black/5 pt-3">
                  <div className="flex justify-between text-[10px] font-bold uppercase opacity-50">
                    <span>Subtotal</span>
                    <span>
                      ${ formatPrice(total()) }
                    </span>
                  </div>
                  
                  {coupon && (
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase text-green-600 bg-green-50 p-2 rounded-lg">
                      <span>Cupón ({coupon.codigo})</span>
                      <span>
                        -${ formatPrice(getDiscount()) }
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between text-[9px] font-bold uppercase opacity-40">
                    <span>Envío</span>
                    <span className="text-green-600">
                      {calculatingShipping
                        ? '...'
                        : shippingCost === 0
                          ? 'CALCULANDO COSTO'
                          : (
                            <>$<span suppressHydrationWarning>
                              { formatPrice(shippingCost) }
                            </span></>
                          )}
                    </span>
                  </div>
                  <div className="flex justify-between items-end pt-1">
                    <span className="font-black uppercase tracking-tighter text-[10px]">Total</span>
                    <span className="text-4xl font-black tracking-tighter leading-none">
                      $<span suppressHydrationWarning>
                        { formatPrice(total() - getDiscount() + shippingCost) }
                      </span>
                    </span>
                  </div>
                </div>
             </div>
          </div>
        </div>
      </div>
    </div>
  )
}
