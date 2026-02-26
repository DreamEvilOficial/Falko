-- =============================================
-- ESQUEMA DE BASE DE DATOS SUPABASE
-- Tienda de Ropa
-- =============================================

-- Tabla de tiendas
CREATE TABLE tiendas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,
    descripcion TEXT,
    logo_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    activo BOOLEAN DEFAULT TRUE,
    
    -- Configuración de MercadoPago
    mp_public_key VARCHAR(255),
    mp_access_token VARCHAR(255),
    mp_cvu VARCHAR(50),
    
    -- Contacto
    whatsapp VARCHAR(50),
    instagram VARCHAR(255),
    email VARCHAR(255),
    direccion TEXT,
    
    -- Configuración
    moneda VARCHAR(10) DEFAULT 'ARS',
    timezone VARCHAR(50) DEFAULT 'America/Argentina/Buenos_Aires'
);

-- Tabla de usuarios
CREATE TABLE usuarios (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    nombre VARCHAR(255) NOT NULL,
    apellido VARCHAR(255),
    rol VARCHAR(50) DEFAULT 'admin', -- admin, staff, viewer
    avatar_url TEXT,
    telefono VARCHAR(50),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    ultimo_acceso TIMESTAMP WITH TIME ZONE,
    activo BOOLEAN DEFAULT TRUE
);

-- Tabla de categorías
CREATE TABLE categorias (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    descripcion TEXT,
    imagen_url TEXT,
    parent_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tienda_id, slug)
);

-- Tabla de productos
CREATE TABLE productos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    categoria_id UUID REFERENCES categorias(id) ON DELETE SET NULL,
    nombre VARCHAR(255) NOT NULL,
    slug VARCHAR(255) NOT NULL,
    descripcion TEXT,
    descripcion_corta TEXT,
    precio DECIMAL(10, 2) NOT NULL,
    precio_oferta DECIMAL(10, 2),
    costo DECIMAL(10, 2),
    sku VARCHAR(100),
    codigo_barras VARCHAR(100),
    
    -- Stock
    stock_actual INTEGER DEFAULT 0,
    stock_minimo INTEGER DEFAULT 0,
    gestionar_stock BOOLEAN DEFAULT TRUE,
    
    -- Estado
    activo BOOLEAN DEFAULT TRUE,
    destacado BOOLEAN DEFAULT FALSE,
    
    -- SEO
    meta_title VARCHAR(255),
    meta_description TEXT,
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(tienda_id, slug)
);

-- Tabla de imágenes de productos
CREATE TABLE producto_imagenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    url TEXT NOT NULL,
    alt_text VARCHAR(255),
    orden INTEGER DEFAULT 0,
    es_principal BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de variantes (combinaciones de talles y colores)
CREATE TABLE variantes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    sku VARCHAR(100),
    talle VARCHAR(50),
    color VARCHAR(50),
    color_hex VARCHAR(50),
    precio_adicional DECIMAL(10, 2) DEFAULT 0,
    stock INTEGER DEFAULT 0,
    imagen_url TEXT,
    activo BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(producto_id, talle, color_hex)
);

-- Tabla de notificaciones de proximamente
CREATE TABLE proximamente_notificaciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    email TEXT NOT NULL,
    producto_id TEXT NOT NULL,
    notificado BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(email, producto_id)
);

-- Tabla de talles disponibles
CREATE TABLE talles (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    orden INTEGER DEFAULT 0,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(tienda_id, codigo)
);

-- Tabla de colores disponibles
CREATE TABLE colores (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    nombre VARCHAR(50) NOT NULL,
    codigo VARCHAR(20) NOT NULL,
    hex VARCHAR(7) NOT NULL,
    activo BOOLEAN DEFAULT TRUE,
    UNIQUE(tienda_id, codigo)
);

