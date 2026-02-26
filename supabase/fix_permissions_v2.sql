-- 1. Políticas para CONFIGURACION
ALTER TABLE IF EXISTS configuracion ENABLE ROW LEVEL SECURITY;

-- Lectura pública (necesaria para que el frontend cargue el nombre de la tienda, logo, etc.)
DROP POLICY IF EXISTS "Lectura pública de configuracion" ON configuracion;
CREATE POLICY "Lectura pública de configuracion" ON configuracion FOR SELECT USING (true);

-- Escritura solo admin (autenticado)
DROP POLICY IF EXISTS "Gestión total de configuracion" ON configuracion;
CREATE POLICY "Gestión total de configuracion" ON configuracion FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 2. Políticas para HOMEPAGE_SECTIONS (Secciones de inicio)
ALTER TABLE IF EXISTS homepage_sections ENABLE ROW LEVEL SECURITY;

-- Lectura pública
DROP POLICY IF EXISTS "Lectura pública de homepage_sections" ON homepage_sections;
CREATE POLICY "Lectura pública de homepage_sections" ON homepage_sections FOR SELECT USING (true);

-- Escritura solo admin
DROP POLICY IF EXISTS "Gestión total de homepage_sections" ON homepage_sections;
CREATE POLICY "Gestión total de homepage_sections" ON homepage_sections FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 3. Políticas para BANNERS (por si acaso)
ALTER TABLE IF EXISTS banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Lectura pública de banners" ON banners;
CREATE POLICY "Lectura pública de banners" ON banners FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión total de banners" ON banners;
CREATE POLICY "Gestión total de banners" ON banners FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 4. Verificación de Buckets (Creación si no existen - esto es tricky en SQL puro, mejor asegurar permisos)
-- Re-aplicar permisos de storage por si el script anterior falló o faltó algo
INSERT INTO storage.buckets (id, name, public) 
VALUES ('productos', 'productos', true)
ON CONFLICT (id) DO UPDATE SET public = true;

INSERT INTO storage.buckets (id, name, public) 
VALUES ('banners', 'banners', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permitir acceso público a estos buckets
DROP POLICY IF EXISTS "Public Access Banners" ON storage.objects;
CREATE POLICY "Public Access Banners" ON storage.objects FOR SELECT 
USING ( bucket_id IN ('productos', 'banners', 'tiendas', 'avatares') );
