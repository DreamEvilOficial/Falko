-- Shipping Sender Profiles
CREATE TABLE IF NOT EXISTS shipping_senders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    nombre VARCHAR(255) NOT NULL,
    calle VARCHAR(255) NOT NULL,
    numero VARCHAR(50) NOT NULL,
    piso VARCHAR(50),
    departamento VARCHAR(50),
    localidad VARCHAR(255) NOT NULL,
    provincia VARCHAR(255) NOT NULL,
    codigo_postal VARCHAR(20) NOT NULL,
    telefono VARCHAR(50),
    email VARCHAR(255),
    es_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Shipping History
CREATE TABLE IF NOT EXISTS shipping_history (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
    tracking_number VARCHAR(100),
    label_url TEXT,
    estado VARCHAR(50) DEFAULT 'generated', -- generated, printed, shipped, delivered
    carrier VARCHAR(50) DEFAULT 'correo_argentino',
    costo DECIMAL(12, 2),
    datos_remitente JSONB, -- Snapshot of sender data
    datos_destinatario JSONB, -- Snapshot of receiver data
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- RLS Policies
ALTER TABLE shipping_senders ENABLE ROW LEVEL SECURITY;
ALTER TABLE shipping_history ENABLE ROW LEVEL SECURITY;

-- Allow admin full access
CREATE POLICY "Admin access senders" ON shipping_senders FOR ALL USING (true);
CREATE POLICY "Admin access history" ON shipping_history FOR ALL USING (true);
