import { useState, useEffect, useMemo } from 'react'
import { X, Check } from 'lucide-react'
import { createPortal } from 'react-dom'

interface Variante {
  talle: string
  color: string
  stock: number
}

interface VariantModalProps {
  isOpen: boolean
  onClose: () => void
  onConfirm: (talle: string, color: string) => void
  variantes: Variante[]
  productName: string
}

export default function VariantModal({ isOpen, onClose, onConfirm, variantes, productName }: VariantModalProps) {
  const [selectedSize, setSelectedSize] = useState<string>('')
  const [selectedColor, setSelectedColor] = useState<string>('')

  // Get unique sizes
  const availableSizes = useMemo(() => 
    Array.from(new Set(variantes.map(v => v.talle))).filter(Boolean)
  , [variantes])

  // Get colors available for the selected size OR all colors if no size selected (to show them disabled or just for reference)
  const colorsForSize = useMemo(() => {
    if (!selectedSize) {
      return Array.from(new Set(variantes.map(v => v.color))).filter(Boolean)
    }
    return variantes
      .filter(v => v.talle === selectedSize && v.stock > 0)
      .map(v => v.color)
  }, [selectedSize, variantes])

  const allAvailableColors = useMemo(() => 
    Array.from(new Set(variantes.map(v => v.color))).filter(Boolean)
  , [variantes])

  // Bloquear scroll quando el modal está abierto
  // useEffect(() => {
  //   if (isOpen) {
  //     document.body.style.overflow = 'hidden'
  //   } else {
  //     document.body.style.overflow = 'unset'
  //   }
  //   return () => {
  //     document.body.style.overflow = 'unset'
  //   }
  // }, [isOpen])

  // Reset selections when modal opens
  useEffect(() => {
    if (isOpen) {
      setSelectedSize('')
      setSelectedColor('')
    }
  }, [isOpen])

  // Auto-select if only one option
  useEffect(() => {
    if (isOpen && availableSizes.length === 1 && !selectedSize) {
      setSelectedSize(availableSizes[0])
    }
  }, [isOpen, availableSizes, selectedSize])

  useEffect(() => {
    if (selectedSize && colorsForSize.length === 1 && !selectedColor) {
      setSelectedColor(colorsForSize[0])
    }
  }, [selectedSize, colorsForSize, selectedColor])

  const handleConfirm = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (!selectedSize || !selectedColor) return
    onConfirm(selectedSize, selectedColor)
    onClose()
  }

  if (!isOpen) return null

  const modalContent = (
    <div className="fixed inset-0 z-[9999999] flex items-center justify-center pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-500 pointer-events-auto"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative z-10 w-full max-w-sm px-4 pointer-events-auto">
        {/* Modal - Liquid Glass */}
        <div className="bg-[#0d0d0d] border border-white/10 rounded-[40px] w-full overflow-hidden shadow-[0_32px_64px_-12px_rgba(0,0,0,0.8)] animate-in zoom-in-95 slide-in-from-bottom-10 duration-500">
          
          {/* Barra superior */}
          <div className="p-8 pb-4 flex justify-between items-start">
            <div className="space-y-1">
              <h3 className="text-[10px] font-black uppercase tracking-[0.4em] text-gray-500">Configurar variante</h3>
              <h2 className="text-xl font-bold text-white tracking-tight leading-tight">{productName}</h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-10 h-10 rounded-full bg-white/5 border border-white/5 flex items-center justify-center hover:bg-white/10 transition-colors"
            >
              <X className="w-5 h-5 text-white/50" />
            </button>
          </div>

          <div className="p-8 pt-4 space-y-10">
            {/* Talle Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">Seleccionar Talle</label>
                {selectedSize && <span className="text-[10px] font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded-full">{selectedSize}</span>}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((size) => (
                  <button
                    key={size}
                    type="button"
                    onClick={() => setSelectedSize(size)}
                    className={`min-w-[50px] h-[50px] px-3 rounded-2xl font-bold text-xs transition-all duration-300 border ${
                      selectedSize === size
                        ? 'bg-white text-black border-white shadow-[0_0_20px_rgba(255,255,255,0.3)]'
                        : 'bg-white/[0.03] text-gray-500 border-white/5 hover:border-white/20'
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>

            {/* Color Selection */}
            <div className="space-y-4">
              <div className="flex justify-between items-end">
                <label className="text-[9px] font-black uppercase text-gray-400 tracking-[0.2em]">Seleccionar Color</label>
                {selectedColor && <span className="text-[10px] font-bold text-white uppercase bg-white/10 px-2 py-0.5 rounded-full">{selectedColor}</span>}
              </div>
              <div className="flex flex-wrap gap-4">
                {allAvailableColors.map((color) => {
                  const isAvailable = colorsForSize.includes(color)
                  return (
                    <button
                      key={color}
                      type="button"
                      disabled={!isAvailable}
                      onClick={() => setSelectedColor(color)}
                      className={`group relative w-12 h-12 rounded-full transition-all duration-500 ${
                        !isAvailable ? 'opacity-20 grayscale cursor-not-allowed scale-75' : 'hover:scale-110'
                      } ${
                        selectedColor === color 
                          ? 'p-1 bg-white shadow-[0_0_20px_rgba(255,255,255,0.2)]' 
                          : 'p-0.5 bg-white/10'
                      }`}
                    >
                      <div 
                        className="w-full h-full rounded-full border border-black/20 flex items-center justify-center overflow-hidden"
                        style={{ backgroundColor: color }}
                      >
                        {selectedColor === color && (
                          <Check className={`w-5 h-5 ${
                            ['white', '#ffffff', '#fff', 'beige'].includes(color.toLowerCase()) ? 'text-black' : 'text-white'
                          }`} />
                        )}
                      </div>
                      <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[8px] font-black uppercase text-white opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap tracking-widest">
                        {color}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-6 space-y-3">
              <button
                type="button"
                onClick={handleConfirm}
                disabled={!selectedSize || !selectedColor}
                className="w-full h-[64px] bg-white text-black rounded-[24px] font-black uppercase tracking-[0.3em] text-xs hover:bg-gray-200 active:scale-[0.98] transition-all disabled:opacity-20 disabled:grayscale disabled:cursor-not-allowed shadow-[0_20px_40px_-10px_rgba(255,255,255,0.2)]"
              >
                Confirmar Selección
              </button>
              <button
                type="button"
                onClick={onClose}
                className="w-full py-4 text-[9px] font-black uppercase tracking-[0.4em] text-gray-600 hover:text-white transition-colors"
              >
                Cancelar
              </button>
            </div>

            {/* Info contextual */}
            {!selectedSize ? (
              <p className="text-[10px] text-gray-600 text-center italic">Primero selecciona un talle para ver los colores disponibles</p>
            ) : !selectedColor ? (
              <p className="text-[10px] text-gray-600 text-center italic">Ahora elige un color para terminar</p>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  )

  return typeof document !== 'undefined' 
    ? createPortal(modalContent, document.body)
    : null
}
