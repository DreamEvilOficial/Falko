-- Script para arreglar la tabla 'deudas' agregando las columnas faltantes
-- Copia y pega este contenido en el SQL Editor de Supabase:
-- https://supabase.com/dashboard/project/_/sql/new

-- 1. Agregar columnas faltantes si no existen
DO $$
BEGIN
    -- cliente_apellido
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_apellido') THEN
        ALTER TABLE deudas ADD COLUMN cliente_apellido TEXT;
    END IF;

    -- cliente_dni
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_dni') THEN
        ALTER TABLE deudas ADD COLUMN cliente_dni TEXT;
    END IF;

    -- cliente_celular
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_celular') THEN
        ALTER TABLE deudas ADD COLUMN cliente_celular TEXT;
    END IF;

    -- cliente_direccion
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_direccion') THEN
        ALTER TABLE deudas ADD COLUMN cliente_direccion TEXT;
    END IF;

    -- total_deuda
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'total_deuda') THEN
        ALTER TABLE deudas ADD COLUMN total_deuda NUMERIC DEFAULT 0;
    END IF;

    -- historial
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'historial') THEN
        ALTER TABLE deudas ADD COLUMN historial JSONB DEFAULT '[]';
    END IF;

END $$;

-- 2. Asegurar que el ID sea TEXT/UUID
-- (Si ya es UUID, esto no hace daño)
-- ALTER TABLE deudas ALTER COLUMN id TYPE TEXT; -- Solo si es necesario cambiar el tipo

-- 3. Habilitar RLS (Seguridad)
ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;

-- 4. Crear política de acceso total para la API (Service Role)
-- Esta política permite que el backend (usando la key secreta) pueda hacer todo.
-- Pero para el acceso público/anonimo, definimos lo siguiente:

-- Permitir lectura pública (o restringir a admin si se prefiere)
DROP POLICY IF EXISTS "Lectura de deudas" ON deudas;
CREATE POLICY "Lectura de deudas" ON deudas FOR SELECT USING (true);

-- Permitir escritura solo a Service Role (backend) - Supabase lo permite por defecto con service key.
-- Si queremos permitir inserts desde cliente (no recomendado para deudas), agregaríamos política.
-- Aquí asumimos que todo pasa por la API que usa Service Key.

