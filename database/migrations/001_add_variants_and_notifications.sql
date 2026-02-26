-- Migration: Add variants and proximamente_notificaciones tables

-- 1. VARIANTES DE PRODUCTOS
CREATE TABLE IF NOT EXISTS variantes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    talle VARCHAR(50) NOT NULL,
    color VARCHAR(100) NOT NULL,
    color_hex VARCHAR(50),
    stock INTEGER DEFAULT 0,
    sku VARCHAR(100),
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(producto_id, talle, color_hex)
);

CREATE INDEX IF NOT EXISTS idx_variantes_producto ON variantes(producto_id);

-- 2. NOTIFICACIONES PROXIMAMENTE
CREATE TABLE IF NOT EXISTS proximamente_notificaciones (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, producto_id)
);

CREATE INDEX IF NOT EXISTS idx_proximamente_email ON proximamente_notificaciones(email);
CREATE INDEX IF NOT EXISTS idx_proximamente_producto ON proximamente_notificaciones(producto_id);

-- 3. RLS
ALTER TABLE variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proximamente_notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas Variantes
CREATE POLICY "Acceso público lectura variantes" ON variantes FOR SELECT USING (activo = TRUE);
CREATE POLICY "Acceso total admin variantes" ON variantes FOR ALL USING (true);

-- Políticas Notificaciones
CREATE POLICY "Acceso total admin proximamente" ON proximamente_notificaciones FOR ALL USING (true);
-- Nota: Insertar notificaciones es público via API service role, no requiere policy pública de insert si se usa service role
