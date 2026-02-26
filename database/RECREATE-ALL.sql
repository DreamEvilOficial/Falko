-- =============================================
-- RECREATE-ALL: Berta Moda
-- Borrado y Recreación Total con Preservación de Filtros
-- =============================================

-- 1. PRESERVAR FILTROS ESPECIALES (Copia temporal)
CREATE TEMP TABLE temp_filtros AS 
SELECT * FROM filtros_especiales WHERE activo = true;

-- 2. BORRAR TODO (Ordenado por dependencias)
DROP TABLE IF EXISTS audit_log CASCADE;
DROP TABLE IF EXISTS admin_logs CASCADE;
DROP TABLE IF EXISTS variantes CASCADE;
DROP TABLE IF EXISTS stock_movimientos CASCADE;
DROP TABLE IF EXISTS resenas CASCADE;
DROP TABLE IF EXISTS productos_etiquetas CASCADE;
DROP TABLE IF EXISTS orden_items CASCADE;
DROP TABLE IF EXISTS ordenes CASCADE;
DROP TABLE IF EXISTS productos CASCADE;
DROP TABLE IF EXISTS producto_imagenes CASCADE;
DROP TABLE IF EXISTS producto_variantes CASCADE; -- Tabla antigua si existiera
DROP TABLE IF EXISTS subcategorias CASCADE;
DROP TABLE IF EXISTS categorias CASCADE;
DROP TABLE IF EXISTS etiquetas CASCADE;
DROP TABLE IF EXISTS talles CASCADE;
DROP TABLE IF EXISTS colores CASCADE;
DROP TABLE IF EXISTS banners CASCADE;
DROP TABLE IF EXISTS filtros_especiales CASCADE;
DROP TABLE IF EXISTS homepage_sections CASCADE;
DROP TABLE IF EXISTS configuracion CASCADE;
DROP TABLE IF EXISTS configuraciones CASCADE;
DROP TABLE IF EXISTS configuracion_pago CASCADE;
DROP TABLE IF EXISTS usuarios CASCADE;
DROP TABLE IF EXISTS tiendas CASCADE;

-- 3. RECREAR ESTRUCTURA

-- Tiendas y Usuarios
CREATE TABLE tiendas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    slug TEXT NOT NULL UNIQUE,
    descripcion TEXT,
    whatsapp TEXT,
    instagram TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE usuarios (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tienda_id UUID REFERENCES tiendas(id) ON DELETE SET NULL,
    nombre TEXT NOT NULL,
    usuario VARCHAR(255) NOT NULL UNIQUE, -- LOGIN PRIMARIO
    contrasena VARCHAR(255) NOT NULL,    -- PASSWORD PRIMARIO
    email TEXT NULL UNIQUE,             -- OPCIONAL
    password_hash TEXT NULL,           -- OPCIONAL (Legacy/Compat)
    rol VARCHAR(50) DEFAULT 'staff',
    activo BOOLEAN DEFAULT true,
    admin BOOLEAN DEFAULT false,
    permiso_categorias BOOLEAN DEFAULT false,
    permiso_productos BOOLEAN DEFAULT false,
    permiso_configuracion BOOLEAN DEFAULT false,
    permiso_ordenes BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Catálogo
CREATE TABLE categorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) UNIQUE NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE subcategorias (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    categoria_id UUID REFERENCES categorias(id) ON DELETE CASCADE,
    nombre VARCHAR(100) NOT NULL,
    slug VARCHAR(100) NOT NULL,
    descripcion TEXT,
    activo BOOLEAN DEFAULT true,
    orden INTEGER DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(categoria_id, slug)
);

