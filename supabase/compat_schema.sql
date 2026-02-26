-- Compatibilidad de tablas con la app actual (estructura tipo SQLite)
-- Crea solo si no existen

CREATE TABLE IF NOT EXISTS categorias (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  descripcion TEXT,
  imagen_url TEXT,
  icono TEXT,
  activo INTEGER DEFAULT 1,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS subcategorias (
  id TEXT PRIMARY KEY,
  categoria_id TEXT,
  nombre TEXT NOT NULL,
  slug TEXT NOT NULL,
  descripcion TEXT,
  activo INTEGER DEFAULT 1,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(categoria_id, slug)
);

-- Ajustes de compatibilidad sobre la tabla existente de productos
-- Agregar columnas que la app espera cuando no existan
ALTER TABLE productos
  ADD COLUMN IF NOT EXISTS top BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS variantes JSONB DEFAULT '[]';

CREATE INDEX IF NOT EXISTS idx_productos_activo ON productos(activo);
CREATE INDEX IF NOT EXISTS idx_productos_destacado ON productos(destacado);
CREATE INDEX IF NOT EXISTS idx_productos_top ON productos(top);
CREATE INDEX IF NOT EXISTS idx_productos_categoria ON productos(categoria_id);
CREATE INDEX IF NOT EXISTS idx_productos_slug ON productos(slug);

CREATE TABLE IF NOT EXISTS etiquetas (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT,
  color TEXT,
  icono TEXT
);

CREATE TABLE IF NOT EXISTS filtros_especiales (
  id TEXT PRIMARY KEY,
  nombre TEXT NOT NULL,
  tipo TEXT,
  config TEXT, -- JSON en texto
  activo INTEGER DEFAULT 1,
  orden INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS homepage_sections (
  id TEXT PRIMARY KEY,
  titulo TEXT,
  subtitulo TEXT,
  tipo TEXT,
  config TEXT, -- JSON en texto
  orden INTEGER DEFAULT 0,
  activo INTEGER DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS usuarios (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  nombre TEXT,
  rol TEXT DEFAULT 'staff',
  activo INTEGER DEFAULT 1,
  permiso_categorias INTEGER DEFAULT 0,
  permiso_productos INTEGER DEFAULT 0,
  permiso_configuracion INTEGER DEFAULT 0,
  permiso_ordenes INTEGER DEFAULT 0,
  admin INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS ordenes (
  id TEXT PRIMARY KEY,
  numero_orden TEXT,
  cliente_nombre TEXT,
  cliente_email TEXT,
  subtotal REAL,
  total REAL,
  estado TEXT DEFAULT 'pendiente',
  mercadopago_payment_id INTEGER,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS resenas (
  id TEXT PRIMARY KEY,
  producto_id TEXT,
  cliente_nombre TEXT,
  cliente_email TEXT,
  calificacion INTEGER CHECK (calificacion >= 1 AND calificacion <= 5),
  comentario TEXT,
  aprobado BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS deudas (
  id TEXT PRIMARY KEY,
  cliente_nombre TEXT NOT NULL,
  cliente_email TEXT,
  historial TEXT, -- JSON en texto
  total REAL DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);
