 'use client'
 import Link from 'next/link'
 import { ArrowLeft } from 'lucide-react'
 import { useEffect } from 'react'

export default function CambiosPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <header className="mb-16 border-b border-white/10 pb-10">
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Legal / v1.0</h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter italic">Cambios y Devoluciones</h2>
        </header>

        <div className="space-y-12 text-sm leading-relaxed text-gray-400 font-medium">
          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">1. Plazos para Cambios</h3>
            <p>
              En Urban Indumentaria, los cambios pueden realizarse dentro de los 30 días corridos posteriores a la recepción del pedido. Las prendas deben estar en las mismas condiciones en que fueron entregadas: con su etiqueta original, sin señales de uso, perfume o lavado.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">2. Procedimiento de Cambio</h3>
            <p>
              El cliente puede realizar el cambio de forma presencial en nuestro Showroom o mediante envío por correo. En caso de envíos, los costos logísticos derivados del cambio (retorno y nuevo envío) corren por cuenta del cliente, salvo que el cambio se deba a una falla de fabricación o error en el pedido.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">3. Devoluciones</h3>
            <p>
              Según la Ley de Defensa del Consumidor, para compras online el cliente tiene 10 días desde la entrega para arrepentirse de la compra. En este caso, el reembolso se efectuará por el mismo medio de pago utilizado, una vez que la prenda llegue a nuestro depósito y se verifique su estado óptimo.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">4. Prendas sin Cambio</h3>
            <p>
              Por razones de higiene, las prendas de ropa interior (bikinis, conjuntos de lencería, etc.) y accesorios no tienen cambio, excepto en casos constatados de fallas de fábrica.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
