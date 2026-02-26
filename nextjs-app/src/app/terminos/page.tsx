import BackButton from '@/components/BackButton'

export default function TerminosPage() {
  return (
    <div className="min-h-screen text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <BackButton />
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-4">Legal / v1.0</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">Términos y Condiciones</h1>
        </header>
        
        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-10 space-y-6 text-white/70 text-sm leading-relaxed">
          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">1. Información General</h2>
            <p>
              Bienvenido a nuestra tienda online. Al acceder y realizar compras en nuestro sitio web, 
              aceptas los siguientes términos y condiciones. Te recomendamos leer detenidamente 
              este documento antes de realizar cualquier compra.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">2. Productos y Disponibilidad</h2>
            <p className="mb-2">
              Todos los productos mostrados en nuestro sitio están sujetos a disponibilidad. 
              Nos esforzamos por mantener actualizado el stock, sin embargo:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Las imágenes son ilustrativas y pueden variar ligeramente del producto real</li>
              <li>Los precios están expresados en pesos argentinos (ARS)</li>
              <li>Nos reservamos el derecho de modificar precios sin previo aviso</li>
              <li>La disponibilidad del producto se confirma al momento del pago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">3. Proceso de Compra</h2>
            <p className="mb-2">
              Para realizar una compra debes:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Seleccionar los productos deseados y agregarlos al carrito</li>
              <li>Completar el formulario con tus datos de contacto y envío</li>
              <li>Realizar el pago a través de MercadoPago (tarjetas, efectivo, transferencia)</li>
              <li>Recibirás una confirmación por email una vez procesado el pago</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">4. Métodos de Pago</h2>
            <p className="mb-2">
              Aceptamos los siguientes métodos de pago a través de MercadoPago:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Tarjetas de crédito y débito (Visa, Mastercard, American Express)</li>
              <li>Efectivo (Rapipago, Pago Fácil)</li>
              <li>Transferencia bancaria</li>
              <li>Dinero en cuenta de MercadoPago</li>
            </ul>
            <p className="mt-2">
              La compra se confirma una vez acreditado el pago en nuestra cuenta.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">5. Envíos</h2>
            <p className="mb-2">
              Realizamos envíos a todo el país:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Los tiempos de entrega son de 3 a 7 días hábiles según la zona</li>
              <li>El costo de envío se calcula según destino y peso</li>
              <li>Envíos gratis en compras superiores a $50,000</li>
              <li>Trabajamos con correos confiables (Correo Argentino, OCA, Andreani)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">6. Devoluciones y Cambios</h2>
            <p className="mb-2">
              Según la Ley de Defensa del Consumidor (Ley 24.240), tenés derecho a:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Arrepentimiento: 10 días corridos desde la recepción del producto</li>
              <li>El producto debe estar en perfectas condiciones, sin uso, con etiquetas</li>
              <li>Los gastos de devolución corren por cuenta del comprador</li>
              <li>Reintegro del dinero en 5-10 días hábiles</li>
              <li>Cambios por talle o color sin cargo adicional (una vez)</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">7. Garantía</h2>
            <p>
              Todos nuestros productos cuentan con garantía por defectos de fabricación. 
              En caso de recibir un producto defectuoso, contactanos dentro de las 48 horas 
              de recibido y te lo cambiaremos sin costo adicional.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">8. Responsabilidad</h2>
            <p>
              No nos hacemos responsables por:
            </p>
            <ul className="list-disc list-inside space-y-1 ml-4">
              <li>Demoras en la entrega por causas de fuerza mayor o del servicio de correo</li>
              <li>Errores en la dirección de envío proporcionada por el cliente</li>
              <li>Daños ocasionados por uso incorrecto del producto</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">9. Propiedad Intelectual</h2>
            <p>
              Todo el contenido de este sitio (imágenes, textos, logos, diseños) es propiedad 
              de nuestra marca y está protegido por las leyes de propiedad intelectual. 
              Queda prohibida su reproducción sin autorización expresa.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">10. Modificaciones</h2>
            <p>
              Nos reservamos el derecho de modificar estos términos y condiciones en cualquier momento. 
              Los cambios serán publicados en esta página y entrarán en vigencia inmediatamente.
            </p>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">11. Contacto</h2>
            <p className="mb-2">
              Para consultas sobre estos términos o cualquier aspecto de tu compra:
            </p>
            <ul className="list-none space-y-1">
              <li>📧 Email: contacto@tienda.com</li>
              <li>📱 WhatsApp: +54 9 11 XXXX-XXXX</li>
              <li>📷 Instagram: @tu_tienda</li>
            </ul>
          </section>

          <section>
            <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">12. Jurisdicción</h2>
            <p>
              Estos términos se rigen por las leyes de la República Argentina. 
              Cualquier controversia será sometida a los tribunales ordinarios de la Ciudad Autónoma de Buenos Aires.
            </p>
          </section>

          <div className="mt-8 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
            <p className="text-xs text-white/45 font-black uppercase tracking-widest">
              Última actualización: 3 de diciembre de 2025
            </p>
          </div>
        </div>

        <div className="mt-10 flex justify-center">
          <a
            href="/"
            className="inline-flex items-center justify-center bg-accent text-ink px-8 py-3 rounded-full hover:brightness-95 transition font-black text-[10px] uppercase tracking-[0.25em]"
          >
            Volver a la tienda
          </a>
        </div>
      </div>
    </div>
  )
}
