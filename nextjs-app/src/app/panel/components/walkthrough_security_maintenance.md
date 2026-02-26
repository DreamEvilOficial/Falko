# Resumen de Cambios: Funcionalidad y Seguridad

Se han completado las solicitudes de corrección de títulos, modo mantenimiento y revisión de seguridad.

## 1. Corrección de Título en Categorías

- **Problema**: El título de la categoría persistía incorrectamente al navegar entre distintas.
- **Solución**: Se agregó un "reset" de estado (`setCategoriaNombre('')`, `setSubcategoriaNombre('')`) en `products/page.tsx` justo antes de cargar los nuevos datos. Esto asegura que el título viejo se limpie antes de mostrar el nuevo.

## 2. Modo Mantenimiento

- **Admin Panel**: Se agregó un interruptor "Modo Mantenimiento" en la sección de Identidad.
- **Frontend**: Se implementó una pantalla de bloqueo (`MaintenanceScreen.tsx`) con diseño "Blacklist".
  - **Bloqueo**: Si el modo está activo, cualquier usuario no administrador verá esta pantalla.
  - **Desbloqueo**: Botón "Acceso Administrativo" permite a los operadores desbloquear el sitio mediante login (email/pass de operador). Esto guarda un permiso en el navegador (`maintenance_bypass`) para navegar normalmente.
  - **Admin**: Las rutas `/admin` no se ven afectadas.

## 3. Revisión y Refuerzo de Seguridad

- **Vulnerabilidad Detectada**: La creación de preferencias de MercadoPago (`create-preference`) confiaba ciegamente en los precios enviados por el frontend (body del request).
- **Corrección**: Se reescribió la lógica para que el servidor **busque el precio real en la base de datos** usando el ID del producto, ignorando el precio enviado por el cliente. También verifica stock y estado activo.
- **Admin Middleware**: Se eliminó un bloque de código temporal que permitía el acceso administrativo con firmas de sesión inválidas (modo debug). Ahora la verificación de seguridad es estricta.
- **Validación de Orden**: Se confirmó que `api/validate-order` ya implementaba lógica robusta.

## Pasos para probar

1. **Títulos**: Navega entre categorías "eaeaea" y "basiconas". El título debería actualizarse correctamente.
2. **Mantenimiento**:
   - Ve a Admin > Configuración > Activa "Modo Mantenimiento".
   - Abre la web en modo incógnito. Deberías ver la pantalla negra de mantenimiento.
   - Intenta desbloquear con tu usuario de operador.
3. **Seguridad**:
   - Intenta hacer una compra. El flujo debe seguir funcionando normal (la validación extra es transparente para el usuario honesto).
