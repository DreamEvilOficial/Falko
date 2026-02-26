'use client'

import Link from 'next/link'
import { ArrowLeft } from 'lucide-react'
import { useEffect } from 'react'

export default function TerminosPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <header className="mb-10 border-b border-white/10 pb-8">
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Legal / v1.0</h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter italic">Términos y Condiciones</h2>
        </header>

        <div className="space-y-8 text-sm leading-relaxed text-gray-400 font-medium">
          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">1. Identidad y Alcance</h3>
            <p>
              El presente sitio web es propiedad de Urban Indumentaria. Al acceder y navegar en este sitio, el usuario acepta de manera íntegra y sin reservas los términos y condiciones aquí expuestos, los cuales se rigen por las leyes de la República Argentina (Ley 24.240 de Defensa del Consumidor y sus modificatorias).
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">2. Disponibilidad de Stock y Precios</h3>
            <p>
              Todos los productos exhibidos están sujetos a disponibilidad al momento de procesar la orden. En caso de quiebre de stock posterior a la compra, Urban Indumentaria se contactará con el cliente para ofrecer un cambio o proceder al reembolso total de la operación. Los precios están expresados en pesos argentinos e incluyen IVA.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">3. Derechos del Consumidor</h3>
            <p>
              En cumplimiento con la normativa vigente, el consumidor tiene derecho a revocar la aceptación de la compra dentro de los diez (10) días corridos computados a partir de la entrega del producto o de la celebración del contrato, lo último que ocurra, sin responsabilidad alguna (Art. 34 de la Ley 24.240).
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">4. Marcas y Propiedad Intelectual</h3>
            <p>
              Todo el material fotográfico, logotipos, textos y diseños exclusivos de Urban Indumentaria están protegidos por la Ley de Propiedad Intelectual N° 11.723. Queda terminantemente prohibida su reproducción o uso comercial sin autorización expresa de la firma.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">5. Jurisdicción</h3>
            <p>
              Para cualquier controversia derivada del uso de este sitio, las partes se someten a la jurisdicción de los Tribunales Ordinarios competentes según la normativa de consumo aplicable en la República Argentina.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
