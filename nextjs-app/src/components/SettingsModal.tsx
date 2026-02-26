'use client'

import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'

interface SettingsModalProps {
  onClose: () => void
  onSave: (storeName: string) => void
}

export default function SettingsModal({ onClose, onSave }: SettingsModalProps) {
  const [mounted, setMounted] = useState(false)
  const [storeName, setStoreName] = useState('')
  const [faviconUrl, setFaviconUrl] = useState('')
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    setMounted(true)
    loadConfig()
  }, [])

  const loadConfig = async () => {
    try {
      const res = await fetch('/api/config')
      const config = await res.json()
      const raw = String(config.nombre_tienda || '').trim()
      setStoreName(raw && !/berta/i.test(raw) ? raw : 'URBAN')
      setFaviconUrl(String(config.favicon_url || '/favicon.svg'))
    } catch (error) {
      console.error('Error loading config:', error)
      setStoreName('URBAN')
      setFaviconUrl('/favicon.svg')
    }
  }

  const handleSave = async () => {
    if (!storeName.trim()) {
      toast.error('El nombre de la tienda no puede estar vacío')
      return
    }

    setLoading(true)
    try {
      // Guardar en Supabase
      await Promise.all([
        fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clave: 'nombre_tienda', valor: storeName.trim() })
        }),
        faviconUrl.trim() && fetch('/api/config', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ clave: 'favicon_url', valor: faviconUrl.trim() })
        })
      ].filter(Boolean))

      // Actualizar el título de la página
      document.title = storeName.trim()
      
      // Actualizar el favicon si hay URL
      if (faviconUrl.trim()) {
        updateFavicon(faviconUrl.trim())
      }
      
      // Notificar a otros componentes
      window.dispatchEvent(new Event('config-updated'))
      
      toast.success('Configuración guardada')
      onSave(storeName.trim())
      onClose()
    } catch (error) {
      console.error('Error saving config:', error)
      toast.error('Error al guardar la configuración')
    } finally {
      setLoading(false)
    }
  }

  const updateFavicon = (url: string) => {
    const link = document.querySelector("link[rel*='icon']") as HTMLLinkElement || document.createElement('link')
    link.type = 'image/x-icon'
    link.rel = 'shortcut icon'
    link.href = url
    document.getElementsByTagName('head')[0].appendChild(link)
  }

  if (!mounted) return null

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content glass-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2 className="text-lg md:text-xl font-black uppercase tracking-[0.25em] italic text-white">Ajustes</h2>
          <button onClick={onClose} className="close-btn">
            ✕
          </button>
        </div>

        <div className="modal-body">
          <div className="setting-group">
            <label htmlFor="store-name" className="text-[10px] font-black uppercase tracking-widest text-white/70">Nombre de la tienda</label>
            <input
              type="text"
              id="store-name"
              value={storeName}
              onChange={(e) => setStoreName(e.target.value)}
              placeholder="Nombre"
              className="form-input"
            />
          </div>

          <div className="setting-group">
            <label htmlFor="favicon-url" className="text-[10px] font-black uppercase tracking-widest text-white/70">URL del favicon</label>
            <input
              type="text"
              id="favicon-url"
              value={faviconUrl}
              onChange={(e) => setFaviconUrl(e.target.value)}
              placeholder="https://..."
              className="form-input"
            />
            <small className="text-secondary text-sm mt-1 block">
              PNG o ICO recomendado
            </small>
          </div>

          <button 
            onClick={handleSave} 
            disabled={loading}
            className="btn-primary w-full mt-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Guardando...' : 'Guardar'}
          </button>
        </div>
      </div>
    </div>
  )
}
