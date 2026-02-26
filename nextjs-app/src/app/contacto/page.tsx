'use client'

import { useState, useEffect } from 'react'
import { Phone, Mail, Instagram, MessageCircle, MapPin } from 'lucide-react'
import { motion } from 'framer-motion'

export default function ContactoPage() {
  const [config, setConfig] = useState({
    whatsapp: '',
    telefono: '',
    email: '',
    instagram: '',
    direccion: '',
    nombre_tienda: 'URBAN'
  })

  useEffect(() => {
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const parsed = await res.json()
        const raw = String(parsed.nombre_tienda || '').trim()
        const safeName = raw && !/berta/i.test(raw) ? raw : 'URBAN'
        setConfig({
          whatsapp: parsed.whatsapp || parsed.telefono || '',
          telefono: parsed.telefono || '',
          email: parsed.email || '',
          instagram: parsed.instagram || '',
          direccion: parsed.direccion || '',
          nombre_tienda: safeName
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

  const handleWhatsAppClick = () => {
    if (config.whatsapp) {
      const message = encodeURIComponent('Hola! Me gustaría obtener más información.')
      window.open(`https://wa.me/${config.whatsapp.replace(/\D/g, '')}?text=${message}`, '_blank')
    }
  }

  const handleInstagramClick = () => {
    if (config.instagram) {
      const username = config.instagram.replace('@', '').replace('https://instagram.com/', '').replace('instagram.com/', '')
      window.open(`https://instagram.com/${username}`, '_blank')
    }
  }

  const handleEmailClick = () => {
    if (config.email) {
      window.location.href = `mailto:${config.email}`
    }
  }

  const handlePhoneClick = () => {
    if (config.telefono) {
      window.location.href = `tel:${config.telefono}`
    }
  }

  return (
    <div className="min-h-screen bg-black text-white py-16">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-16"
        >
          <h1 className="text-5xl md:text-6xl font-bold mb-4 bg-gradient-to-r from-pink-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Contacto
          </h1>
          <p className="text-gray-400 text-lg">
            ¿Tenés alguna pregunta? Estamos aquí para ayudarte
          </p>
        </motion.div>

        {/* Contact Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-12">
          {/* WhatsApp */}
          {config.whatsapp && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              onClick={handleWhatsAppClick}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-green-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-green-500/10 rounded-xl group-hover:bg-green-500/20 transition">
                  <MessageCircle className="w-8 h-8 text-green-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white">WhatsApp</h3>
                  <p className="text-gray-400 text-sm mb-3">Chateá con nosotros</p>
                  <p className="text-white font-medium">{config.whatsapp}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Instagram */}
          {config.instagram && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              onClick={handleInstagramClick}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-pink-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-pink-500/10 rounded-xl group-hover:bg-pink-500/20 transition">
                  <Instagram className="w-8 h-8 text-pink-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white">Instagram</h3>
                  <p className="text-gray-400 text-sm mb-3">Seguinos en Instagram</p>
                  <p className="text-white font-medium">{config.instagram}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Email */}
          {config.email && (
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
              onClick={handleEmailClick}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-blue-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-blue-500/10 rounded-xl group-hover:bg-blue-500/20 transition">
                  <Mail className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white">Email</h3>
                  <p className="text-gray-400 text-sm mb-3">Escribinos un correo</p>
                  <p className="text-white font-medium break-all">{config.email}</p>
                </div>
              </div>
            </motion.div>
          )}

          {/* Teléfono */}
          {config.telefono && (
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.6, delay: 0.4 }}
              onClick={handlePhoneClick}
              className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8 hover:border-purple-500 transition-all cursor-pointer group"
            >
              <div className="flex items-start gap-4">
                <div className="p-3 bg-purple-500/10 rounded-xl group-hover:bg-purple-500/20 transition">
                  <Phone className="w-8 h-8 text-purple-500" />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold mb-2 text-white">Teléfono</h3>
                  <p className="text-gray-400 text-sm mb-3">Llamanos</p>
                  <p className="text-white font-medium">{config.telefono}</p>
                </div>
              </div>
            </motion.div>
          )}
        </div>

        {/* Dirección */}
        {config.direccion && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
            className="bg-gradient-to-br from-gray-900 to-black border border-gray-800 rounded-2xl p-8"
          >
            <div className="flex items-start gap-4">
              <div className="p-3 bg-orange-500/10 rounded-xl">
                <MapPin className="w-8 h-8 text-orange-500" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-bold mb-2 text-white">Dirección</h3>
                <p className="text-gray-400 text-sm mb-3">Visitanos en nuestra tienda</p>
                <p className="text-white font-medium">{config.direccion}</p>
              </div>
            </div>
          </motion.div>
        )}

        {/* Mensaje adicional */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.6 }}
          className="mt-12 text-center"
        >
          <p className="text-gray-400 text-sm">
            Estamos disponibles para responder todas tus consultas sobre productos, envíos y más.
          </p>
          <p className="text-gray-500 text-xs mt-2">
            Horario de atención: Lunes a Viernes de 9:00 a 18:00 hs
          </p>
        </motion.div>
      </div>
    </div>
  )
}
