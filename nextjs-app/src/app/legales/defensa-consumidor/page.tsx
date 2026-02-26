'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function DefensaConsumidorPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Información al Usuario</h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter italic">Defensa al Consumidor</h2>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400 font-medium">
          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">1. Instituciones y Reclamos</h3>
            <p>
              En Urban Indumentaria trabajamos para brindarte la mejor atención. Sin embargo, si considerás que tus derechos como consumidor han sido vulnerados, tenés derecho a realizar un reclamo ante las autoridades correspondientes.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">2. Canales Oficiales</h3>
            <p>
              Para conocer tus derechos y realizar consultas o reclamos, podés comunicarte con:
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4">
              <a href="https://www.argentina.gob.ar/produccion/defensadelconsumidor" target="_blank" className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3 grayscale group-hover:grayscale-0 transition-all">Argentina.gob.ar</span>
                <p className="text-white font-bold text-lg mb-2 italic">Defensa del Consumidor</p>
                <p className="text-xs">Portal nacional para orientación y reclamos del consumidor.</p>
              </a>
              <a href="https://vuc.produccion.gob.ar/vuc/?continue" target="_blank" className="p-8 rounded-3xl bg-white/5 border border-white/5 hover:border-white/20 transition-all group">
                <span className="text-[10px] font-black uppercase tracking-widest text-gray-500 block mb-3 grayscale group-hover:grayscale-0 transition-all">Ventanilla Única</span>
                <p className="text-white font-bold text-lg mb-2 italic">Reclamos Consumo</p>
                <p className="text-xs">Sistema de Ingreso de Reclamos de Consumo de la Nación.</p>
              </a>
            </div>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">3. Direcciones de Interés</h3>
            <p>
              Dirección General de Defensa y Protección al Consumidor. Para consultas y/o reclamos ingrese aquí: 
              <a href="https://www.buenosaires.gob.ar/defensaconsumidor" target="_blank" className="text-white font-bold underline ml-1 hover:text-gray-300 transition-colors">buenosaires.gob.ar/defensaconsumidor</a>.
            </p>
          </section>

          <section className="space-y-4 pt-10 border-t border-white/5">
            <p className="text-[10px] font-black uppercase tracking-widest text-center text-gray-600">
              Urban Indumentaria — Compromiso con la honestidad y transparencia.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
