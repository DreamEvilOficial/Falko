'use client'

import { Instagram, Phone } from 'lucide-react'
import { useEffect, useState } from 'react'

export default function Contact() {
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState({
    whatsapp: '+54 9 11 XXXX-XXXX',
    instagram: '@tu_tienda'
  })

  useEffect(() => {
    setMounted(true)
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const apiConfig = await res.json()
        setConfig({
          whatsapp: apiConfig.whatsapp || '+54 9 11 XXXX-XXXX',
          instagram: apiConfig.instagram || '@tu_tienda'
        })
      } catch (error) {
        console.error('Error loading config:', error)
      }
    }
    
    loadConfig()
    window.addEventListener('config-updated', loadConfig)
    
    return () => {
      window.removeEventListener('config-updated', loadConfig)
    }
  }, [])

  if (!mounted) return null

  return (
    <section className="max-w-7xl mx-auto px-4 py-16">
      <div className="glass-card p-12 text-center">
        <h2 className="text-4xl font-bold mb-6">Contacto</h2>
        <p className="text-gray-600 mb-8 max-w-2xl mx-auto">
          ¿Tienes alguna pregunta? No dudes en contactarnos a través de nuestros canales
        </p>
        
        <div className="flex flex-wrap justify-center gap-6">
          <a
            href={`https://instagram.com/${config.instagram.replace('@', '')}`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white px-6 py-3 rounded-full hover:opacity-90 transition"
          >
            <Instagram className="w-5 h-5" />
            Instagram
          </a>
        </div>
      </div>
    </section>
  )
}
