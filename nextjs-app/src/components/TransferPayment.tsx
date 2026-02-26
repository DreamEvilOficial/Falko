'use client'

import { useState, useEffect } from 'react'
import { Copy, Check, Instagram, Clock, AlertTriangle } from 'lucide-react'
import toast from 'react-hot-toast'
import { useCartStore } from '@/store/cartStore'
import { formatPrice } from '@/lib/formatters'

interface TransferPaymentProps {
  orderTotal: number
  orderItems: any[]
  orderId?: string
  orderNumber?: string
  customer?: { nombre?: string; apellido?: string }
  onClose: () => void
}

interface TransferData {
  cbu: string
  alias: string
  titular: string
  bankName: string
  amount: number
  expiration: string
}

export default function TransferPayment({ orderTotal, orderItems, orderId, orderNumber, customer, onClose }: TransferPaymentProps) {
  const [loading, setLoading] = useState(true)
  const [transferData, setTransferData] = useState<TransferData | null>(null)
  const [copied, setCopied] = useState<{ [key: string]: boolean }>({})
  const [timeLeft, setTimeLeft] = useState<string>('')
  const [expired, setExpired] = useState(false)
  const [verifying, setVerifying] = useState(false)

  useEffect(() => {
    if (orderId) {
      initTransfer()
    }
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = 'unset'
    }
  }, [orderId])

  // Polling para verificar pago
  useEffect(() => {
    if (!orderId || expired || !transferData) return

    const checkInterval = setInterval(async () => {
      try {
        setVerifying(true)
        const res = await fetch('/api/transfer/check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ orderId })
        })
        const data = await res.json()

        if (data.paid) {
          clearInterval(checkInterval)
          toast.success('¡Pago confirmado! Procesando tu pedido...')
          handleFinish()
        }
      } catch (error) {
        console.error('Error verificando pago:', error)
      } finally {
        setVerifying(false)
      }
    }, 3000)

    return () => clearInterval(checkInterval)
  }, [orderId, expired, transferData])

  useEffect(() => {
    if (!transferData?.expiration) return

    const interval = setInterval(async () => {
      const now = new Date().getTime()
      const exp = new Date(transferData.expiration).getTime()
      const diff = exp - now

      if (diff <= 0) {
        clearInterval(interval)
        if (!expired) {
          setExpired(true)
          setTimeLeft('00:00')
          try {
             await fetch('/api/transfer/cancel', {
               method: 'POST',
               headers: { 'Content-Type': 'application/json' },
               body: JSON.stringify({ orderId })
             })
          } catch (e) { console.error(e) }
        }
      } else {
        const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60))
        const seconds = Math.floor((diff % (1000 * 60)) / 1000)
        setTimeLeft(`${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`)
      }
    }, 1000)

    return () => clearInterval(interval)
  }, [transferData, expired, orderId])

  async function initTransfer() {
    try {
      const res = await fetch('/api/transfer/create', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderId })
      })
      
      if (!res.ok) throw new Error('Error generando datos de transferencia')
      
      const data = await res.json()
      setTransferData(data)
    } catch (error) {
      console.error(error)
      toast.error('Error al iniciar pago. Intenta nuevamente.')
    } finally {
      setLoading(false)
    }
  }

  const copyToClipboard = async (text: string, field: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopied({ ...copied, [field]: true })
      toast.success(`${field} copiado!`)
      setTimeout(() => {
        setCopied({ ...copied, [field]: false })
      }, 2000)
    } catch (error) {
      toast.error('Error al copiar')
    }
  }

  const handleFinish = () => {
    const cartStore = (window as any).cartStore || useCartStore.getState()
    if (cartStore && cartStore.clearCart) {
      cartStore.clearCart()
    }
    window.location.href = `/success?orden=${orderId || orderNumber || ''}`
  }

  if (loading) {
    return (
      <div className="fixed inset-0 z-[10000] bg-black/90 backdrop-blur-xl flex items-center justify-center p-4">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
          <p className="text-white/50 text-xs font-bold uppercase tracking-widest">Generando datos de pago...</p>
        </div>
      </div>
    )
  }

  if (!transferData) return null

  return (
    <div className="fixed inset-0 z-[10000] bg-black/95 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="glass-card w-full max-w-[440px] md:max-w-[520px] relative flex flex-col max-h-[90vh] border border-white/10 shadow-2xl bg-[#0a0a0a]">
        
        {/* Header */}
        <div className="px-5 pt-6 pb-4 text-center relative">
          <button onClick={onClose} className="absolute right-4 top-4 text-white/20 hover:text-white transition-colors">
            ✕
          </button>
          
          <div className="w-14 h-14 mx-auto bg-blue-500/10 rounded-full flex items-center justify-center mb-4 border border-blue-500/20 shadow-[0_0_30px_-10px_rgba(59,130,246,0.5)]">
            <span className="text-2xl font-black text-blue-400">i</span>
          </div>
          
          <h2 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tight">
            ¡Transferencia pendiente!
          </h2>
          <p className="text-gray-400 text-xs font-bold mt-2 leading-relaxed max-w-[80%] mx-auto">
            Realizá la transferencia al siguiente CVU/CBU usando el <span className="text-white">monto exacto</span> para la validación automática.
          </p>
        </div>

        <div className="px-6 pb-6 space-y-4 overflow-y-auto custom-scrollbar">
          
          {/* Timer */}
          {!expired ? (
            <div className="flex items-center justify-center gap-2 text-amber-400 bg-amber-400/5 py-2 rounded-lg border border-amber-400/10">
              <Clock className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">
                Expira en: <span className="text-base">{timeLeft}</span>
              </p>
            </div>
          ) : (
            <div className="flex items-center justify-center gap-2 text-red-400 bg-red-400/5 py-2 rounded-lg border border-red-400/10">
              <AlertTriangle className="w-4 h-4" />
              <p className="text-xs font-black uppercase tracking-widest">
                Orden Expirada
              </p>
            </div>
          )}

          {/* CBU Box */}
          <div className="bg-white rounded-2xl px-4 py-4 text-center shadow-xl border border-blue-500/30 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-blue-500" />
            <p className="text-blue-600 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              CVU / CBU
            </p>
            <div 
              onClick={() => copyToClipboard(transferData.cbu, 'CVU')}
              className="text-lg md:text-xl font-black text-gray-900 tracking-wider cursor-pointer hover:scale-105 transition-transform select-all break-all py-1"
            >
              {transferData.cbu}
            </div>
            <div className="flex flex-col gap-0.5 mt-1">
                <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Titular: {transferData.titular}</p>
                {transferData.alias && <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Alias: {transferData.alias}</p>}
                {transferData.bankName && <p className="text-gray-400 text-[9px] font-bold uppercase tracking-wider">Banco: {transferData.bankName}</p>}
            </div>
            
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {copied['CVU'] ? <Check className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
            </div>
          </div>

          {/* Amount Box */}
          <div className="bg-[#E8F5E9] rounded-2xl px-4 py-4 text-center shadow-xl border border-green-500/30 relative overflow-hidden group">
            <div className="absolute top-0 left-0 w-full h-1 bg-green-500" />
            <p className="text-green-700 text-[10px] font-black uppercase tracking-[0.2em] mb-1">
              MONTO EXACTO A TRANSFERIR
            </p>
            <div 
              onClick={() => copyToClipboard(String(transferData.amount), 'Monto')}
              className="text-3xl md:text-4xl font-black text-green-600 tracking-tighter cursor-pointer hover:scale-105 transition-transform py-1"
            >
              ${transferData.amount.toLocaleString('es-AR', { minimumFractionDigits: 2 })}
            </div>
            <p className="text-green-600/60 text-[9px] font-bold uppercase tracking-widest mt-1">
              * Incluye centavos verificadores
            </p>
            <div className="absolute right-3 top-3 opacity-0 group-hover:opacity-100 transition-opacity">
              {copied['Monto'] ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4 text-green-600/50" />}
            </div>
          </div>
          
          <div className="flex items-center justify-center gap-2 pt-2 opacity-50">
             <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse" />
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
               {verifying ? 'Verificando pago...' : 'Esperando transferencia...'}
             </p>
          </div>

        </div>
      </div>
    </div>
  )
}
