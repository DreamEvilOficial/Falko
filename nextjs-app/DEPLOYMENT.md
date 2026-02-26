# 🚀 GUÍA DE DESPLIEGUE A PRODUCCIÓN

## 📋 Pre-requisitos

- Node.js 18+ instalado
- Cuenta de Supabase configurada
- Cuenta de MercadoPago con credenciales de producción
- Dominio configurado con certificado SSL

---

## 1️⃣ CONFIGURACIÓN INICIAL

### Clonar el repositorio (si aplica)
```bash
git clone [tu-repositorio]
cd TiendaDeRopa/nextjs-app
```

### Instalar dependencias
```bash
npm install
```

### Configurar variables de entorno
```bash
cp .env.example .env.local
```

Editar `.env.local` con tus credenciales de producción:
```env
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=tu-anon-key-aqui
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY=tu-public-key-produccion
MERCADOPAGO_ACCESS_TOKEN=tu-access-token-produccion
NEXT_PUBLIC_SITE_URL=https://tu-dominio.com
```

---

## 2️⃣ CONFIGURAR SUPABASE

### Crear proyecto en Supabase
1. Ve a https://supabase.com
2. Crea un nuevo proyecto
3. Espera a que se inicialice (2-3 minutos)

### Ejecutar SQL de seguridad
1. Abre SQL Editor en Supabase Dashboard
2. Ejecuta el contenido de `SECURITY_SETUP.sql`
3. Verifica que todas las políticas se crearon correctamente

### Configurar Storage
1. Ve a Storage → Create bucket
2. Nombre: `productos`
3. Public: ✅ Yes
4. Configurar políticas (ver SECURITY_SETUP.sql)

### Configurar Authentication
1. Ve a Authentication → Settings
2. Enable Email confirmation
3. Configurar SMTP (opcional pero recomendado)
4. Agregar tu dominio a Redirect URLs

---

## 3️⃣ CONFIGURAR MERCADOPAGO

### Obtener credenciales de producción
1. Ve a https://www.mercadopago.com/developers
2. Cambia a modo producción
3. Copia Public Key y Access Token
4. Actualiza `.env.local`

### Configurar Webhook
```bash
URL: https://tu-dominio.com/api/mercadopago/webhook
Eventos: payment
```

---

## 4️⃣ BUILD Y TESTING LOCAL

### Verificar seguridad
```bash
npm run security-check
npm run type-check
```

### Build de producción
```bash
npm run build
```

### Probar localmente
```bash
npm run start
```

Visita http://localhost:3000 y verifica:
- ✅ Productos se cargan correctamente
- ✅ Carrito funciona
- ✅ Login admin funciona
- ✅ Upload de imágenes funciona
- ✅ Checkout funciona

---

## 5️⃣ DESPLIEGUE EN VERCEL (RECOMENDADO)

### Opción A: Despliegue con CLI
```bash
# Instalar Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

### Opción B: Despliegue con GitHub
1. Sube tu código a GitHub
2. Ve a https://vercel.com/new
3. Importa tu repositorio
4. Configura variables de entorno
5. Deploy

### Configurar variables en Vercel
En Vercel Dashboard → Settings → Environment Variables:
```
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_ANON_KEY
NEXT_PUBLIC_MERCADOPAGO_PUBLIC_KEY
MERCADOPAGO_ACCESS_TOKEN
NEXT_PUBLIC_SITE_URL
```

---

## 6️⃣ DESPLIEGUE EN VPS (ALTERNATIVA)

### Usando PM2 y Nginx

#### Instalar dependencias en el servidor
```bash
# Node.js
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt-get install -y nodejs

# PM2
sudo npm install -g pm2

# Nginx
sudo apt-get install nginx
```

#### Subir archivos
```bash
# Desde tu máquina local
scp -r . usuario@tu-servidor:/var/www/tienda
```

#### Configurar en el servidor
```bash
cd /var/www/tienda
npm install
npm run build

