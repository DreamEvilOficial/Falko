'use client'

import { Mail, Phone, MapPin, Instagram, Facebook, Twitter, ShieldCheck, CreditCard, Truck } from 'lucide-react'
import { useState, useEffect } from 'react'
import Link from 'next/link'
import Image from 'next/image'
import { sanitizeURL } from '@/lib/security'

export default function Footer() {
  const [mounted, setMounted] = useState(false)
  const [config, setConfig] = useState({
    nombre_tienda: 'URBAN',
    direccion: 'Mitre 692, Cañada de Gomez',
    telefono: '+54 9 3471598691',
    email: 'urbanindumentaria@hotmail.com',
    instagram: '@urban.cdg',
    logo_url: '/urban.png',
    brand_tagline: 'Streetwear sin filtro. Drops reales, fits pesados y calidad para bancarla en la calle. No rules, solo estilo.'
  })

  useEffect(() => {
    setMounted(true)
    const loadConfig = async () => {
      try {
        const res = await fetch('/api/config')
        const apiConfig = await res.json()
        const nextName = String(apiConfig.nombre_tienda || '').trim()
        const safeName = nextName && !/berta/i.test(nextName) ? nextName : undefined
        const nextLogo = String(apiConfig.logo_url || '').trim()
        const safeLogo = nextLogo && !/logaso/i.test(nextLogo) ? nextLogo : undefined
        setConfig(prev => ({
          ...prev,
          nombre_tienda: safeName || prev.nombre_tienda,
          direccion: apiConfig.direccion || prev.direccion,
          telefono: apiConfig.telefono || prev.telefono,
          email: apiConfig.email || prev.email,
          instagram: apiConfig.instagram || prev.instagram,
          logo_url: safeLogo || prev.logo_url,
          brand_tagline: String(apiConfig.brand_tagline || prev.brand_tagline)
        }))
      } catch (error) {}
    }
    loadConfig()
    window.addEventListener('config-updated', loadConfig)
    return () => window.removeEventListener('config-updated', loadConfig)
  }, [])

  if (!mounted) return null

  const instagramHref = sanitizeURL(`https://instagram.com/${config.instagram.replace('@', '')}`)

  return (
    <footer className="bg-black border-t border-[#333333] pt-20 pb-10 relative">
      <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#333333] to-transparent" />
      <div className="max-w-[1400px] mx-auto px-6 md:px-10">
        
        {/* Main Grid */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-16 md:gap-10 items-start mb-20">
          
          {/* Brand & Logo */}
          <div className="md:col-span-5 space-y-8">
            <Link href="/" className="inline-block group">
              <Image 
                src={config.logo_url} 
                alt={config.nombre_tienda} 
                width={0} 
                height={0} 
                sizes="100vw"
                style={{ width: 'auto', height: '80px' }}
                className="h-16 md:h-20 w-auto object-contain transition-transform duration-500 group-hover:scale-105" 
              />
            </Link>
            <p className="text-white/55 text-xs font-medium leading-relaxed max-w-sm uppercase tracking-widest italic">{config.brand_tagline}</p>
            
          </div>

          {/* Contact Links */}
          <div className="md:col-span-3 space-y-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Atención</h4>
            <ul className="space-y-4">
              <li>
                <a href="https://maps.app.goo.gl/hpJmoi8HfohiNk7N7" target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
                  <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-white/10 group-hover:bg-white/10 transition-colors"><MapPin className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" /></div>
                  <div>
                    <p className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-0.5 group-hover:text-white/70 transition-colors">Showroom</p>
                    <p className="text-[10px] font-bold text-white tracking-widest uppercase group-hover:text-accent transition-colors">{config.direccion}</p>
                  </div>
                </a>
              </li>
              {instagramHref && (
                <li>
                  <a href={instagramHref} target="_blank" rel="noopener noreferrer" className="group flex items-start gap-4">
                    <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-white/10"><Instagram className="w-3.5 h-3.5 text-gray-400 group-hover:text-white" /></div>
                    <div>
                      <p className="text-[9px] font-black uppercase text-white/50 tracking-widest mb-0.5">Instagram</p>
                      <p className="text-[10px] font-bold text-white tracking-widest uppercase">{config.instagram}</p>
                    </div>
                  </a>
                </li>
              )}
            </ul>
          </div>

          {/* Legal Links */}
          <div className="md:col-span-4 lg:pl-10 space-y-6">
            <h4 className="text-[10px] font-black text-white uppercase tracking-[0.4em] mb-8">Legales</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
               <ul className="space-y-3">
                 <li><Link href="/legales/terminos" className="text-[10px] font-black text-white/55 hover:text-white transition-colors uppercase tracking-widest">Términos & Condiciones</Link></li>
                 <li><Link href="/legales/privacidad" className="text-[10px] font-black text-white/55 hover:text-white transition-colors uppercase tracking-widest">Privacidad</Link></li>
                 <li><Link href="/legales/cambios" className="text-[10px] font-black text-white/55 hover:text-white transition-colors uppercase tracking-widest">Cambios & Devoluciones</Link></li>
               </ul>
               <ul className="space-y-3">
                 <li><Link href="/legales/defensa-consumidor" className="text-[10px] font-black text-white/55 hover:text-white transition-colors uppercase tracking-widest">Defensa al Consumidor</Link></li>
                 <li><Link href="/legales/arrepentimiento" className="text-[10px] font-black text-accent hover:text-ink transition-colors uppercase tracking-widest block py-2 border border-accent/25 rounded-xl px-4 text-center bg-white/[0.02] hover:bg-accent">Botón de Arrepentimiento</Link></li>
               </ul>
            </div>
          </div>
        </div>

        {/* Features Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 py-10 border-t border-white/[0.03]">
           <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <Truck className="w-6 h-6 mb-1 text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Envíos a todo el país</p>
           </div>
           <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <CreditCard className="w-6 h-6 mb-1 text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Cuotas sin Interés</p>
           </div>
           <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <ShieldCheck className="w-6 h-6 mb-1 text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Compra 100% segura</p>
           </div>
           <div className="flex flex-col items-center gap-2 opacity-60 hover:opacity-100 transition-opacity">
              <Instagram className="w-6 h-6 mb-1 text-white" />
              <p className="text-[8px] font-black uppercase tracking-[0.3em]">Comunidad Instagram</p>
           </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-10 pt-10 border-t border-white/[0.03] flex flex-col md:flex-row justify-between items-center gap-4 text-center">
          <p className="text-[9px] font-black text-white/55 uppercase tracking-widest">
            © {new Date().getFullYear()} {config.nombre_tienda}. Todos los derechos reservados.
          </p>
          <div className="flex items-center gap-6">
             <Image 
               src="https://static.wattpad.com/img/badges/v2/certified-fanatic.png" 
               width={100} 
               height={20} 
               className="h-4 w-auto grayscale opacity-40" 
               alt="" 
               unoptimized 
             />
             <p className="text-[8px] font-black text-white/40 uppercase tracking-wider">Desarrollado por Marcos Peiti</p>
          </div>
        </div>

      </div>
    </footer>
  )
}
