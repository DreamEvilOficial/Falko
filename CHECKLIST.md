# ☑️ Checklist de Configuración - Berta Moda

Sigue esta lista paso a paso para tener tu tienda funcionando.

---

## 📋 FASE 1: Preparación (5 minutos)

### Cuentas Necesarias

- [ ] Cuenta en [Supabase](https://supabase.com) creada
- [ ] Cuenta en [GitHub](https://github.com) creada
- [ ] Cuenta en [Vercel](https://vercel.com) creada (opcional, para producción)

### Software Instalado

- [ ] Node.js 18+ instalado

  ```bash
  node --version  # Debe mostrar v18.x.x o superior
  ```

- [ ] npm 9+ instalado

  ```bash
  npm --version   # Debe mostrar 9.x.x o superior
  ```

- [ ] Git instalado
  ```bash
  git --version   # Debe mostrar git version 2.x.x
  ```

---

## 📋 FASE 2: Configuración de Supabase (10 minutos)

### Crear Proyecto

- [ ] Ir a [supabase.com](https://supabase.com)
- [ ] Click en "New Project"
- [ ] Nombre del proyecto: `berta-moda`
- [ ] Contraseña de BD: ******\_****** (guárdala)
- [ ] Región: South America - São Paulo
- [ ] Click en "Create new project"
- [ ] Esperar 1-2 minutos

### Ejecutar Schema de Base de Datos

- [ ] Ir a **SQL Editor** en el menú lateral
- [ ] Click en "New query"
- [ ] Abrir el archivo `SETUP-DATABASE.sql`
- [ ] Copiar TODO el contenido
- [ ] Pegar en el editor de Supabase
- [ ] Click en "Run" (o Ctrl+Enter)
- [ ] Verificar mensaje: "Success. No rows returned"

### Verificar Tablas Creadas

- [ ] Ir a **Table Editor**
- [ ] Verificar que existan estas tablas:
  - [ ] `productos` (con 3 productos de ejemplo)
  - [ ] `categorias` (con 5 categorías)
  - [ ] `subcategorias`
  - [ ] `etiquetas`
  - [ ] `productos_etiquetas`
  - [ ] `ordenes`
  - [ ] `resenas`
  - [ ] `configuracion`
  - [ ] `banners`

### Configurar Storage

- [ ] Ir a **Storage** en el menú lateral
- [ ] Click en "Create a new bucket"
- [ ] Nombre: `productos` (exactamente así)
- [ ] Marcar "Public bucket": ✅
- [ ] Click en "Create bucket"

### Configurar Políticas de Storage

- [ ] Seleccionar bucket `productos`
- [ ] Ir a pestaña "Policies"
- [ ] Click en "New Policy"
- [ ] Seleccionar "For full customization"
- [ ] Policy name: `Public Access`
- [ ] Allowed operation: `SELECT`
- [ ] Policy definition: `bucket_id = 'productos'`
- [ ] Click en "Review" → "Save policy"

### Obtener Credenciales

- [ ] Ir a **Settings** → **API**
- [ ] Copiar **Project URL**: ************\_************
- [ ] Copiar **anon public key**: ************\_************

---

## 📋 FASE 3: Configuración Local (5 minutos)

### Crear Archivo .env

- [ ] Abrir el proyecto en tu editor de código
- [ ] Copiar `.env.example` a `.env`
  ```bash
  cp .env.example .env
  ```

### Configurar Variables de Entorno

- [ ] Abrir el archivo `.env`
- [ ] Pegar tu Project URL en `NEXT_PUBLIC_SUPABASE_URL`
- [ ] Pegar tu anon key en `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- [ ] Verificar que `NEXT_PUBLIC_SITE_URL=http://localhost:3000`
- [ ] Guardar el archivo

### Instalar Dependencias

- [ ] Abrir terminal en la carpeta del proyecto
- [ ] Ejecutar:
  ```bash
  cd nextjs-app
  npm install
  ```
- [ ] Esperar a que termine (1-2 minutos)

---

## 📋 FASE 4: Crear Usuario Admin (2 minutos)

### En Supabase

- [ ] Ir a **Authentication** en Supabase
- [ ] Click en "Add user" → "Create new user"
- [ ] Email: ************\_************ (ej: admin@bertamoda.com)
- [ ] Password: ************\_************ (guárdala)
- [ ] Marcar "Auto Confirm User": ✅
- [ ] Click en "Create user"

---

## 📋 FASE 5: Verificación Local (5 minutos)

### Iniciar Servidor de Desarrollo

- [ ] En la terminal, ejecutar:
  ```bash
  npm run dev
  ```
- [ ] Esperar mensaje: "Ready in X ms"
- [ ] Abrir navegador en: http://localhost:3000

### Verificar Frontend

- [ ] La página principal carga sin errores
- [ ] Se muestran 3 productos de ejemplo
- [ ] Las categorías aparecen en el menú "Productos"
- [ ] Puedes hacer click en un producto
- [ ] Puedes agregar un producto al carrito
- [ ] El carrito muestra el producto agregado

### Verificar Panel Admin

- [ ] Ir a: http://localhost:3000/admin/login
- [ ] Ingresar con el email y password del usuario admin
- [ ] El panel de administración carga correctamente
- [ ] Se muestran los 3 productos en la lista
- [ ] Puedes buscar productos
- [ ] Puedes filtrar por categoría

### Crear Producto de Prueba

- [ ] Click en "Nuevo Producto"
- [ ] Completar el formulario:
  - [ ] Nombre: "Producto de Prueba"
  - [ ] Precio: 10000
  - [ ] Categoría: Seleccionar una
  - [ ] Agregar al menos una variante (talle, color, stock)
- [ ] Click en "Crear Producto"
- [ ] Verificar que aparece en la lista
- [ ] Ir al frontend y verificar que se muestra

### Probar Upload de Imágenes

- [ ] Editar el producto de prueba
- [ ] Click en "Subir imagen"
- [ ] Seleccionar una imagen de tu computadora
- [ ] Esperar a que se suba
- [ ] Verificar que la imagen aparece en la galería
- [ ] Guardar cambios
- [ ] Verificar que la imagen se muestra en el frontend

---

## 📋 FASE 6: Preparar para Producción (Opcional)

### Verificar Build

- [ ] En la terminal, ejecutar:
  ```bash
  npm run build
  ```
- [ ] Esperar a que termine (1-2 minutos)
- [ ] Verificar que no hay errores
- [ ] Ver mensaje: "Compiled successfully"

### Subir a GitHub

- [ ] Crear repositorio en GitHub
- [ ] Nombre: `BertaModaOficial`
- [ ] Visibilidad: Public o Private
- [ ] NO marcar "Initialize with README"
- [ ] Click en "Create repository"

- [ ] En la terminal, ejecutar:
  ```bash
  cd ..  # Volver a la raíz del proyecto
  git init
  git add .
  git commit -m "Berta Moda v2.0 - Plataforma completa"
  git branch -M main
  git remote add origin https://github.com/TU-USUARIO/BertaModaOficial.git
  git push -u origin main
  ```

### Desplegar en Vercel

- [ ] Ir a [vercel.com](https://vercel.com)
- [ ] Click en "Add New..." → "Project"
- [ ] Importar repositorio `BertaModaOficial`
- [ ] Configurar:
  - [ ] Root Directory: `nextjs-app`
  - [ ] Framework Preset: Next.js
  - [ ] Build Command: `npm run build`
  - [ ] Output Directory: `.next`

### Configurar Variables de Entorno en Vercel

- [ ] En la sección "Environment Variables":

  - [ ] `NEXT_PUBLIC_SUPABASE_URL` = (tu URL de Supabase)
  - [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` = (tu anon key)
  - [ ] `NEXT_PUBLIC_SITE_URL` = (dejar vacío por ahora)
  - [ ] `NEXT_PUBLIC_SITE_NAME` = `Berta Moda`

- [ ] Marcar las 3 opciones para cada variable:
  - [ ] Production
  - [ ] Preview
  - [ ] Development

### Desplegar

- [ ] Click en "Deploy"
- [ ] Esperar 2-3 minutos
- [ ] Verificar mensaje: "Deployment Ready"
- [ ] Click en "Visit" para ver tu sitio en producción

### Actualizar URL del Sitio

- [ ] Copiar la URL de producción (ej: `https://berta-moda.vercel.app`)
- [ ] En Vercel, ir a Settings → Environment Variables
- [ ] Editar `NEXT_PUBLIC_SITE_URL`
- [ ] Pegar la URL de producción
- [ ] Guardar
- [ ] Ir a Deployments
- [ ] Click en "Redeploy" en el último deployment

---

## 📋 FASE 7: Personalización (Opcional)

### Configurar Información de la Tienda

- [ ] En Supabase, ir a **SQL Editor**
- [ ] Ejecutar queries para actualizar configuración:

```sql
-- Actualizar nombre de la tienda
UPDATE configuracion SET valor = '"Tu Nombre de Tienda"' WHERE clave = 'tienda_nombre';

-- Actualizar email
UPDATE configuracion SET valor = '"tu-email@ejemplo.com"' WHERE clave = 'tienda_email';

-- Actualizar teléfono
UPDATE configuracion SET valor = '"+54 9 11 XXXX-XXXX"' WHERE clave = 'tienda_telefono';

-- Actualizar WhatsApp
UPDATE configuracion SET valor = '"+549XXXXXXXXXX"' WHERE clave = 'tienda_whatsapp';

-- Actualizar Instagram
UPDATE configuracion SET valor = '"@tu_instagram"' WHERE clave = 'tienda_instagram';
```

### Agregar Productos Reales

- [ ] Ir al panel admin
- [ ] Eliminar los productos de ejemplo
- [ ] Crear tus productos reales con:
  - [ ] Nombre descriptivo
  - [ ] Precio correcto
  - [ ] Imágenes de calidad
  - [ ] Variantes (talles/colores)
  - [ ] Stock real
  - [ ] Categoría apropiada

### Personalizar Diseño (Opcional)

- [ ] Editar `nextjs-app/src/app/globals.css`
- [ ] Cambiar colores principales
- [ ] Ajustar tipografía
- [ ] Commit y push los cambios

---

## ✅ Verificación Final

### Checklist de Funcionalidad

- [ ] ✅ Página principal carga en local
- [ ] ✅ Productos se muestran correctamente
- [ ] ✅ Carrito funciona
- [ ] ✅ Panel admin accesible
- [ ] ✅ Puedes crear productos
- [ ] ✅ Upload de imágenes funciona
- [ ] ✅ Build de producción exitoso
- [ ] ✅ Código en GitHub
- [ ] ✅ Desplegado en Vercel (opcional)
- [ ] ✅ Sitio en producción funcionando (opcional)

---

## 🎉 ¡Completado!

Si todos los checks están marcados, ¡tu tienda está lista!

### Próximos pasos:

1. **Agregar más productos**
2. **Personalizar el diseño**
3. **Configurar métodos de pago**
4. **Promocionar tu tienda**

---

## 📞 ¿Necesitas ayuda?

Si algún paso no funciona:

1. Revisa `INICIO-RAPIDO.md` para guía rápida
2. Consulta `CONFIGURACION-SUPABASE.md` para problemas de BD
3. Lee `GUIA-DESPLIEGUE.md` para problemas de despliegue
4. Verifica `README.md` para documentación completa

---

**Última actualización**: 2025-12-05  
**Versión**: 2.0.0
