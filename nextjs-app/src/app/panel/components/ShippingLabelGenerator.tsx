'use client'

import { useState } from 'react'
import { Printer, Truck, Check } from 'lucide-react'
import { paqarService } from '@/services/paqarService'
import toast from 'react-hot-toast'

export default function ShippingLabelGenerator({ order, onLabelGenerated, senderOverride }: { order: any, onLabelGenerated: (code: string) => void, senderOverride?: any }) {
  const [loading, setLoading] = useState(false)
  const [generatedLabel, setGeneratedLabel] = useState<any>(null)

  const handleGenerate = async () => {
    setLoading(true)
    try {
      const label = await paqarService.createShipment({
          ...order,
          senderOverride 
      })

      setGeneratedLabel(label)
      onLabelGenerated(label.trackingNumber)
      toast.success('Etiqueta Correo Argentino generada')
    } catch (error: any) {
      console.error(error)
      toast.error('Error generando etiqueta')
    } finally {
      setLoading(false)
    }
  }

  const handlePrint = () => {
    if (!generatedLabel) return
    const html = paqarService.generateLabelHtml(generatedLabel)
    const printWindow = window.open('', '_blank')
    if (printWindow) {
      printWindow.document.write(html)
      printWindow.document.close()
    }
  }

  return (
    <div className="bg-[#002f6c]/10 border border-[#002f6c]/30 p-6 rounded-[24px]">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xs font-black text-[#60a5fa] uppercase tracking-[0.32em] flex items-center gap-2">
          <Truck className="w-4 h-4" /> Correo Argentino
        </h3>
      </div>

      {!generatedLabel ? (
        <button 
          onClick={handleGenerate}
          disabled={loading}
          className="w-full py-4 bg-[#FFD700] hover:bg-[#ffe14f] text-[#0033A0] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-[#FFD700]/20 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
             <span className="animate-pulse">Generando...</span>
          ) : (
             <>Generar Etiqueta Paq.ar</>
          )}
        </button>
      ) : (
        <div className="space-y-4 animate-in fade-in slide-in-from-bottom-2">
          <div className="bg-[#0033A0] p-4 rounded-xl flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center text-[#0033A0]">
                 <Check className="w-6 h-6" />
              </div>
              <div>
                <p className="text-[#FFD700] text-[10px] font-black uppercase tracking-widest">Etiqueta Lista</p>
                <p className="text-white font-mono text-sm font-bold">{generatedLabel.trackingNumber}</p>
              </div>
            </div>
          </div>
          <button 
            onClick={handlePrint}
            className="w-full py-3 bg-white hover:bg-gray-100 text-[#0033A0] rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2 shadow-lg"
          >
            <Printer className="w-4 h-4" /> Imprimir / PDF
          </button>
        </div>
      )}
    </div>
  )
}
