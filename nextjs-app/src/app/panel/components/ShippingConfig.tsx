'use client'

import { useState, useEffect } from 'react'
import { Save, Lock, Eye, EyeOff, Server, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'

export default function ShippingConfig() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showSecret, setShowSecret] = useState(false)
  const [config, setConfig] = useState({
    paqar_api_key: '',
    paqar_secret: ''
  })

  useEffect(() => {
    fetch('/api/shipping/config')
      .then(res => res.json())
      .then(data => {
        // Remove unwanted fields if any
        const { paqar_mode, ...rest } = data
        setConfig(prev => ({
          ...prev,
          ...rest
        }))
        setLoading(false)
      })
      .catch(() => {
        toast.error('Error cargando configuración')
        setLoading(false)
      })
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/shipping/config', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(config)
      })
      
      if (!res.ok) throw new Error('Error guardando')
      toast.success('Configuración guardada')
    } catch (error) {
      toast.error('Error al guardar')
    } finally {
      setSaving(false)
    }
  }

  if (loading) return <div className="p-4 text-white/50">Cargando configuración...</div>

  return (
    <div className="bg-[#06070c]/70 border border-white/10 p-6 rounded-[28px] space-y-6">
      <div className="flex items-start gap-4">
        <div className="w-12 h-12 rounded-2xl bg-blue-500/10 flex items-center justify-center text-blue-400 flex-shrink-0">
          <Server className="w-6 h-6" />
        </div>
        <div>
          <h3 className="text-lg font-black text-white uppercase tracking-tight">Credenciales API</h3>
          <p className="text-white/40 text-xs mt-1">
            Configura las llaves de acceso de Correo Argentino (Paq.ar). 
            <br />
            <a href="https://www.correoargentino.com.ar/MiCorreo/public/primeros-pasos" target="_blank" className="text-blue-400 hover:underline">
              Solicitar credenciales aquí
            </a>
          </p>
        </div>
      </div>

      <div className="space-y-4">
        
        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">API Key</label>
          <input 
            type="text" 
            value={config.paqar_api_key}
            onChange={e => setConfig({...config, paqar_api_key: e.target.value})}
            placeholder="Ej: abc12345-6789..."
            className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/50 transition-colors"
          />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black text-white/30 uppercase tracking-[0.2em]">API Secret</label>
          <div className="relative">
            <input 
              type={showSecret ? "text" : "password"} 
              value={config.paqar_secret}
              onChange={e => setConfig({...config, paqar_secret: e.target.value})}
              placeholder="••••••••"
              className="w-full bg-black/20 border border-white/10 p-3 rounded-xl text-xs font-mono text-white outline-none focus:border-blue-500/50 transition-colors pr-10"
            />
            <button 
              onClick={() => setShowSecret(!showSecret)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white transition"
            >
              {showSecret ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <div className="pt-4 border-t border-white/5">
          <button 
            onClick={handleSave}
            disabled={saving}
            className="w-full py-3 bg-white/[0.05] hover:bg-white/[0.1] text-white rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
          >
            {saving ? <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" /> : <Save className="w-4 h-4" />}
            Guardar Configuración
          </button>
        </div>
      </div>
    </div>
  )
}