# Iniciar con PM2
pm2 start npm --name "tienda" -- start
pm2 save
pm2 startup
```

#### Configurar Nginx
```nginx
server {
    listen 80;
    server_name tu-dominio.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }
}
```

#### Configurar SSL con Let's Encrypt
```bash
sudo apt-get install certbot python3-certbot-nginx
sudo certbot --nginx -d tu-dominio.com
```

---

## 7️⃣ POST-DEPLOYMENT

### Verificar seguridad
Visita estas herramientas y verifica tu sitio:
- https://securityheaders.com
- https://observatory.mozilla.org
- https://www.ssllabs.com/ssltest/

### Configurar monitoreo
```bash
# Sentry (errores)
npm install @sentry/nextjs
```

### Configurar Analytics
```bash
# Google Analytics
npm install @next/third-parties
```

### Backups automáticos
En Supabase Dashboard → Settings → Backups:
- Habilitar daily backups
- Configurar retention (7-30 días)

---

## 8️⃣ TESTING EN PRODUCCIÓN

### Checklist de pruebas
- [ ] Sitio carga sin errores
- [ ] HTTPS funcionando correctamente
- [ ] Headers de seguridad presentes
- [ ] Productos se muestran correctamente
- [ ] Imágenes se cargan
- [ ] Carrito funciona
- [ ] Checkout funciona
- [ ] Pago con MercadoPago funciona
- [ ] Admin login funciona
- [ ] CRUD de productos funciona
- [ ] Upload de imágenes funciona
- [ ] Responsive design funciona
- [ ] Performance acceptable (>80 en Lighthouse)

### Realizar compra de prueba
1. Agregar productos al carrito
2. Proceder al checkout
3. Completar datos de cliente
4. Realizar pago de prueba con MercadoPago
5. Verificar que la orden se registra

---

## 9️⃣ MANTENIMIENTO

### Actualizar dependencias
```bash
# Verificar actualizaciones
npm outdated

# Actualizar (con cuidado)
npm update

# Verificar seguridad
npm audit
npm audit fix
```

### Monitorear logs
```bash
# Vercel
vercel logs

# PM2
pm2 logs tienda
```

### Backups manuales
```bash
# Desde Supabase Dashboard
# Settings → Database → Download backup
```

---

## 🆘 TROUBLESHOOTING

### Error: "Failed to fetch"
- Verificar CORS en Supabase
- Verificar variables de entorno
- Verificar URL de Supabase

### Error: "Unauthorized"
- Verificar RLS policies en Supabase
- Verificar autenticación
- Verificar token de sesión

### Error: "Payment failed"
- Verificar credenciales de MercadoPago
- Verificar webhook configurado
- Revisar logs de MercadoPago

### Imágenes no cargan
- Verificar Storage bucket configurado
- Verificar políticas de acceso
- Verificar CORS

---

## 📞 SOPORTE

### Recursos
- Documentación Next.js: https://nextjs.org/docs
- Documentación Supabase: https://supabase.com/docs
- Documentación MercadoPago: https://www.mercadopago.com/developers

### Logs importantes
```bash
# Vercel logs
vercel logs --follow

# Browser console
F12 → Console

# Supabase logs
Dashboard → Logs → API
```

---

## ✅ CHECKLIST FINAL

- [ ] SSL/HTTPS configurado
- [ ] Variables de entorno configuradas
- [ ] Base de datos migrada
- [ ] RLS habilitado
- [ ] Storage configurado
- [ ] MercadoPago en producción
- [ ] Webhook configurado
- [ ] DNS configurado
- [ ] Email confirmación habilitado
- [ ] Backups automáticos
- [ ] Monitoreo configurado
- [ ] Tests pasados
- [ ] Performance optimizado
- [ ] SEO básico configurado
- [ ] Analytics configurado

**¡Tu tienda está lista para recibir clientes!** 🎉
