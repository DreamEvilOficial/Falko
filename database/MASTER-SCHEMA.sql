-- =============================================
-- ESQUEMA MAESTRO CONSOLIDADO (POSTGRESQL / SUPABASE)
-- Tienda de Ropa - Optimización Integral
-- =============================================

-- Extensiones necesarias
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. TABLA DE CONFIGURACIÓN GENERAL
DROP TABLE IF EXISTS configuracion CASCADE;
CREATE TABLE IF NOT EXISTS configuracion (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    clave VARCHAR(100) UNIQUE NOT NULL,
    valor JSONB NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. TABLA DE USUARIOS / OPERADORES
DROP TABLE IF EXISTS usuarios CASCADE;
CREATE TABLE IF NOT EXISTS usuarios (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE,
    usuario VARCHAR(255) UNIQUE,
    contrasena TEXT,
    nombre VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'operador',
    permiso_categorias BOOLEAN DEFAULT FALSE,
    permiso_productos BOOLEAN DEFAULT FALSE,
    permiso_configuracion BOOLEAN DEFAULT FALSE,
    permiso_ordenes BOOLEAN DEFAULT FALSE,
    activo BOOLEAN DEFAULT TRUE,
    admin BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CATEGORÍAS Y SUBCATEGORÍAS
-- Forzamos recreación para asegurar integridad
DROP TABLE IF EXISTS subcategorias CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;

CREATE TABLE IF NOT EXISTS categorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    icono VARCHAR(100),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategorias (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    descripcion TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(categoria_id, slug)
);

-- 4. PRODUCTOS
DROP TABLE IF EXISTS productos CASCADE;
CREATE TABLE IF NOT EXISTS productos (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    precio DECIMAL(12, 2) NOT NULL DEFAULT 0,
    precio_original DECIMAL(12, 2),
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    imagenes JSONB DEFAULT '[]',
    variantes JSONB DEFAULT '[]',
    dimensiones JSONB DEFAULT '{}',
    metadata JSONB DEFAULT '{}',
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    top BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4.1 VARIANTES DE PRODUCTOS
DROP TABLE IF EXISTS variantes CASCADE;
CREATE TABLE IF NOT EXISTS variantes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
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

-- 5. VENTAS / ÓRDENES
DROP TABLE IF EXISTS orden_items CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;

CREATE TABLE IF NOT EXISTS ordenes (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    numero_orden VARCHAR(50) UNIQUE,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255),
    cliente_telefono VARCHAR(50),
    subtotal DECIMAL(12, 2) NOT NULL DEFAULT 0,
    total DECIMAL(12, 2) NOT NULL DEFAULT 0,
    descuento DECIMAL(12, 2) DEFAULT 0,
    envio DECIMAL(12, 2) DEFAULT 0,
    estado VARCHAR(50) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    notas TEXT,
    mercadopago_payment_id VARCHAR(100),
    mercadopago_status VARCHAR(50),
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS orden_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    cantidad INTEGER NOT NULL DEFAULT 1,
    precio_unitario DECIMAL(12, 2) NOT NULL,
    variante_info JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. DEUDAS
DROP TABLE IF EXISTS deudas CASCADE;
CREATE TABLE IF NOT EXISTS deudas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_apellido VARCHAR(255),
    cliente_dni VARCHAR(20),
    cliente_celular VARCHAR(50),
    cliente_direccion TEXT,
    total_deuda DECIMAL(12, 2) DEFAULT 0,
    historial JSONB DEFAULT '[]',
    estado VARCHAR(50) DEFAULT 'pendiente',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. RESEÑAS
DROP TABLE IF EXISTS resenas CASCADE;
CREATE TABLE IF NOT EXISTS resenas (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255),
    calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    aprobado BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. BANNERS
DROP TABLE IF EXISTS banners CASCADE;
CREATE TABLE IF NOT EXISTS banners (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) DEFAULT 'hero',
    titulo VARCHAR(200),
    subtitulo VARCHAR(200),
    imagen_url TEXT NOT NULL,
    imagen_mobile_url TEXT,
    link_url TEXT,
    link_texto VARCHAR(100),
    activo BOOLEAN DEFAULT TRUE,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.1 FILTROS ESPECIALES
DROP TABLE IF EXISTS filtros_especiales CASCADE;
CREATE TABLE IF NOT EXISTS filtros_especiales (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(100) NOT NULL,
    clave VARCHAR(100) UNIQUE NOT NULL,
    config JSONB DEFAULT '{}',
    icono TEXT,
    imagen_url TEXT,
    color VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.2 SECCIONES DE HOME
DROP TABLE IF EXISTS homepage_sections CASCADE;
CREATE TABLE IF NOT EXISTS homepage_sections (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tipo VARCHAR(50) NOT NULL,
    referencia_id VARCHAR(100) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    subtitulo VARCHAR(200),
    gif_url TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8.3 NOTIFICACIONES PROXIMAMENTE
DROP TABLE IF EXISTS proximamente_notificaciones CASCADE;
CREATE TABLE IF NOT EXISTS proximamente_notificaciones (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(email, producto_id)
);

-- 9. ÍNDICES DE RENDIMIENTO
CREATE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_variantes_producto ON variantes(producto_id);
CREATE INDEX IF NOT EXISTS idx_proximamente_email ON proximamente_notificaciones(email);
CREATE INDEX IF NOT EXISTS idx_proximamente_producto ON proximamente_notificaciones(producto_id);
CREATE INDEX IF NOT EXISTS idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario);
CREATE INDEX IF NOT EXISTS idx_deudas_cliente ON deudas(cliente_nombre);

-- 10. SEGURIDAD (RLS)
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE deudas ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE proximamente_notificaciones ENABLE ROW LEVEL SECURITY;

-- Políticas de acceso público (Lectura)
DROP POLICY IF EXISTS "Acceso público lectura productos" ON productos;
DROP POLICY IF EXISTS "Acceso público lectura categorias" ON categorias;
DROP POLICY IF EXISTS "Acceso público lectura subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Acceso público lectura banners" ON banners;
DROP POLICY IF EXISTS "Acceso público lectura resenas" ON resenas;

CREATE POLICY "Acceso público lectura productos" ON productos FOR SELECT USING (activo = TRUE);
CREATE POLICY "Acceso público lectura categorias" ON categorias FOR SELECT USING (activo = TRUE);
CREATE POLICY "Acceso público lectura subcategorias" ON subcategorias FOR SELECT USING (activo = TRUE);
CREATE POLICY "Acceso público lectura banners" ON banners FOR SELECT USING (activo = TRUE);
CREATE POLICY "Acceso público lectura resenas" ON resenas FOR SELECT USING (aprobado = TRUE);

-- Acceso total para usuarios autenticados (Admin/Staff)
DROP POLICY IF EXISTS "Acceso total admin" ON productos;
DROP POLICY IF EXISTS "Acceso total admin categorias" ON categorias;
DROP POLICY IF EXISTS "Acceso total admin subcategorias" ON subcategorias;
DROP POLICY IF EXISTS "Acceso total admin usuarios" ON usuarios;
DROP POLICY IF EXISTS "Acceso total admin ordenes" ON ordenes;
DROP POLICY IF EXISTS "Acceso total admin deudas" ON deudas;
DROP POLICY IF EXISTS "Acceso total admin resenas" ON resenas;
DROP POLICY IF EXISTS "Acceso total admin banners" ON banners;
DROP POLICY IF EXISTS "Acceso total admin configuracion" ON configuracion;

CREATE POLICY "Acceso total admin" ON productos FOR ALL USING (true);
CREATE POLICY "Acceso total admin categorias" ON categorias FOR ALL USING (true);
CREATE POLICY "Acceso total admin subcategorias" ON subcategorias FOR ALL USING (true);
CREATE POLICY "Acceso total admin usuarios" ON usuarios FOR ALL USING (true);
CREATE POLICY "Acceso total admin ordenes" ON ordenes FOR ALL USING (true);
CREATE POLICY "Acceso total admin deudas" ON deudas FOR ALL USING (true);
CREATE POLICY "Acceso total admin resenas" ON resenas FOR ALL USING (true);
CREATE POLICY "Acceso total admin banners" ON banners FOR ALL USING (true);
CREATE POLICY "Acceso total admin configuracion" ON configuracion FOR ALL USING (true);
CREATE POLICY "Acceso total admin variantes" ON variantes FOR ALL USING (true);
CREATE POLICY "Acceso total admin proximamente" ON proximamente_notificaciones FOR ALL USING (true);
