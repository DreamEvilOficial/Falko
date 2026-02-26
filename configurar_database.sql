-- Script SQL para configurar Berta Moda
-- Ejecutar este script en el SQL Editor de Supabase

-- Habilitar extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- =============================================
-- TABLA: configuracion
-- =============================================
CREATE TABLE IF NOT EXISTS configuracion (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  clave VARCHAR(100) UNIQUE NOT NULL,
  valor JSONB NOT NULL,
  descripcion TEXT,
  tipo VARCHAR(50) DEFAULT 'general',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- TABLA: banners
-- =============================================
CREATE TABLE IF NOT EXISTS banners (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  titulo VARCHAR(200),
  subtitulo VARCHAR(200),
  imagen_url TEXT NOT NULL,
  imagen_mobile_url TEXT,
  link_url TEXT,
  link_texto VARCHAR(100),
  activo BOOLEAN DEFAULT true,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================
-- CONFIGURAR RLS (Row Level Security)
-- =============================================
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;

-- Políticas para configuracion
DROP POLICY IF EXISTS "Configuración pública" ON configuracion;
CREATE POLICY "Configuración pública" ON configuracion FOR SELECT USING (true);

DROP POLICY IF EXISTS "Configuración escritura" ON configuracion;
CREATE POLICY "Configuración escritura" ON configuracion FOR ALL USING (true);

-- Políticas para banners
DROP POLICY IF EXISTS "Banners activos públicos" ON banners;
CREATE POLICY "Banners activos públicos" ON banners FOR SELECT USING (activo = true);

DROP POLICY IF EXISTS "Banners escritura" ON banners;
CREATE POLICY "Banners escritura" ON banners FOR ALL USING (true);

-- =============================================
-- INSERTAR CONFIGURACIÓN INICIAL
-- =============================================

-- Mensajes del announcer slider
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('anuncio_1', '"🔥 EN TRANSFERENCIA - CON 70% OFF"', 'Primer mensaje del slider de anuncios')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

INSERT INTO configuracion (clave, valor, descripcion) VALUES
('anuncio_2', '"HASTA 6 CUOTAS SIN INTERÉS"', 'Segundo mensaje del slider de anuncios')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

INSERT INTO configuracion (clave, valor, descripcion) VALUES
('anuncio_3', '"10% EN TRANSFERENCIAS"', 'Tercer mensaje del slider de anuncios')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- URLs de banners
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('banner_urls', '[{"url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop", "link": "/productos"}, {"url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop", "link": "/ofertas"}]', 'URLs de los banners principales')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- Banner principal del hero
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('hero_banner_url', '"https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop"', 'Banner principal del hero')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- Configuración de MercadoPago
INSERT INTO configuracion (clave, valor, descripcion) VALUES
('mercadopago_public_key', '"TEST-ejemplo"', 'Clave pública de MercadoPago')
ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor, updated_at = NOW();

-- =============================================
-- INSERTAR BANNERS DE EJEMPLO
-- =============================================
INSERT INTO banners (titulo, subtitulo, imagen_url, link_url, link_texto, orden, activo) VALUES
('Nueva Colección', 'Descubre las últimas tendencias', 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop', '/productos', 'Ver productos', 1, true),
('Ofertas Especiales', 'Hasta 50% de descuento', 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop', '/ofertas', 'Ver ofertas', 2, true);

-- =============================================
-- VERIFICAR DATOS
-- =============================================
SELECT 'Configuración insertada:' as mensaje;
SELECT clave, valor FROM configuracion ORDER BY clave;

SELECT 'Banners insertados:' as mensaje;
SELECT titulo, activo FROM banners ORDER BY orden;