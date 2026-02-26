import BackButton from '@/components/BackButton'

export default function PrivacidadPage() {
  return (
    <div className="min-h-screen text-white pt-24 pb-20">
      <div className="w-full max-w-[1400px] mx-auto px-4 md:px-8">
        <BackButton />
        <header className="mb-10 border-b border-white/10 pb-8">
          <p className="text-[10px] font-black uppercase tracking-[0.5em] text-white/40 mb-4">Legal / v1.0</p>
          <h1 className="text-4xl md:text-5xl font-black tracking-tighter italic">Política de Privacidad</h1>
        </header>
        
        <div className="bg-white/[0.02] border border-white/5 rounded-[40px] p-8 md:p-10 space-y-6 text-white/70 text-sm leading-relaxed">
        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">1. Introducción</h2>
          <p>
            En nuestra tienda respetamos tu privacidad y nos comprometemos a proteger tus datos personales. 
            Esta política explica cómo recopilamos, usamos y protegemos tu información de acuerdo con 
            la Ley 25.326 de Protección de Datos Personales de Argentina.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">2. Información que Recopilamos</h2>
          <p className="mb-2">
            Cuando realizás una compra o te registrás en nuestro sitio, recopilamos:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Datos personales:</strong> Nombre completo, email, teléfono</li>
            <li><strong>Datos de envío:</strong> Dirección, ciudad, código postal</li>
            <li><strong>Datos de navegación:</strong> Dirección IP, tipo de navegador, páginas visitadas</li>
            <li><strong>Datos de compra:</strong> Productos adquiridos, monto de la transacción</li>
            <li><strong>Cookies:</strong> Para mejorar tu experiencia de navegación</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">3. Cómo Usamos tu Información</h2>
          <p className="mb-2">
            Utilizamos tus datos personales para:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Procesar y gestionar tus pedidos</li>
            <li>Enviar confirmaciones de compra y actualizaciones de envío</li>
            <li>Comunicarnos contigo sobre tu cuenta o consultas</li>
            <li>Mejorar nuestros productos y servicios</li>
            <li>Enviarte ofertas y novedades (solo si aceptaste recibirlas)</li>
            <li>Cumplir con obligaciones legales y fiscales</li>
            <li>Prevenir fraudes y garantizar la seguridad del sitio</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">4. Compartir tu Información</h2>
          <p className="mb-2">
            No vendemos ni alquilamos tus datos personales a terceros. 
            Solo compartimos información con:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Procesadores de pago:</strong> MercadoPago para procesar transacciones</li>
            <li><strong>Empresas de envío:</strong> Para la entrega de tus pedidos</li>
            <li><strong>Proveedores de servicios:</strong> Que nos ayudan a operar el sitio (hosting, email)</li>
            <li><strong>Autoridades legales:</strong> Cuando sea requerido por ley</li>
          </ul>
          <p className="mt-2">
            Todos nuestros proveedores están obligados contractualmente a proteger tu información.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">5. Cookies y Tecnologías Similares</h2>
          <p className="mb-2">
            Utilizamos cookies para:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Recordar tu carrito de compras</li>
            <li>Mantener tu sesión iniciada</li>
            <li>Analizar el tráfico del sitio (Google Analytics)</li>
            <li>Personalizar tu experiencia</li>
          </ul>
          <p className="mt-2">
            Podés configurar tu navegador para rechazar cookies, aunque esto puede afectar 
            algunas funcionalidades del sitio.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">6. Seguridad de los Datos</h2>
          <p className="mb-2">
            Implementamos medidas de seguridad para proteger tu información:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Conexión segura HTTPS con certificado SSL</li>
            <li>Encriptación de datos sensibles</li>
            <li>Acceso restringido a la información personal</li>
            <li>Respaldos regulares de la base de datos</li>
            <li>Monitoreo de actividad sospechosa</li>
          </ul>
          <p className="mt-2">
            Sin embargo, ningún método de transmisión por internet es 100% seguro. 
            Hacemos nuestro mejor esfuerzo para proteger tus datos, pero no podemos 
            garantizar seguridad absoluta.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">7. Tus Derechos</h2>
          <p className="mb-2">
            De acuerdo con la legislación argentina, tenés derecho a:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li><strong>Acceso:</strong> Solicitar una copia de tus datos personales</li>
            <li><strong>Rectificación:</strong> Corregir información incorrecta o desactualizada</li>
            <li><strong>Supresión:</strong> Solicitar la eliminación de tus datos</li>
            <li><strong>Oposición:</strong> Negarte al procesamiento de tus datos para marketing</li>
            <li><strong>Portabilidad:</strong> Recibir tus datos en formato estructurado</li>
          </ul>
          <p className="mt-2">
            Para ejercer estos derechos, contactanos a: contacto@tienda.com
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">8. Retención de Datos</h2>
          <p>
            Conservamos tu información personal durante el tiempo necesario para:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Cumplir con los fines para los que fue recopilada</li>
            <li>Satisfacer requerimientos legales, contables y fiscales (mínimo 5 años)</li>
            <li>Resolver disputas y hacer cumplir nuestros acuerdos</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">9. Marketing por Email</h2>
          <p>
            Si aceptaste recibir comunicaciones promocionales:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Te enviaremos ofertas, descuentos y novedades</li>
            <li>Podés darte de baja en cualquier momento</li>
            <li>Cada email incluye un link de &quot;Cancelar suscripción&quot;</li>
            <li>No compartimos tu email con otras empresas</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">10. Menores de Edad</h2>
          <p>
            Nuestros servicios no están dirigidos a menores de 18 años. 
            No recopilamos intencionalmente información de menores. 
            Si descubrimos que hemos recopilado datos de un menor, 
            los eliminaremos inmediatamente.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">11. Enlaces a Sitios Externos</h2>
          <p>
            Nuestro sitio puede contener enlaces a sitios web de terceros 
            (redes sociales, plataformas de pago). No somos responsables 
            de las prácticas de privacidad de estos sitios. Te recomendamos 
            leer sus políticas de privacidad.
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">12. Cambios en esta Política</h2>
          <p>
            Podemos actualizar esta política de privacidad periódicamente. 
            Te notificaremos de cambios significativos mediante:
          </p>
          <ul className="list-disc list-inside space-y-1 ml-4">
            <li>Publicación de la nueva política en esta página</li>
            <li>Actualización de la fecha de &quot;Última modificación&quot;</li>
            <li>Email a los usuarios registrados (cambios importantes)</li>
          </ul>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">13. Datos de Supabase</h2>
          <p>
            Utilizamos Supabase como plataforma de almacenamiento de datos. 
            Supabase cumple con estándares internacionales de seguridad y privacidad, 
            incluyendo encriptación en reposo y en tránsito. Para más información: 
            <a href="https://supabase.com/privacy" target="_blank" rel="noopener noreferrer" className="text-accent2 hover:underline ml-1">
              Política de Privacidad de Supabase
            </a>
          </p>
        </section>

        <section>
          <h2 className="text-white font-black uppercase tracking-widest text-[11px] mb-3">14. Contacto</h2>
          <p className="mb-2">
            Para consultas sobre esta política o ejercer tus derechos:
          </p>
          <ul className="list-none space-y-2">
            <li><strong>Email:</strong> contacto@tienda.com</li>
            <li><strong>WhatsApp:</strong> +54 9 11 XXXX-XXXX</li>
            <li><strong>Dirección:</strong> [Tu dirección comercial]</li>
          </ul>
          <p className="mt-3">
            También podés presentar una queja ante la Agencia de Acceso a la Información Pública (AAIP), 
            autoridad de control en materia de protección de datos personales en Argentina.
          </p>
        </section>

        <div className="mt-8 p-4 bg-white/[0.03] border border-white/5 rounded-2xl">
          <p className="text-xs text-white/45 font-black uppercase tracking-widest">
            Última actualización: 3 de diciembre de 2025
          </p>
          <p className="text-xs text-white/45 mt-1">
            Esta política es efectiva desde la fecha de publicación y se aplica a todos 
            los usuarios del sitio.
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
