/** @type {import('next').NextConfig} */
const JavaScriptObfuscator = require("webpack-obfuscator");

const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "**.supabase.co",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "m.media-amazon.com",
      },
    ],
    formats: ["image/avif", "image/webp"],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60,
  },

  reactStrictMode: true,
  poweredByHeader: false,
  compress: true,
  productionBrowserSourceMaps: false, // Deshabilitar source maps en producción

  // Optimización de compilación
  compiler: {
    removeConsole:
      process.env.NODE_ENV === "production"
        ? {
            exclude: ["error", "warn"],
          }
        : false,
  },

  // Configuración de Webpack con ofuscación
  webpack: (config, { isServer, dev }) => {
    if (!isServer && !dev) {
      // Ofuscación de código JavaScript en producción
      config.plugins.push(
        new JavaScriptObfuscator(
          {
            rotateStringArray: true,
            stringArray: true,
            stringArrayThreshold: 0.75,
            stringArrayEncoding: ["base64"],
            splitStrings: true,
            splitStringsChunkLength: 10,

            // Ofuscación de nombres
            identifierNamesGenerator: "hexadecimal",
            renameGlobals: false,

            // Control de flujo
            controlFlowFlattening: true,
            controlFlowFlatteningThreshold: 0.75,
            deadCodeInjection: true,
            deadCodeInjectionThreshold: 0.4,

            // Transformaciones
            transformObjectKeys: true,
            unicodeEscapeSequence: false,

            // Debug protection
            debugProtection: true,
            debugProtectionInterval: 2000,
            disableConsoleOutput: true,

            // Protección contra formateo
            selfDefending: true,

            // Configuración de rendimiento
            compact: true,
            simplify: true,

            // Dominios permitidos (opcional)
            domainLock: process.env.NEXT_PUBLIC_DOMAIN_LOCK
              ? process.env.NEXT_PUBLIC_DOMAIN_LOCK.split(",")
              : [],
          },
          ["**/node_modules/**"]
        )
      );
    }

    // Optimizaciones adicionales
    config.optimization = {
      ...config.optimization,
      minimize: true,
      usedExports: true,
      sideEffects: true,
      concatenateModules: true,
      splitChunks: {
        chunks: "all",
        cacheGroups: {
          default: false,
          vendors: false,
          // Vendor chunk
          vendor: {
            name: "vendor",
            chunks: "all",
            test: /node_modules/,
            priority: 20,
          },
          // Common chunk
          common: {
            name: "common",
            minChunks: 2,
            chunks: "all",
            priority: 10,
            reuseExistingChunk: true,
            enforce: true,
          },
        },
      },
    };

    return config;
  },

  // Headers de seguridad avanzados
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          // Prevenir que se abra en iframes (clickjacking)
          {
            key: "X-Frame-Options",
            value: "SAMEORIGIN",
          },
          // Prevenir MIME type sniffing
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          // XSS Protection
          {
            key: "X-XSS-Protection",
            value: "1; mode=block",
          },
          // Referrer Policy
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          // Permissions Policy
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          // DNS Prefetch Control
          {
            key: "X-DNS-Prefetch-Control",
            value: "on",
          },
          // Strict Transport Security (HSTS)
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains",
          },
          // Content Security Policy (CSP)
          {
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-eval' 'unsafe-inline' https://vercel.live https://va.vercel-scripts.com",
              "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
              "img-src 'self' data: blob: https://*.supabase.co https://images.unsplash.com https://m.media-amazon.com https://media.discordapp.net https://*.discordapp.net https://cdn.discordapp.com",
              "font-src 'self' data: https://fonts.gstatic.com",
              "connect-src 'self' https://*.supabase.co https://vercel.live wss://*.supabase.co",
              "frame-src 'self'",
              "object-src 'none'",
              "base-uri 'self'",
              "form-action 'self'",
              "frame-ancestors 'self'",
              "upgrade-insecure-requests",
            ].join("; "),
          },
        ],
      },
      // Headers específicos para archivos estáticos
      {
        source: "/api/:path*",
        headers: [
          {
            key: "Cache-Control",
            value: "no-store, max-age=0",
          },
        ],
      },
    ];
  },

  // Revalidación y caché optimizado
  experimental: {
    optimizeCss: true,
    optimizePackageImports: ["lucide-react", "framer-motion"],
  },

  // Configuración de TypeScript y ESLint
  typescript: {
    ignoreBuildErrors: false, // Activar en producción
  },

  eslint: {
    ignoreDuringBuilds: false, // Activar en producción
  },
};

module.exports = nextConfig;
