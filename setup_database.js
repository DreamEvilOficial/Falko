const { Client } = require('pg');

const connectionString = 'postgresql://postgres:Omega101998%40%23@db.ybxhrcclufxpfraxpvdl.supabase.co:5432/postgres';

async function setupDatabase() {
  const client = new Client({
    connectionString: connectionString,
  });

  try {
    await client.connect();
    console.log('✅ Conectado a PostgreSQL');

    // Crear tablas si no existen
    console.log('📦 Creando tablas...');
    
    // Tabla configuracion
    await client.query(`
      CREATE TABLE IF NOT EXISTS configuracion (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        clave VARCHAR(100) UNIQUE NOT NULL,
        valor JSONB NOT NULL,
        descripcion TEXT,
        tipo VARCHAR(50) DEFAULT 'general',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `);

    // Tabla banners
    await client.query(`
      CREATE TABLE IF NOT EXISTS banners (
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
    `);

    console.log('✅ Tablas creadas');

    // Configurar RLS
    console.log('🔐 Configurando RLS...');
    
    await client.query('ALTER TABLE configuracion ENABLE ROW LEVEL SECURITY;');
    await client.query('ALTER TABLE banners ENABLE ROW LEVEL SECURITY;');
    
    // Políticas para configuracion
    await client.query(`
      DROP POLICY IF EXISTS "Configuración pública" ON configuracion;
      CREATE POLICY "Configuración pública" ON configuracion FOR SELECT USING (true);
    `);
    
    await client.query(`
      DROP POLICY IF EXISTS "Configuración escritura" ON configuracion;
      CREATE POLICY "Configuración escritura" ON configuracion FOR ALL USING (true);
    `);
    
    // Políticas para banners
    await client.query(`
      DROP POLICY IF EXISTS "Banners activos públicos" ON banners;
      CREATE POLICY "Banners activos públicos" ON banners FOR SELECT USING (activo = true);
    `);
    
    await client.query(`
      DROP POLICY IF EXISTS "Banners escritura" ON banners;
      CREATE POLICY "Banners escritura" ON banners FOR ALL USING (true);
    `);

    console.log('✅ RLS configurado');

    // Insertar configuración inicial
    console.log('📝 Insertando configuración inicial...');
    
    const configData = [
      {
        clave: 'anuncio_1',
        valor: JSON.stringify(''),
        descripcion: 'Primer mensaje del slider de anuncios'
      },
      {
        clave: 'anuncio_2', 
        valor: JSON.stringify(''),
        descripcion: 'Segundo mensaje del slider de anuncios'
      },
      {
        clave: 'anuncio_3',
        valor: JSON.stringify(''),
        descripcion: 'Tercer mensaje del slider de anuncios'
      },
      {
        clave: 'banner_urls',
        valor: JSON.stringify([
          {
            "url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
            "link": "/productos"
          },
          {
            "url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop", 
            "link": "/ofertas"
          }
        ]),
        descripcion: 'URLs de los banners principales'
      },
      {
        clave: 'hero_banner_url',
        valor: JSON.stringify('https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop'),
        descripcion: 'Banner principal del hero'
      },
      {
        clave: 'mercadopago_public_key',
        valor: JSON.stringify('TEST-ejemplo'),
        descripcion: 'Clave pública de MercadoPago'
      }
    ];

    for (const config of configData) {
      await client.query(`
        INSERT INTO configuracion (clave, valor, descripcion)
        VALUES ($1, $2, $3)
        ON CONFLICT (clave) 
        DO UPDATE SET 
          valor = EXCLUDED.valor,
          descripcion = EXCLUDED.descripcion,
          updated_at = NOW();
      `, [config.clave, config.valor, config.descripcion]);
    }

    // Insertar banners de ejemplo
    console.log('🖼️ Insertando banners...');
    
    const bannersData = [
      {
        titulo: 'Nueva Colección',
        subtitulo: 'Descubre las últimas tendencias',
        imagen_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
        link_url: '/productos',
        link_texto: 'Ver productos',
        orden: 1
      },
      {
        titulo: 'Ofertas Especiales',
        subtitulo: 'Hasta 50% de descuento',
        imagen_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop',
        link_url: '/ofertas',
        link_texto: 'Ver ofertas', 
        orden: 2
      }
    ];

    for (const banner of bannersData) {
      await client.query(`
        INSERT INTO banners (titulo, subtitulo, imagen_url, link_url, link_texto, orden)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT DO NOTHING;
      `, [banner.titulo, banner.subtitulo, banner.imagen_url, banner.link_url, banner.link_texto, banner.orden]);
    }

    console.log('✅ Configuración completada');
    console.log('🎉 Base de datos lista para usar');

  } catch (error) {
    console.error('❌ Error:', error);
  } finally {
    await client.end();
  }
}

setupDatabase();