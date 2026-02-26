import { getSections, getProducts, getAllProducts, getConfig } from '@/lib/data'
import Image from 'next/image'
import { type Producto } from '@/lib/supabase'
import ProductCard from '@/components/ProductCard'
import TopProducts from '@/components/TopProducts'
import Reviews from '@/components/Reviews'
import BannerSlider from '@/components/BannerSlider'

import ProductCarousel from '@/components/ProductCarousel'

// Revalidar cada 60 segundos
export const revalidate = 60

export default async function Home() {
  // Carga paralela de datos iniciales
  const [sectionsData, topProducts, config] = await Promise.all([
    getSections(),
    getProducts({ top: true, limit: 6 }),
    getConfig()
  ])
  
  const showTopPicks = typeof config.show_top_picks !== 'undefined' ? config.show_top_picks : true

  let sections = []

  if (!sectionsData || sectionsData.length === 0) {
    // Fallback si no hay secciones
    const allProds = await getProducts({ limit: 12 })
    if (allProds.length > 0) {
      sections = [{
        id: 'fallback-all',
        titulo: 'COLECCIÓN',
        subtitulo: 'Explora todos nuestros productos',
        tipo: 'manual',
        productos: allProds
      }]
    }
  } else {
    // Procesar secciones
    const needsAllProducts = sectionsData.some((s: any) =>
      s?.tipo === 'filtro' && ['nuevos', 'descuentos', 'proximamente'].includes(String(s?.referencia_id || ''))
    )
    const allProducts = needsAllProducts ? await getAllProducts() : []

    // Cargar productos de cada sección en paralelo
    sections = await Promise.all(
        sectionsData.map(async (section: any) => {
          let productos: Producto[] = []
          if (section.tipo === 'filtro') {
            if (section.referencia_id === 'destacados') {
                productos = await getProducts({ destacado: true, limit: 8 })
            } else if (section.referencia_id === 'nuevos') {
                productos = allProducts
                  .slice()
                  .sort((a, b) => new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime())
                  .slice(0, 4)
            } else if (section.referencia_id === 'descuentos') {
                productos = allProducts
                  .filter((p) => (p.descuento_porcentaje || 0) > 0 || ((p.precio_original || 0) > p.precio))
                  .slice(0, 8)
            } else if (section.referencia_id === 'proximamente') {
                productos = allProducts
                  .filter((p) => (p as any).proximo_lanzamiento === true)
                  .slice(0, 4)
            }
          } else if (section.tipo === 'categoria') {
            productos = await getProducts({ category_slug: section.referencia_id })
          }
          return { ...section, productos: productos.slice(0, 8) }
        })
    )
  }

  return (
    <div className="min-h-screen bg-transparent relative z-10 selection:bg-white/20 selection:text-white">
      <BannerSlider initialConfig={config} />

      <div className="relative z-20 -mt-10 md:-mt-16">
        {/* Transición Suave entre Banner y Contenido */}
        <div className="pointer-events-none absolute inset-x-0 -top-32 h-32 bg-gradient-to-b from-transparent to-[#020202]" />
        
        {/* Contenedor Principal con Glassmorphism Avanzado */}
        <div className="bg-[#050505]/80 backdrop-blur-[40px] border-t border-white/5 rounded-t-[42px] md:rounded-t-[64px] shadow-[0_-20px_80px_-30px_rgba(0,0,0,0.8)] relative overflow-hidden">
          
          {/* Efectos de Iluminación Interna */}
          <div className="pointer-events-none absolute top-0 left-1/2 -translate-x-1/2 w-full h-[1px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />
          <div className="pointer-events-none absolute top-0 left-0 w-full h-[500px] bg-gradient-to-b from-white/[0.01] to-transparent" />
          
          {/* Orbes de Luz Decorativos en el Contenedor */}
          <div className="pointer-events-none absolute top-20 left-0 w-64 h-64 bg-blue-500/5 rounded-full blur-[80px]" />
          <div className="pointer-events-none absolute top-40 right-0 w-64 h-64 bg-purple-500/5 rounded-full blur-[80px]" />

          {showTopPicks && <TopProducts products={topProducts} />}

          {sections.map((section: any) => (
              <section key={section.id} className="reveal max-w-7xl mx-auto px-2 md:px-4 py-8 md:py-16 relative">
                {/* Separador Sutil entre Secciones */}
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/2 h-px bg-gradient-to-r from-transparent via-white/5 to-transparent" />
                
                <div className="text-center mb-8 md:mb-12 relative z-10">
                  <h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-white mb-4 tracking-tight flex items-center justify-center gap-1 md:gap-3 px-2 uppercase drop-shadow-lg">
                    {section.gif_url && (
                      <img src={section.gif_url} alt="" width={64} height={64} className="w-8 h-8 md:w-16 md:h-16 flex-shrink-0 object-contain" />
                    )}
                    <span className="text-center bg-clip-text text-transparent bg-gradient-to-b from-white to-white/70">{section.titulo}</span>
                    {section.gif_url && (
                      <img src={section.gif_url} alt="" width={64} height={64} className="w-8 h-8 md:w-16 md:h-16 flex-shrink-0 object-contain" />
                    )}
                  </h2>
                  <div className="w-24 h-1 bg-gradient-to-r from-transparent via-white/20 to-transparent mx-auto"></div>
                  {section.subtitulo && <p className="text-gray-400 mt-4 font-medium tracking-wide">{section.subtitulo}</p>}
                </div>
                
                {section.productos.length > 0 ? (
                  <ProductCarousel products={section.productos} />
                ) : (
                  <p className="text-center text-gray-400">Próximamente más ingresos en esta sección.</p>
                )}
              </section>
            ))}

          <Reviews />
          
          {/* Footer Blur Overlay para suavizar el final */}
          <div className="absolute bottom-0 left-0 w-full h-32 bg-gradient-to-t from-black to-transparent pointer-events-none" />
        </div>
      </div>
    </div>
  )
}
