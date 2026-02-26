import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { cookies } from 'next/headers';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    // 1. Verificar autenticación (Refuerzo de seguridad)
    const cookieStore = cookies();
    const adminSession = cookieStore.get('admin-session')?.value;
    
    // Only allow in development OR if admin session exists
    if (process.env.NODE_ENV === 'production' && !adminSession) {
        return NextResponse.json({ error: 'No autorizado' }, { status: 401 });
    }

    // SQL consolidado del MASTER-SCHEMA para asegurar columnas críticas
    const sql = `
      DO $$
      BEGIN
        -- 1. Asegurar extensiones
        CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

        -- 2. Corregir tabla DEUDAS
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_apellido') THEN
            ALTER TABLE deudas ADD COLUMN cliente_apellido TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_dni') THEN
            ALTER TABLE deudas ADD COLUMN cliente_dni TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_celular') THEN
            ALTER TABLE deudas ADD COLUMN cliente_celular TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'deudas' AND column_name = 'cliente_direccion') THEN
            ALTER TABLE deudas ADD COLUMN cliente_direccion TEXT;
        END IF;

        -- 3. Corregir tabla RESEÑAS (Normalizar nombres de columnas)
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resenas' AND column_name = 'rating') THEN
            ALTER TABLE resenas RENAME COLUMN rating TO calificacion;
        END IF;
        
        IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resenas' AND column_name = 'usuario_nombre') THEN
            ALTER TABLE resenas RENAME COLUMN usuario_nombre TO cliente_nombre;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resenas' AND column_name = 'comprobante_url') THEN
            ALTER TABLE resenas ADD COLUMN comprobante_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'resenas' AND column_name = 'numero_orden') THEN
            ALTER TABLE resenas ADD COLUMN numero_orden TEXT;
        END IF;

        -- 4. Corregir tabla BANNERS
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'banners' AND column_name = 'tipo') THEN
            ALTER TABLE banners ADD COLUMN tipo VARCHAR(50) DEFAULT 'hero';
        END IF;

        -- 5. Asegurar tabla CONFIGURACION
        CREATE TABLE IF NOT EXISTS configuracion (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            clave VARCHAR(100) UNIQUE NOT NULL,
            valor JSONB,
            descripcion TEXT,
            updated_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- 6. Corregir tabla PRODUCTOS (Nuevos campos y filtros)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'descuento_activo') THEN
            ALTER TABLE productos ADD COLUMN descuento_activo BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'descuento_porcentaje') THEN
            ALTER TABLE productos ADD COLUMN descuento_porcentaje NUMERIC(5,2) DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'precio_original') THEN
            ALTER TABLE productos ADD COLUMN precio_original NUMERIC(10,2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'top') THEN
            ALTER TABLE productos ADD COLUMN top BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'subcategoria_id') THEN
            ALTER TABLE productos ADD COLUMN subcategoria_id UUID REFERENCES subcategorias(id) ON DELETE SET NULL;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'nuevo_lanzamiento') THEN
            ALTER TABLE productos ADD COLUMN nuevo_lanzamiento BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'proximamente') THEN
            ALTER TABLE productos ADD COLUMN proximamente BOOLEAN DEFAULT FALSE;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'proximo_lanzamiento') THEN
            ALTER TABLE productos ADD COLUMN proximo_lanzamiento BOOLEAN DEFAULT FALSE;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'fecha_lanzamiento') THEN
            ALTER TABLE productos ADD COLUMN fecha_lanzamiento TIMESTAMPTZ;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'proveedor_nombre') THEN
            ALTER TABLE productos ADD COLUMN proveedor_nombre TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'proveedor_contacto') THEN
            ALTER TABLE productos ADD COLUMN proveedor_contacto TEXT;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'precio_costo') THEN
            ALTER TABLE productos ADD COLUMN precio_costo NUMERIC(10,2);
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'imagen_url') THEN
            ALTER TABLE productos ADD COLUMN imagen_url TEXT;
        END IF;

        -- 4. Tabla de Notificaciones Proximamente
        CREATE TABLE IF NOT EXISTS proximamente_notificaciones (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
            email TEXT NOT NULL,
            notificado BOOLEAN DEFAULT FALSE,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            UNIQUE(producto_id, email)
        );

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'sku') THEN
            ALTER TABLE productos ADD COLUMN sku TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'metadata') THEN
            ALTER TABLE productos ADD COLUMN metadata JSONB DEFAULT '{}';
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'productos' AND column_name = 'stock_minimo') THEN
            ALTER TABLE productos ADD COLUMN stock_minimo INTEGER DEFAULT 0;
        END IF;

        -- 7. Asegurar tabla ORDENES
        CREATE TABLE IF NOT EXISTS ordenes (
            id UUID PRIMARY KEY,
            numero_orden TEXT NOT NULL,
            cliente_nombre TEXT NOT NULL,
            cliente_email TEXT,
            cliente_telefono TEXT,
            direccion_envio TEXT,
            subtotal NUMERIC(10,2) DEFAULT 0,
            total NUMERIC(10,2) DEFAULT 0,
            envio NUMERIC(10,2) DEFAULT 0,
            descuento NUMERIC(10,2) DEFAULT 0,
            estado TEXT DEFAULT 'pendiente',
            metodo_pago TEXT,
            notas TEXT,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ DEFAULT NOW(),
            pago_id TEXT,
            pago_estado TEXT,
            pago_metodo TEXT,
            factura_url TEXT,
            tracking_code TEXT,
            tracking_url TEXT,
            mercadopago_payment_id TEXT
        );

        -- Asegurar columnas en ORDENES (si la tabla ya existía)
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'metodo_pago') THEN
            ALTER TABLE ordenes ADD COLUMN metodo_pago TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'notas') THEN
            ALTER TABLE ordenes ADD COLUMN notas TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'envio') THEN
            ALTER TABLE ordenes ADD COLUMN envio NUMERIC(10,2) DEFAULT 0;
        END IF;
        
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'direccion_envio') THEN
            ALTER TABLE ordenes ADD COLUMN direccion_envio TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'descuento') THEN
            ALTER TABLE ordenes ADD COLUMN descuento NUMERIC(10,2) DEFAULT 0;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'tracking_code') THEN
            ALTER TABLE ordenes ADD COLUMN tracking_code TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'tracking_url') THEN
            ALTER TABLE ordenes ADD COLUMN tracking_url TEXT;
        END IF;

        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ordenes' AND column_name = 'mercadopago_payment_id') THEN
            ALTER TABLE ordenes ADD COLUMN mercadopago_payment_id TEXT;
        END IF;

        -- 8. Asegurar tabla ORDEN_ITEMS
        CREATE TABLE IF NOT EXISTS orden_items (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            orden_id UUID REFERENCES ordenes(id) ON DELETE CASCADE,
            producto_id UUID REFERENCES productos(id),
            cantidad INTEGER DEFAULT 1,
            precio_unitario NUMERIC(10,2) DEFAULT 0,
            variante_info JSONB DEFAULT '{}'
        );

        -- Asegurar columnas en ORDEN_ITEMS
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'orden_items' AND column_name = 'variante_info') THEN
            ALTER TABLE orden_items ADD COLUMN variante_info JSONB DEFAULT '{}';
        END IF;

        -- 9. Asegurar tabla ADMIN_LOGS
        CREATE TABLE IF NOT EXISTS admin_logs (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            action VARCHAR(100) NOT NULL,
            entity VARCHAR(100) NOT NULL,
            record_id UUID,
            details JSONB DEFAULT '{}',
            created_at TIMESTAMPTZ DEFAULT NOW()
        );

        -- 10. ACTUALIZACIÓN DE STOCK PARA PRUEBAS (SOLO SI ES BAJO)
        UPDATE productos SET stock_actual = 100 WHERE stock_actual < 10;

        -- 11. Asegurar tabla CUPONES
        CREATE TABLE IF NOT EXISTS cupones (
            id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
            codigo VARCHAR(50) NOT NULL UNIQUE,
            tipo VARCHAR(20) NOT NULL, -- 'porcentaje' | 'fijo'
            valor NUMERIC(10,2) NOT NULL,
            descripcion TEXT,
            activo BOOLEAN DEFAULT TRUE,
            minimo_compra NUMERIC(10,2),
            max_uso_total INTEGER,
            usos_actuales INTEGER DEFAULT 0,
            valido_hasta TIMESTAMPTZ,
            created_at TIMESTAMPTZ DEFAULT NOW(),
            updated_at TIMESTAMPTZ
        );

        -- Asegurar columnas en CUPONES
        IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'cupones' AND column_name = 'usos_actuales') THEN
            ALTER TABLE cupones ADD COLUMN usos_actuales INTEGER DEFAULT 0;
        END IF;

      END $$;
    `;

    await db.raw(sql);

    return NextResponse.json({ 
        success: true,
        message: 'Esquema actualizado correctamente con el pool de PostgreSQL'
    });

  } catch (error: any) {
    console.error('Error fixing schema:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
