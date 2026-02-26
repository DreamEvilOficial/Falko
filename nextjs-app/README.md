# 🛍️ Berta Moda - Aplicación Next.js

Esta es la aplicación principal de la tienda online Berta Moda, construida con Next.js 14, TypeScript y Supabase.

## 🚀 Inicio Rápido

```bash
# Instalar dependencias
npm install

# Configurar variables de entorno
cp .env.example .env.local
# Edita .env.local con tus credenciales de Supabase

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 📦 Scripts Disponibles

```bash
npm run dev          # Servidor de desarrollo
npm run build        # Build de producción
npm start            # Servidor de producción
npm run lint         # Linting con ESLint
npm run type-check   # Verificación de tipos TypeScript
```

## 🏗️ Estructura del Proyecto

```
src/
├── app/                      # App Router de Next.js
│   ├── admin/               # Panel de administración
│   │   ├── components/      # Componentes del admin
│   │   ├── login/          # Login del admin
│   │   └── page.tsx        # Página principal del admin
│   ├── api/                # API Routes
│   │   ├── config/         # Configuración de la tienda
│   │   ├── mercadopago/    # Integración MercadoPago
│   │   └── upload-image/   # Upload de imágenes
│   ├── checkout/           # Proceso de compra
│   ├── contacto/           # Página de contacto
│   ├── productos/          # Catálogo de productos
│   ├── globals.css         # Estilos globales
│   ├── layout.tsx          # Layout principal
│   └── page.tsx            # Página de inicio
├── components/             # Componentes reutilizables
│   ├── Navbar.tsx         # Barra de navegación
│   ├── Footer.tsx         # Pie de página
│   ├── ProductCard.tsx    # Tarjeta de producto
│   ├── Cart.tsx           # Carrito de compras
│   └── ...
├── lib/                   # Utilidades y configuración
│   ├── supabase.ts       # Cliente de Supabase + tipos
│   └── security.ts       # Funciones de seguridad
└── store/                # Estado global (Zustand)
    └── cartStore.ts      # Store del carrito
```

## 🔧 Configuración

### Variables de Entorno Requeridas

Crea un archivo `.env.local` con:

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key

# Sitio
NEXT_PUBLIC_SITE_URL=http://localhost:3000
NEXT_PUBLIC_SITE_NAME=Urban Indumentaria

# MercadoPago (Opcional)
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=TEST-xxx
MERCADOPAGO_ACCESS_TOKEN=TEST-xxx

# Admin
NEXT_PUBLIC_ADMIN_EMAIL=admin@bertamoda.com
```

### Configuración de Supabase

1. Crea un proyecto en [Supabase](https://supabase.com)
2. Ejecuta el script `../SETUP-DATABASE.sql` en el SQL Editor
3. Crea un bucket público llamado `productos` en Storage
4. Copia tus credenciales a `.env.local`

Ver guía completa en: `../CONFIGURACION-SUPABASE.md`

## 🎨 Tecnologías Utilizadas

- **Framework**: Next.js 14 (App Router)
- **Lenguaje**: TypeScript 5.3
- **Estilos**: Tailwind CSS 3.4
- **Base de Datos**: Supabase (PostgreSQL)
- **Estado**: Zustand 4.4
- **Animaciones**: Framer Motion 10.16
- **Iconos**: Lucide React
- **Notificaciones**: React Hot Toast
- **Pagos**: MercadoPago (opcional)

## 📱 Características

### Frontend Público

- ✅ Catálogo de productos con filtros
- ✅ Sistema de variantes (talle/color)
- ✅ Carrito de compras persistente
- ✅ Checkout con validaciones
- ✅ Diseño responsive
- ✅ Animaciones fluidas
- ✅ SEO optimizado

### Panel de Administración

- ✅ Gestión completa de productos (CRUD)
- ✅ Upload de múltiples imágenes
- ✅ Gestión de variantes
- ✅ Asignación de etiquetas
- ✅ Cálculo automático de descuentos
- ✅ Búsqueda y filtros
- ✅ Interfaz moderna

## 🔒 Seguridad

- ✅ Row Level Security (RLS) en Supabase
- ✅ Validación de inputs
- ✅ Sanitización de datos
- ✅ HTTPS en producción
- ✅ Variables de entorno protegidas
- ✅ Autenticación con Supabase Auth

## 🚀 Despliegue

### Vercel (Recomendado)

1. Sube el código a GitHub
2. Importa el repositorio en Vercel
3. Configura:
   - **Root Directory**: `nextjs-app`
   - **Framework Preset**: Next.js
   - **Build Command**: `npm run build`
   - **Output Directory**: `.next`
4. Agrega las variables de entorno
5. Deploy

Ver guía completa en: `../GUIA-DESPLIEGUE.md`

### Otras Plataformas

El proyecto también puede desplegarse en:

- Netlify
- Railway
- Render
- AWS Amplify

## 📊 Performance

- **Lighthouse Score**: 90+
- **First Contentful Paint**: < 1.5s
- **Time to Interactive**: < 3s
- **Bundle Size**: ~200KB (gzipped)

## 🧪 Testing

```bash
# Type checking
npm run type-check

# Linting
npm run lint

# Build test
npm run build
```

## 🐛 Solución de Problemas

### Error: "Module not found"

```bash
rm -rf node_modules package-lock.json
npm install
```

### Error: "Invalid API key"

Verifica que `.env.local` tenga las credenciales correctas de Supabase

### Error de build

```bash
npm run type-check  # Ver errores de TypeScript
npm run lint        # Ver errores de linting
```

## 📝 Convenciones de Código

- **Componentes**: PascalCase (`ProductCard.tsx`)
- **Funciones**: camelCase (`cargarProductos`)
- **Constantes**: UPPER_SNAKE_CASE (`API_URL`)
- **Archivos**: kebab-case para utilidades
- **Commits**: Conventional Commits

## 🤝 Contribuciones

1. Fork el proyecto
2. Crea una rama (`git checkout -b feature/nueva-caracteristica`)
3. Commit tus cambios (`git commit -m 'feat: agregar nueva característica'`)
4. Push a la rama (`git push origin feature/nueva-caracteristica`)
5. Abre un Pull Request

## 📄 Licencia

MIT License - Ver archivo `LICENSE` para más detalles

## 📞 Soporte

- 📖 Documentación: `../README.md`
- 🚀 Guía de inicio: `../INICIO-RAPIDO.md`
- 🔧 Configuración: `../CONFIGURACION-SUPABASE.md`
- 🌐 Despliegue: `../GUIA-DESPLIEGUE.md`

---

**Versión**: 2.0.0  
**Última actualización**: 2025-12-05  
**Desarrollado con** ❤️ **para Urban Indumentaria**
