 'use client'
 import Link from 'next/link'
 import { ArrowLeft } from 'lucide-react'
 import { useEffect } from 'react'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen bg-black text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <Link href="/" className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/50 hover:text-white mb-8 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Volver
        </Link>
        <header className="mb-16 border-b border-white/10 pb-10">
          <h1 className="text-[10px] font-black uppercase tracking-[0.5em] text-gray-500 mb-4">Legal / v1.0</h1>
          <h2 className="text-4xl md:text-5xl font-bold tracking-tighter italic">Privacidad</h2>
        </header>

        <div className="space-y-12 text-sm leading-relaxed text-gray-400 font-medium">
          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">1. Protección de Datos Personales</h3>
            <p>
              Urban Indumentaria cumple estrictamente con la Ley N° 25.326 de Protección de Datos Personales. La información recolectada (nombre, dirección, teléfono) tiene como única finalidad la correcta gestión de los pedidos y la mejora de la experiencia de compra.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">2. Confidencialidad</h3>
            <p>
              Garantizamos que los datos proporcionados por nuestros clientes no serán compartidos, vendidos ni cedidos a terceros con fines comerciales ajenos a la operación de logística necesaria para la entrega del producto.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">3. Derechos de Acceso y Rectificación</h3>
            <p>
              El titular de los datos personales tiene la facultad de ejercer el derecho de acceso a los mismos en forma gratuita a intervalos no inferiores a seis meses. Asimismo, podrá solicitar en cualquier momento la rectificación, actualización o supresión de sus datos de nuestra base de datos enviando un mensaje a nuestros canales oficiales.
            </p>
          </section>

          <section className="space-y-4">
            <h3 className="text-white font-black uppercase tracking-widest text-[11px]">4. Seguridad en Pagos</h3>
            <p>
              No almacenamos información sobre tarjetas de crédito o débito. Todas las transacciones se realizan a través de procesadores de pago certificados que garantizan el cifrado y la seguridad de la información financiera del usuario.
            </p>
          </section>
        </div>
      </div>
    </div>
  )
}
