/** @type {import('next').NextConfig} */
const url = process.env.NEXT_PUBLIC_SUPABASE_URL
let supabaseHost = undefined
try {
  supabaseHost = url ? new URL(url).hostname : undefined
} catch {}

const nextConfig = {
  compress: true,
  poweredByHeader: false,
  reactStrictMode: true,
  images: {
    remotePatterns: [
      ...(supabaseHost ? [{
        protocol: 'https',
        hostname: supabaseHost,
        port: '',
        pathname: '/storage/v1/object/public/**',
      }] : []),
      {
        protocol: 'https',
        hostname: '**.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
      {
        protocol: 'https',
        hostname: 'media.discordapp.net',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'static.wattpad.com',
        port: '',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: '**.discordapp.net',
        port: '',
        pathname: '/**',
      }
    ],
    domains: supabaseHost ? [supabaseHost, 'media.discordapp.net', 'static.wattpad.com'] : ['bxrrldexzibiylgbheen.supabase.co', 'media.discordapp.net', 'static.wattpad.com'],
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=(), browsing-topics=()'
          }
        ]
      }
    ]
  },
  productionBrowserSourceMaps: false,
}

module.exports = nextConfig