-- Tabla de órdenes/pedidos
CREATE TABLE ordenes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    numero_orden VARCHAR(50) UNIQUE NOT NULL,
    
    -- Cliente
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255) NOT NULL,
    cliente_telefono VARCHAR(50),
    
    -- Dirección de envío
    envio_direccion TEXT,
    envio_ciudad VARCHAR(100),
    envio_provincia VARCHAR(100),
    envio_codigo_postal VARCHAR(20),
    envio_pais VARCHAR(100) DEFAULT 'Argentina',
    
    -- Montos
    subtotal DECIMAL(10, 2) NOT NULL,
    descuento DECIMAL(10, 2) DEFAULT 0,
    envio DECIMAL(10, 2) DEFAULT 0,
    total DECIMAL(10, 2) NOT NULL,
    
    -- Estado
    estado VARCHAR(50) DEFAULT 'pendiente', -- pendiente, procesando, enviado, entregado, cancelado
    estado_pago VARCHAR(50) DEFAULT 'pendiente', -- pendiente, aprobado, rechazado, reembolsado
    
    -- MercadoPago
    mp_preference_id VARCHAR(255),
    mp_payment_id VARCHAR(255),
    mp_status VARCHAR(50),
    
    -- Notas
    notas_cliente TEXT,
    notas_admin TEXT,
    
    -- Fechas
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    fecha_pago TIMESTAMP WITH TIME ZONE,
    fecha_envio TIMESTAMP WITH TIME ZONE,
    fecha_entrega TIMESTAMP WITH TIME ZONE
);

