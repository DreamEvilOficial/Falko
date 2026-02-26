-- Habilitar RLS en tablas críticas si no lo están
ALTER TABLE IF EXISTS productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS subcategorias ENABLE ROW LEVEL SECURITY;

-- 1. Políticas para PRODUCTOS
-- Permitir lectura pública de productos
DROP POLICY IF EXISTS "Lectura pública de productos" ON productos;
CREATE POLICY "Lectura pública de productos" ON productos FOR SELECT USING (true);

-- Permitir gestión total a usuarios autenticados (admin) o service role
DROP POLICY IF EXISTS "Gestión total de productos" ON productos;
CREATE POLICY "Gestión total de productos" ON productos FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 2. Políticas para CATEGORIAS (reforzar)
DROP POLICY IF EXISTS "Lectura pública de categorias" ON categorias;
CREATE POLICY "Lectura pública de categorias" ON categorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión total de categorias" ON categorias;
CREATE POLICY "Gestión total de categorias" ON categorias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 3. Políticas para SUBCATEGORIAS (reforzar)
DROP POLICY IF EXISTS "Lectura pública de subcategorias" ON subcategorias;
CREATE POLICY "Lectura pública de subcategorias" ON subcategorias FOR SELECT USING (true);

DROP POLICY IF EXISTS "Gestión total de subcategorias" ON subcategorias;
CREATE POLICY "Gestión total de subcategorias" ON subcategorias FOR ALL USING (auth.role() = 'authenticated') WITH CHECK (auth.role() = 'authenticated');


-- 4. STORAGE (Imágenes)
-- Asegurar que los buckets sean públicos (esto se hace en la configuración del bucket, pero aquí definimos acceso a objetos)

-- Permitir ver imágenes a cualquiera (público) en buckets 'productos', 'banners', 'tiendas', 'avatares'
DROP POLICY IF EXISTS "Public Access" ON storage.objects;
CREATE POLICY "Public Access" ON storage.objects FOR SELECT 
USING ( bucket_id IN ('productos', 'banners', 'tiendas', 'avatares') );

-- Permitir subir/modificar imágenes solo a usuarios autenticados
DROP POLICY IF EXISTS "Authenticated Upload" ON storage.objects;
CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT 
WITH CHECK ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Update" ON storage.objects;
CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE 
USING ( auth.role() = 'authenticated' );

DROP POLICY IF EXISTS "Authenticated Delete" ON storage.objects;
CREATE POLICY "Authenticated Delete" ON storage.objects FOR DELETE 
USING ( auth.role() = 'authenticated' );
