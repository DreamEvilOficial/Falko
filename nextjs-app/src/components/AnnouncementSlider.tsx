'use client'

import { useEffect, useState } from 'react'

export default function AnnouncementSlider() {
  const [mensajes, setMensajes] = useState<string[]>([])
  const [velocidad, setVelocidad] = useState(30)
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true)
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const config = await res.json()
        
        // Cargar velocidad
        if (config.slider_marquesina_velocidad) {
          setVelocidad(Number(config.slider_marquesina_velocidad))
        } else {
          setVelocidad(30) // Fallback Faster
        }

        // Cargar mensajes (unificar anuncio_1, 2, 3 o slider_mensajes)
        let msgs: string[] = []
        if (config.anuncio_1) msgs.push(config.anuncio_1)
        if (config.anuncio_2) msgs.push(config.anuncio_2)
        if (config.anuncio_3) msgs.push(config.anuncio_3)

        if (msgs.length === 0 && config.slider_mensajes) {
          try {
            msgs = JSON.parse(config.slider_mensajes)
          } catch {
            msgs = []
          }
        }
        
        setMensajes(msgs)
      } catch (error) {
        setMensajes([])
      }
    }
    loadConfig()
    window.addEventListener('config-updated', loadConfig)
    return () => window.removeEventListener('config-updated', loadConfig)
  }, [])

  if (!mounted || mensajes.length === 0) return null

  // Creamos una tira de mensajes muy larga para cubrir cualquier ancho de pantalla
  const giantStrip = [...mensajes, ...mensajes, ...mensajes, ...mensajes]

  return (
    <div className="bg-[#05060a]/90 backdrop-blur-xl border-b border-white/10 text-white h-[68px] flex items-center overflow-hidden relative z-[99999]">
      <div 
        className="flex animate-marquee-horizontal whitespace-nowrap"
        style={{ 
          '--speed': `${velocidad}s`,
          '--speed-mobile': `${velocidad / 2}s` 
        } as React.CSSProperties}
      >
        {giantStrip.map((msg, i) => (
          <span 
            key={i} 
            className="flex-shrink-0 px-10 md:px-28 text-[12px] font-black uppercase tracking-[0.5em] text-white/60"
          >
            {msg}
          </span>
        ))}
        {/* Duplicamos exactamente la misma tira para el loop infinito */}
        {giantStrip.map((msg, i) => (
          <span 
            key={`dup-${i}`} 
            className="flex-shrink-0 px-10 md:px-28 text-[12px] font-black uppercase tracking-[0.5em] text-white/60"
          >
            {msg}
          </span>
        ))}
      </div>

      <style jsx global>{`
        @keyframes marquee-horizontal {
          0% { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        .animate-marquee-horizontal {
          animation: marquee-horizontal var(--speed) linear infinite;
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          width: fit-content !important;
        }
        @media (max-width: 768px) {
          .animate-marquee-horizontal {
             animation-duration: var(--speed-mobile);
          }
        }
        .animate-marquee-horizontal:hover {
          animation-play-state: paused;
        }
      `}</style>
    </div>
  )
}
