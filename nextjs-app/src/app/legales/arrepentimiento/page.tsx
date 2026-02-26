'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'

export default function ArrepentimientoPage() {
  const [enviado, setEnviado] = useState(false)
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Aquí se conectaría con una API de backend o envío de email
    setEnviado(true)
  }

  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-pink-500 mb-4">Derecho a la Revocación</h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter italic">Botón de Arrepentimiento</h2>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400 font-medium">
          <section className="space-y-4">
            <p>
              Cumpliendo con la Resolución 424/2020 de la Secretaría de Comercio Interior, en Urban Indumentaria facilitamos el proceso de revocación de compra.
            </p>
            <p className="border-l-2 border-pink-500 pl-6 py-2 bg-white/5 italic">
              &ldquo;El consumidor tiene derecho a revocar la aceptación de la compra dentro de los diez (10) días corridos computados a partir de la entrega del producto o de la celebración del contrato, lo último que ocurra, sin responsabilidad alguna.&rdquo; 
              <span className="block mt-2 font-bold text-white">— Art. 34 del Código Civil y Comercial de la Nación.</span>
            </p>
          </section>

          {!enviado ? (
            <div className="bg-[#0a0a0a] border border-white/5 p-8 rounded-3xl space-y-8">
              <h3 className="text-white font-black uppercase tracking-widest text-[11px] text-center">Formulario de Solicitud</h3>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest pl-2">Número de Pedido</label>
                    <input required type="text" placeholder="#00123" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-500 transition-colors uppercase tracking-widest font-bold placeholder:text-gray-700" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest pl-2">Email de Compra</label>
                    <input required type="email" placeholder="email@ejemplo.com" className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-500 transition-colors uppercase tracking-widest font-bold placeholder:text-gray-700" />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest pl-2">Mensaje Adicional (Opcional)</label>
                  <textarea rows={4} placeholder="Contanos brevemente el motivo..." className="w-full bg-white/5 border border-white/10 rounded-2xl px-5 py-4 focus:outline-none focus:border-pink-500 transition-colors uppercase tracking-widest font-bold placeholder:text-gray-700"></textarea>
                </div>
                <button type="submit" className="w-full bg-white text-black font-black uppercase tracking-[0.4em] py-5 rounded-2xl hover:bg-gray-200 transition-colors shadow-2xl shadow-white/5">
                  Confirmar Arrepentimiento
                </button>
              </form>
            </div>
          ) : (
            <div className="bg-[#0a0a0a] border border-pink-500/20 p-12 rounded-3xl text-center space-y-4">
              <div className="w-16 h-16 bg-pink-500/10 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-8 h-8 text-pink-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path>
                </svg>
              </div>
              <h3 className="text-xl font-bold italic text-white">Solicitud Recibida</h3>
              <p className="max-w-md mx-auto">
                Hemos registrado tu solicitud. Nos pondremos en contacto vía email dentro de las próximas 24hs hábiles para coordinar la devolución y el reembolso.
              </p>
            </div>
          )}

          <section className="space-y-4 pt-10 border-t border-white/5">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">Consideraciones Importantes</h3>
            <ul className="list-disc pl-5 space-y-2">
              <li>El producto debe ser devuelto en las mismas condiciones en que fue recibido.</li>
              <li>Una vez recibida la solicitud, Urban Indumentaria te enviará el código de rastreo para el envío postal gratuito de devolución.</li>
              <li>El reintegro del dinero se realizará por el mismo medio que utilizaste para abonar.</li>
            </ul>
          </section>
        </div>
      </div>
    </div>
  )
}
