# 🛠️ Instrucciones de Reparación

He detectado dos problemas principales y he generado las soluciones.

## 1. Problema: Error al Cargar Productos
**Causa:** La función de carga de productos no estaba utilizando correctamente los permisos de administrador en Vercel.
**Solución:** He actualizado el código (`api/products/route.ts`) para usar directamente el "Cliente Admin" de Supabase, lo que garantiza que pueda leer los productos independientemente de las restricciones de seguridad (RLS).
**Acción:** Este cambio se aplicará automáticamente cuando suba los cambios a GitHub en el siguiente paso.

## 2. Problema: Error "cliente_apellido column not found" en Deudas
**Causa:** La tabla `deudas` en tu base de datos de Supabase está incompleta (le faltan columnas como apellido, dni, celular).
**Solución:** Debes ejecutar un script SQL para actualizar la tabla.

### ⚠️ PASO OBLIGATORIO:
1. Ve a tu panel de **Supabase** -> **SQL Editor**.
2. Abre el archivo `SUPABASE_FIX_DEUDAS.sql` que he creado en la carpeta `nextjs-app`.
3. Copia todo el contenido.
4. Pégalo en el editor de Supabase y dale a **RUN**.

Esto agregará las columnas faltantes sin borrar los datos existentes.
