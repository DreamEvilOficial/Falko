'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'

export default function PageLoader() {
  const [loading, setLoading] = useState(true)
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    // Simular progreso de carga más rápida
    const interval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 100) {
          clearInterval(interval)
          // Esperar un poco antes de ocultar
          setTimeout(() => setLoading(false), 200)
          return 100
        }
        // Progreso más rápido
        return prev + Math.random() * 15 + 5
      })
    }, 50)

    // Limpiar después de 800ms máximo
    const timeout = setTimeout(() => {
      clearInterval(interval)
      setProgress(100)
      setTimeout(() => setLoading(false), 200)
    }, 800)

    return () => {
      clearInterval(interval)
      clearTimeout(timeout)
    }
  }, [])

  if (!loading) return null

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="fixed inset-0 z-[9999] bg-black flex items-center justify-center"
      >
        <div className="text-center">
          {/* Logo animado */}
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4 }}
            className="mb-8"
          >
            <div className="flex items-center justify-center">
              <Image
                src="/urban.png"
                alt="Urban Indumentaria"
                width={260}
                height={72}
                priority
                sizes="(max-width: 768px) 160px, 260px"
                className="h-16 md:h-20 w-auto object-contain"
              />
            </div>
          </motion.div>

          {/* Barra de progreso */}
          <div className="w-64 mx-auto">
            <div className="bg-gray-800 rounded-full h-2 mb-4">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(progress, 100)}%` }}
                transition={{ duration: 0.3, ease: "easeOut" }}
                className="bg-gradient-to-r from-pink-400 to-pink-500 h-2 rounded-full"
              />
            </div>
            
            {/* Porcentaje */}
            <motion.div
              animate={{ opacity: [1, 0.5, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="text-white text-sm"
            >
              {Math.round(progress)}%
            </motion.div>
          </div>

          {/* Mensaje de carga */}
          <motion.div
            animate={{ opacity: [1, 0.7, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="text-gray-300 text-sm mt-4"
          >
            Cargando tienda...
          </motion.div>
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
