import type { Metadata, Viewport } from 'next'
import { Urbanist, Bebas_Neue } from 'next/font/google'
import './globals.css'
import { Toaster } from 'react-hot-toast'
import ClientLayout from '@/components/ClientLayout'
import DevToolsProtection from '@/components/DevToolsProtection'

import { supabase, supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

const urbanist = Urbanist({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
})

const bebasNeue = Bebas_Neue({
  subsets: ['latin'],
  weight: ['400'],
  variable: '--font-display',
})

export async function generateMetadata(): Promise<Metadata> {
  let title = 'URBAN'
  let description = 'Redefiniendo el Streetwear. Tu estilo, sin límites.'
  let shareDescription = 'Redefiniendo el Streetwear. Tu estilo, sin límites. Descubrí los últimos drops y armá tu fit.'
  let logoUrl = '/urban.png'
  let shareImagePath = '/publicsite.png'

  try {
    const client = supabaseAdmin || supabase

    const { data } = await client
      .from('configuracion')
      .select('clave, valor')
      .in('clave', ['nombre_tienda', 'lema_tienda', 'share_description', 'logo_url', 'share_image_url'])
    
    if (data) {
      const config = data.reduce((acc: any, item: any) => {
        let value: any = item.valor
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch {}
        }
        acc[item.clave] = value
        return acc
      }, {})

      if (typeof config.nombre_tienda === 'string' && config.nombre_tienda) title = config.nombre_tienda
      if (typeof config.lema_tienda === 'string' && config.lema_tienda) description = config.lema_tienda
      if (typeof config.share_description === 'string' && config.share_description) shareDescription = config.share_description
      if (typeof config.logo_url === 'string' && config.logo_url) logoUrl = config.logo_url
      if (typeof config.share_image_url === 'string' && config.share_image_url) shareImagePath = config.share_image_url
    }
  } catch (e) {
    console.error('Error fetching metadata:', e)
  }

  const rawSiteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.SITE_URL || 'https://urbancdg.vercel.app'
  const siteUrl = rawSiteUrl.endsWith('/') ? rawSiteUrl.slice(0, -1) : rawSiteUrl

  const normalizedSharePath = shareImagePath || '/publicsite.png'
  const isSvgShare = normalizedSharePath.toLowerCase().endsWith('.svg')
  const ogBasePath = isSvgShare ? '/publicsite.png' : normalizedSharePath

  const ogImageUrl = ogBasePath.startsWith('http')
    ? ogBasePath
    : `${siteUrl}${ogBasePath.startsWith('/') ? '' : '/'}${ogBasePath}`

  return {
    title,
    description,
    metadataBase: new URL(siteUrl),
    openGraph: {
      title: `${title} | Streetwear & Drops`,
      description: shareDescription,
      type: 'website',
      locale: 'es_AR',
      siteName: title,
      images: [
        {
          url: ogImageUrl,
          width: 800,
          height: 600,
          type: 'image/png',
          alt: title,
        },
      ],
    },
    icons: {
      icon: '/favicon.svg',
    },
  }
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
}

import BackgroundEffect from '@/components/BackgroundEffect'

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="es" suppressHydrationWarning className="h-full">
      <body className={`${urbanist.variable} ${bebasNeue.variable} h-full font-sans antialiased bg-[#020202]`}>
        <BackgroundEffect />
        <ClientLayout>
          {children}
        </ClientLayout>
        <DevToolsProtection />
        <Toaster 
          position="bottom-right"
          containerStyle={{
            bottom: 80,
            right: 20,
            zIndex: 9999999,
          }}
          toastOptions={{
            style: {
              background: '#06070c',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px',
              padding: '12px 16px',
              zIndex: 999999,
            },
            success: {
              iconTheme: {
                primary: '#B7FF2A',
                secondary: '#000',
              },
            },
          }}
        />
        {/* Protección de DevTools (sin bloquear selección de texto) */}
        {process.env.NODE_ENV === 'production' && <DevToolsProtection />}
      </body>
    </html>
  )
}