-- Tabla de items de orden
CREATE TABLE orden_items (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE SET NULL,
    variante_id UUID REFERENCES variantes(id) ON DELETE SET NULL,
    
    nombre_producto VARCHAR(255) NOT NULL,
    sku VARCHAR(100),
    precio_unitario DECIMAL(10, 2) NOT NULL,
    cantidad INTEGER NOT NULL,
    subtotal DECIMAL(10, 2) NOT NULL,
    
    -- Detalles de la variante
    talle VARCHAR(50),
    color VARCHAR(50),
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de reseñas
CREATE TABLE resenas (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    orden_id UUID REFERENCES ordenes(id) ON DELETE SET NULL,
    
    cliente_nombre VARCHAR(255) NOT NULL,
    cliente_email VARCHAR(255),
    
    calificacion INTEGER NOT NULL CHECK (calificacion >= 1 AND calificacion <= 5),
    titulo VARCHAR(255),
    comentario TEXT,
    
    aprobado BOOLEAN DEFAULT FALSE,
    destacado BOOLEAN DEFAULT FALSE,
    
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de movimientos de stock
CREATE TABLE stock_movimientos (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
    variante_id UUID REFERENCES variantes(id) ON DELETE SET NULL,
    
    tipo VARCHAR(50) NOT NULL, -- entrada, salida, ajuste, venta, devolucion
    cantidad INTEGER NOT NULL,
    stock_anterior INTEGER NOT NULL,
    stock_nuevo INTEGER NOT NULL,
    
    referencia VARCHAR(255), -- orden_id, nota, etc.
    notas TEXT,
    
    usuario_id UUID REFERENCES usuarios(id) ON DELETE SET NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Tabla de configuración
CREATE TABLE configuraciones (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    tienda_id UUID REFERENCES tiendas(id) ON DELETE CASCADE,
    clave VARCHAR(255) NOT NULL,
    valor TEXT,
    tipo VARCHAR(50) DEFAULT 'string', -- string, number, boolean, json
    descripcion TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(tienda_id, clave)
);

-- =============================================
-- ÍNDICES PARA MEJORAR RENDIMIENTO
-- =============================================

CREATE INDEX idx_productos_tienda ON productos(tienda_id);
CREATE INDEX idx_productos_categoria ON productos(categoria_id);
CREATE INDEX idx_productos_activo ON productos(activo);
CREATE INDEX idx_productos_destacado ON productos(destacado);
CREATE INDEX idx_productos_slug ON productos(slug);

CREATE INDEX idx_variantes_producto ON variantes(producto_id);
CREATE INDEX idx_variantes_activo ON variantes(activo);

CREATE INDEX idx_ordenes_tienda ON ordenes(tienda_id);
CREATE INDEX idx_ordenes_estado ON ordenes(estado);
CREATE INDEX idx_ordenes_estado_pago ON ordenes(estado_pago);
CREATE INDEX idx_ordenes_numero ON ordenes(numero_orden);
CREATE INDEX idx_ordenes_email ON ordenes(cliente_email);

CREATE INDEX idx_orden_items_orden ON orden_items(orden_id);
CREATE INDEX idx_orden_items_producto ON orden_items(producto_id);

CREATE INDEX idx_resenas_producto ON resenas(producto_id);
CREATE INDEX idx_resenas_aprobado ON resenas(aprobado);

CREATE INDEX idx_stock_movimientos_producto ON stock_movimientos(producto_id);
CREATE INDEX idx_stock_movimientos_tienda ON stock_movimientos(tienda_id);

-- =============================================
-- FUNCIONES Y TRIGGERS
-- =============================================

-- Función para actualizar updated_at automáticamente
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Triggers para updated_at
CREATE TRIGGER update_tiendas_updated_at BEFORE UPDATE ON tiendas
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_usuarios_updated_at BEFORE UPDATE ON usuarios
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_productos_updated_at BEFORE UPDATE ON productos
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_variantes_updated_at BEFORE UPDATE ON variantes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_ordenes_updated_at BEFORE UPDATE ON ordenes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE OR REPLACE FUNCTION generate_numero_orden()
RETURNS TRIGGER AS $$
DECLARE
    v_seq BIGINT;
    v_num INTEGER;
BEGIN
    IF NEW.numero_orden IS NULL THEN
        v_seq := nextval('orden_seq');
        v_num := ((v_seq - 1) % 100000) + 1;
        NEW.numero_orden := 'orden-' || LPAD(v_num::TEXT, 5, '0');
    END IF;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE SEQUENCE IF NOT EXISTS orden_seq START 1;

CREATE TRIGGER generate_orden_numero BEFORE INSERT ON ordenes
    FOR EACH ROW EXECUTE FUNCTION generate_numero_orden();

-- =============================================
-- ROW LEVEL SECURITY (RLS)
-- =============================================

-- Habilitar RLS en todas las tablas
ALTER TABLE tiendas ENABLE ROW LEVEL SECURITY;
ALTER TABLE usuarios ENABLE ROW LEVEL SECURITY;
ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;
ALTER TABLE productos ENABLE ROW LEVEL SECURITY;
ALTER TABLE producto_imagenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE variantes ENABLE ROW LEVEL SECURITY;
ALTER TABLE ordenes ENABLE ROW LEVEL SECURITY;
ALTER TABLE orden_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE resenas ENABLE ROW LEVEL SECURITY;
ALTER TABLE stock_movimientos ENABLE ROW LEVEL SECURITY;

-- Políticas básicas (ajustar según necesidades)
-- Permitir lectura pública de productos activos
CREATE POLICY "Productos públicos" ON productos
    FOR SELECT
    USING (activo = TRUE);

-- Los usuarios solo pueden ver datos de su tienda
CREATE POLICY "Usuarios ver su tienda" ON productos
    FOR ALL
    USING (tienda_id IN (
        SELECT tienda_id FROM usuarios WHERE id = auth.uid()
    ));

-- =============================================
-- DATOS INICIALES DE EJEMPLO
-- =============================================

-- Insertar talles estándar
INSERT INTO talles (tienda_id, nombre, codigo, orden) VALUES
(NULL, 'Extra Small', 'XS', 1),
(NULL, 'Small', 'S', 2),
(NULL, 'Medium', 'M', 3),
(NULL, 'Large', 'L', 4),
(NULL, 'Extra Large', 'XL', 5),
(NULL, 'XXL', 'XXL', 6);

-- Insertar colores básicos
INSERT INTO colores (tienda_id, nombre, codigo, hex) VALUES
(NULL, 'Negro', 'negro', '#000000'),
(NULL, 'Blanco', 'blanco', '#FFFFFF'),
(NULL, 'Gris', 'gris', '#808080'),
(NULL, 'Azul', 'azul', '#0000FF'),
(NULL, 'Rojo', 'rojo', '#FF0000'),
(NULL, 'Verde', 'verde', '#008000'),
(NULL, 'Amarillo', 'amarillo', '#FFFF00'),
(NULL, 'Rosa', 'rosa', '#FFC0CB'),
(NULL, 'Beige', 'beige', '#F5F5DC');
