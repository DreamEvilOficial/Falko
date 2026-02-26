# Configuración de Supabase

## Variables de Entorno

Crea un archivo `.env` en la raíz del proyecto con:

```env
SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_ANON_KEY=tu_anon_key_aqui
SUPABASE_SERVICE_ROLE_KEY=tu_service_role_key_aqui
```

## Configuración de Storage

1. Ve a **Storage** en tu dashboard de Supabase
2. Crea los siguientes buckets:
   - `productos` (público)
   - `tiendas` (público)
   - `avatares` (público)

3. Configura las políticas de acceso:

```sql
-- Política para productos (lectura pública)
CREATE POLICY "Productos lectura pública"
ON storage.objects FOR SELECT
USING (bucket_id = 'productos');

-- Política para subir productos (autenticado)
CREATE POLICY "Productos subir autenticado"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'productos' AND auth.role() = 'authenticated');
```

## Configuración de Auth

1. Ve a **Authentication > Providers**
2. Habilita **Email** provider
3. (Opcional) Habilita **Google** u otros providers

### Templates de Email

Personaliza los templates en **Authentication > Email Templates**:

**Confirmación de Email:**
```html
<h2>Bienvenido a {{ .SiteName }}</h2>
<p>Haz clic en el siguiente enlace para confirmar tu email:</p>
<p><a href="{{ .ConfirmationURL }}">Confirmar Email</a></p>
```

## Funciones Edge (Opcional)

Para funcionalidades serverless, crea funciones en `supabase/functions/`:

```typescript
// supabase/functions/process-order/index.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Lógica de procesamiento de órdenes
  return new Response(JSON.stringify({ success: true }))
})
```

## Triggers Útiles

```sql
-- Trigger para actualizar stock automáticamente
CREATE OR REPLACE FUNCTION actualizar_stock_producto()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE productos
    SET stock_actual = stock_actual - NEW.cantidad
    WHERE id = NEW.producto_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_actualizar_stock
AFTER INSERT ON orden_items
FOR EACH ROW
EXECUTE FUNCTION actualizar_stock_producto();
```

## Backup

Configura backups automáticos en **Settings > Database > Backups**:
- Frecuencia: Diaria
- Retención: 30 días
- Backup en punto específico: Habilitado
