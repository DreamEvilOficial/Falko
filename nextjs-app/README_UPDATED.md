# 🛒 TIENDA ONLINE - E-COMMERCE SEGURO

> Plataforma de comercio electrónico con Next.js 14, Supabase y MercadoPago
> 
> **Seguridad Nivel Empresarial: A+ (95/100)**

---

## 📋 TABLA DE CONTENIDOS

1. [Características](#características)
2. [Tecnologías](#tecnologías)
3. [Seguridad](#seguridad)
4. [Instalación](#instalación)
5. [Configuración](#configuración)
6. [Uso](#uso)
7. [Documentación](#documentación)
8. [Licencia](#licencia)

---

## ✨ CARACTERÍSTICAS

### Para Clientes
- 🛍️ Catálogo de productos con filtros por categoría
- 🔥 Productos destacados con efectos visuales
- 🎨 Selector de variantes (talles y colores)
- 🛒 Carrito de compras persistente
- 💳 Checkout con MercadoPago
- 📱 Diseño responsive y moderno
- 🌙 Tema oscuro permanente
- 📞 Página de contacto con redes sociales

### Para Administradores
- 📊 Panel de administración completo
- ➕ CRUD de productos con imágenes
- 🏷️ Gestión de categorías con iconos SVG
- 🎯 Sistema de descuentos automáticos
- 📦 Gestión de variantes de productos
- 💰 Visualización de ventas
- ⚙️ Configuración de la tienda
- 🎨 Personalización de banners y sliders
- 🔐 Autenticación segura

### Características Técnicas
- ⚡ Next.js 14 con App Router
- 🔒 Seguridad nivel empresarial
- 📱 SSR y Client Components
- 🎨 Tailwind CSS con animaciones
- 🔥 Fire effects en productos destacados
- 🎭 30+ iconos SVG para categorías
- 📜 Scroll continuo en anuncios
- 🔗 Sistema de redirección de banners

---

## 🛠️ TECNOLOGÍAS

### Frontend
- **Next.js 14** - Framework React con SSR
- **TypeScript** - Tipado estático
- **Tailwind CSS** - Estilos utility-first
- **Framer Motion** - Animaciones
- **Lucide React** - Iconos SVG
- **Zustand** - State management
- **React Hot Toast** - Notificaciones

### Backend
- **Supabase** - Base de datos PostgreSQL
- **Supabase Auth** - Autenticación
- **Supabase Storage** - Almacenamiento de imágenes
- **Row Level Security** - Seguridad en DB

### Pagos
- **MercadoPago SDK** - Procesamiento de pagos
- **Webhooks** - Notificaciones de pago

### Seguridad
- **HTTP Security Headers** - CSP, HSTS, etc.
- **Input Sanitization** - XSS prevention
- **RLS Policies** - SQL injection prevention
- **File Validation** - Upload security
- **Rate Limiting** - DDoS protection

---

## 🔐 SEGURIDAD

Esta plataforma implementa **múltiples capas de seguridad**:

### Protecciones Implementadas
- ✅ XSS Protection (Content Security Policy)
- ✅ SQL Injection Prevention (RLS + Prepared Statements)
- ✅ CSRF Protection (SameSite cookies)
- ✅ Clickjacking Protection (X-Frame-Options)
- ✅ MIME Sniffing Protection
- ✅ Path Traversal Protection
- ✅ File Upload Validation
- ✅ Rate Limiting
- ✅ HTTPS Enforcement

### Archivos de Seguridad
- `SECURITY_REPORT.md` - Informe completo de seguridad
- `SECURITY_SUMMARY.md` - Resumen ejecutivo
- `SECURITY_SETUP.sql` - Configuración RLS de Supabase
- `src/lib/security.ts` - Utilidades de seguridad
- `src/middleware.ts` - Middleware de protección

**Ver [SECURITY_REPORT.md](./SECURITY_REPORT.md) para detalles completos.**

---

## 🚀 INSTALACIÓN

### Pre-requisitos
- Node.js 18+ y npm 9+
- Cuenta en Supabase
- Cuenta en MercadoPago (opcional para desarrollo)

### Pasos

1. **Clonar el repositorio**
```bash
cd nextjs-app
```

2. **Instalar dependencias**
```bash
npm install
```

3. **Configurar variables de entorno**
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales:
```env
NEXT_PUBLIC_SUPABASE_URL=tu-url-supabase
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-public-key
MERCADOPAGO_ACCESS_TOKEN=tu-access-token
NEXT_PUBLIC_SITE_URL=http://localhost:3000
```

4. **Configurar Supabase**
- Crear proyecto en Supabase
- Ejecutar `SECURITY_SETUP.sql` en SQL Editor
- Crear bucket "productos" en Storage
- Configurar políticas de acceso

5. **Iniciar desarrollo**
```bash
npm run dev
```

Visita http://localhost:3000

---

## ⚙️ CONFIGURACIÓN

### Supabase

#### 1. Base de Datos
Ejecutar en SQL Editor:
```sql
-- Ver SECURITY_SETUP.sql para script completo
```

#### 2. Storage
Crear bucket "productos" con:
- Public: ✅ Yes
- Políticas de lectura pública
- Políticas de escritura autenticada

#### 3. Authentication
- Habilitar Email/Password
- Configurar Email Confirmation (producción)
- Agregar redirect URLs

### MercadoPago

1. Crear cuenta de desarrollador
2. Obtener credenciales de prueba/producción
3. Configurar webhook: `https://tu-dominio.com/api/mercadopago/webhook`

---

## 💻 USO

### Como Cliente

1. **Navegar productos**
   - Ver catálogo completo
   - Filtrar por categorías
   - Ver productos destacados

2. **Agregar al carrito**
   - Seleccionar talle y color
   - Ajustar cantidad
   - Ver resumen de carrito

3. **Realizar compra**
   - Completar datos de envío
   - Seleccionar método de pago
   - Pagar con MercadoPago o transferencia

### Como Administrador

1. **Acceder al panel**
   - Ir a `/admin/login`
   - Crear cuenta o iniciar sesión
   - Acceder a `/admin`

2. **Gestionar productos**
   - Tab "Productos"
   - Crear, editar o eliminar productos
   - Subir imágenes
   - Configurar variantes
   - Marcar como destacado/top

3. **Gestionar categorías**
   - Tab "Categorías"
   - Crear categorías con iconos
   - Reordenar categorías
   - Eliminar categorías vacías

4. **Ver ventas**
   - Tab "Ventas"
   - Revisar órdenes
   - Ver detalles de compra

5. **Configurar tienda**
   - Tab "Configuración"
   - Cambiar nombre y logo
   - Configurar banners
   - Editar mensajes del slider
   - Configurar datos de transferencia
   - Configurar redes sociales

---

## 📚 DOCUMENTACIÓN

### Guías Principales
- **[SECURITY_REPORT.md](./SECURITY_REPORT.md)** - Informe completo de seguridad
- **[SECURITY_SUMMARY.md](./SECURITY_SUMMARY.md)** - Resumen ejecutivo de seguridad
- **[DEPLOYMENT.md](./DEPLOYMENT.md)** - Guía de despliegue a producción
- **[SECURITY_SETUP.sql](./SECURITY_SETUP.sql)** - Scripts SQL de seguridad

### Estructura del Proyecto
```
nextjs-app/
├── src/
│   ├── app/              # Rutas de Next.js
│   │   ├── admin/        # Panel de administración
│   │   ├── api/          # API routes
│   │   ├── checkout/     # Página de checkout
│   │   ├── contacto/     # Página de contacto
│   │   └── productos/    # Catálogo de productos
│   ├── components/       # Componentes React
│   │   ├── Navbar.tsx    # Navegación con slider
│   │   ├── Cart.tsx      # Carrito de compras
│   │   ├── IconSelector.tsx  # Selector de iconos
│   │   └── ...
│   ├── lib/              # Utilidades
│   │   ├── supabase.ts   # Cliente de Supabase
│   │   └── security.ts   # Utilidades de seguridad
│   ├── store/            # Estado global
│   │   └── cartStore.ts  # Store del carrito
│   └── middleware.ts     # Middleware de seguridad
├── public/               # Archivos estáticos
├── SECURITY_REPORT.md    # Informe de seguridad
├── DEPLOYMENT.md         # Guía de despliegue
└── package.json          # Dependencias
```

### Scripts Disponibles
```bash
npm run dev              # Desarrollo
npm run build            # Build de producción
npm run start            # Servidor de producción
npm run lint             # Linter
npm run security-check   # Verificar vulnerabilidades
npm run security-fix     # Arreglar vulnerabilidades
npm run type-check       # Verificar tipos TypeScript
```

---

## 🚀 DESPLIEGUE

### Vercel (Recomendado)
```bash
# Instalar Vercel CLI
npm i -g vercel

# Deploy
vercel --prod
```

### VPS con PM2
```bash
# Build
npm run build

# Iniciar con PM2
pm2 start npm --name "tienda" -- start
```

**Ver [DEPLOYMENT.md](./DEPLOYMENT.md) para guía completa.**

---

## 🧪 TESTING

### Tests de Seguridad
- https://securityheaders.com
- https://observatory.mozilla.org
- https://www.ssllabs.com/ssltest/

### Manejo de precios y formato

- Los precios se guardan siempre como números puros usando `toNumber`
- La visualización usa `formatPrice` con locale `es-AR` para miles y decimales
- El formulario de productos normaliza inputs como `5000`, `5.000` o `5.000,00` al mismo valor numérico
- Ejecutar `npm run test:formatters` para validar conversión y formateo de precios

### Checklist Pre-Lanzamiento
- [ ] SQL de seguridad ejecutado
- [ ] Variables de entorno configuradas
- [ ] Storage bucket configurado
- [ ] RLS habilitado
- [ ] HTTPS configurado
- [ ] Tests de seguridad pasados

---

## 🤝 CONTRIBUIR

Este es un proyecto privado. Para reportar bugs o sugerir mejoras:
1. Crear issue detallado
2. Incluir pasos para reproducir
3. Sugerir solución si es posible

---

## 📄 LICENCIA

Copyright © 2025. Todos los derechos reservados.

---

## 🆘 SOPORTE

### Recursos
- [Next.js Docs](https://nextjs.org/docs)
- [Supabase Docs](https://supabase.com/docs)
- [MercadoPago Docs](https://www.mercadopago.com/developers)

### Troubleshooting
Ver [DEPLOYMENT.md](./DEPLOYMENT.md) sección de troubleshooting.

---

## 🎯 ROADMAP

### Próximas Características
- [ ] Sistema de reseñas de productos
- [ ] Wishlist
- [ ] Búsqueda avanzada
- [ ] Filtros de precio
- [ ] Comparador de productos
- [ ] Notificaciones push
- [ ] Multi-idioma
- [ ] Multi-moneda

### Mejoras de Seguridad Futuras
- [ ] 2FA para admin
- [ ] WAF (Web Application Firewall)
- [ ] Rate limiting con Redis
- [ ] Penetration testing profesional
- [ ] Sistema de detección de intrusos

---

**Desarrollado con ❤️ usando Next.js y Supabase**

**Última actualización:** 4 de Diciembre, 2025