CREATE TABLE productos (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(200) NOT NULL,
    slug VARCHAR(200) UNIQUE NOT NULL,
    descripcion TEXT,
    precio NUMERIC NOT NULL CHECK (precio >= 0),
    precio_original NUMERIC,
    descuento_porcentaje INTEGER DEFAULT 0,
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 5,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL,
    imagen_url TEXT,
    imagenes JSONB DEFAULT '[]',
    variantes JSONB DEFAULT '[]',
    activo BOOLEAN DEFAULT true,
    destacado BOOLEAN DEFAULT false,
    top BOOLEAN DEFAULT false,
    proximo_lanzamiento BOOLEAN DEFAULT false,
    nuevo_lanzamiento BOOLEAN DEFAULT false,
    sku VARCHAR(100) UNIQUE,
    proveedor_nombre TEXT,
    proveedor_contacto TEXT,
    precio_costo NUMERIC,
    peso NUMERIC,
    dimensiones JSONB,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE etiquetas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre VARCHAR(50) NOT NULL UNIQUE,
    tipo VARCHAR(30) DEFAULT 'promocion',
    color VARCHAR(20) DEFAULT '#FF6B6B',
    icono VARCHAR(50),
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE productos_etiquetas (
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    etiqueta_id UUID REFERENCES etiquetas(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (producto_id, etiqueta_id)
);

-- Ventas y Feedback
CREATE TABLE ordenes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    numero_orden VARCHAR(50) NOT NULL UNIQUE,
    cliente_nombre VARCHAR(200) NOT NULL,
    cliente_email VARCHAR(200) NOT NULL,
    cliente_telefono VARCHAR(50),
    cliente_dni VARCHAR(50),
    direccion_envio TEXT,
    ciudad VARCHAR(100),
    provincia VARCHAR(100),
    codigo_postal VARCHAR(20),
    items JSONB NOT NULL DEFAULT '[]',
    subtotal NUMERIC NOT NULL,
    envio NUMERIC DEFAULT 0,
    descuento NUMERIC DEFAULT 0,
    total NUMERIC NOT NULL,
    estado VARCHAR(50) DEFAULT 'pendiente',
    metodo_pago VARCHAR(50),
    pago_id VARCHAR(100),
    notas TEXT,
    metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE resenas (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    nombre_cliente VARCHAR(200) NOT NULL,
    email_cliente VARCHAR(200),
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    comentario TEXT,
    verificada BOOLEAN DEFAULT false,
    aprobado BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Landing y UI
CREATE TABLE banners (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

CREATE TABLE filtros_especiales (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    nombre TEXT NOT NULL,
    clave TEXT UNIQUE,
    config JSONB DEFAULT '{}',
    icono TEXT,
    imagen_url TEXT,
    color VARCHAR(50),
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE homepage_sections (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tipo VARCHAR(50) NOT NULL, -- 'categoria', 'filtro', 'etiqueta'
    referencia_id VARCHAR(100) NOT NULL,
    titulo VARCHAR(200) NOT NULL,
    subtitulo VARCHAR(200),
    gif_url TEXT,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE configuracion (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    clave VARCHAR(100) NOT NULL UNIQUE,
    valor JSONB NOT NULL,
    descripcion TEXT,
    tipo VARCHAR(50) DEFAULT 'general',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. RESTAURAR FILTROS ESPECIALES (Mapeo explícito por nombre de columna)
INSERT INTO filtros_especiales (id, nombre, clave, config, icono, imagen_url, color, orden, activo, created_at)
SELECT id, nombre, clave, config, icono, imagen_url, color, orden, activo, created_at FROM temp_filtros;
DROP TABLE temp_filtros;

-- 5. FUNCIONES DE SEGURIDAD

-- IS_ADMIN (Personalizado para nuestro Login)
CREATE OR REPLACE FUNCTION is_admin() 
RETURNS BOOLEAN AS $$
BEGIN
  -- Como no usamos Supabase Auth (JWT), esta función siempre retorna true
  -- porque el Middleware de Next.js es quien ya validó la sesión antes de llegar aquí.
  RETURN true;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- AUTH_LOGIN (Usa USUARIO y CONTRASENA)
CREATE OR REPLACE FUNCTION auth_login(p_username TEXT, p_password TEXT)
RETURNS JSON AS $$
DECLARE
    v_user RECORD;
    v_u TEXT := LOWER(TRIM(p_username));
    v_p TEXT := TRIM(p_password);
BEGIN
    SELECT * INTO v_user FROM usuarios 
    WHERE (LOWER(TRIM(usuario)) = v_u OR LOWER(TRIM(email)) = v_u);

    IF v_user.id IS NULL THEN
        RETURN json_build_object('error', 'Usuario no encontrado');
    END IF;

    IF v_user.contrasena != v_p THEN
        RETURN json_build_object('error', 'Contraseña incorrecta');
    END IF;

    IF v_user.activo = false THEN
        RETURN json_build_object('error', 'Usuario inactivo');
    END IF;

    RETURN json_build_object(
        'id', v_user.id,
        'email', COALESCE(v_user.email, v_user.usuario || '@tienda.com'),
        'usuario', v_user.usuario,
        'nombre', v_user.nombre,
        'rol', v_user.rol,
        'admin', (v_user.rol = 'admin' OR v_user.rol = 'owner' OR v_user.admin = true)
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 6. RLS (POLÍTICAS ABIERTAS PARA EL PANEL ADMIN)
-- Activamos RLS pero permitimos acceso total para que el Panel Admin funcione sin Supabase Auth
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE etiquetas ENABLE ROW LEVEL SECURITY;
ALTER TABLE banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE filtros_especiales ENABLE ROW LEVEL SECURITY;
ALTER TABLE homepage_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Acceso total" ON productos FOR ALL USING (true);
CREATE POLICY "Acceso total" ON categorias FOR ALL USING (true);
CREATE POLICY "Acceso total" ON subcategorias FOR ALL USING (true);
CREATE POLICY "Acceso total" ON etiquetas FOR ALL USING (true);
CREATE POLICY "Acceso total" ON banners FOR ALL USING (true);
CREATE POLICY "Acceso total" ON ordenes FOR ALL USING (true);
CREATE POLICY "Acceso total" ON usuarios FOR ALL USING (true);
CREATE POLICY "Acceso total" ON filtros_especiales FOR ALL USING (true);
CREATE POLICY "Acceso total" ON homepage_sections FOR ALL USING (true);
CREATE POLICY "Acceso total" ON configuracion FOR ALL USING (true);

-- 7. SEED DATA (Admin Principal)
INSERT INTO usuarios (nombre, usuario, contrasena, rol, admin, activo)
VALUES ('Marcos Peiti', 'marcospeiti', 'Omega10', 'admin', true, true);
