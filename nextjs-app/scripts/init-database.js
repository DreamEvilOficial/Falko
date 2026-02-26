// Script para inicializar la base de datos de Supabase
// Ejecutar con: node scripts/init-database.js

const { createClient } = require('@supabase/supabase-js');

async function initDatabase() {
  console.log('🚀 Inicializando base de datos...');
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://ybxhrcclufxpfraxpvdl.supabase.co';
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGhyY2NsdWZ4cGZyYXhwdmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTk3NzYsImV4cCI6MjA4MDM3NTc3Nn0.J1YXv0v63CwvKY9X78ftqJ4sHlP3m85-9JFlz8jbS6A';
  
  const supabase = createClient(supabaseUrl, supabaseKey);
  
  try {
    // Verificar conexión
    console.log('📡 Verificando conexión...');
    const { data: testData, error: testError } = await supabase
      .from('configuracion')
      .select('count')
      .limit(1);
    
    if (testError && !testError.message.includes('relation "configuracion" does not exist')) {
      throw testError;
    }
    
    console.log('✅ Conexión establecida');
    
    // Datos de configuración para insertar
    const configData = [
      {
        clave: 'anuncio_1',
        valor: '',
        descripcion: 'Primer mensaje del slider de anuncios',
        tipo: 'announcer'
      },
      {
        clave: 'anuncio_2', 
        valor: '',
        descripcion: 'Segundo mensaje del slider de anuncios',
        tipo: 'announcer'
      },
      {
        clave: 'anuncio_3',
        valor: '10% EN TRANSFERENCIAS',
        descripcion: 'Tercer mensaje del slider de anuncios',
        tipo: 'announcer'
      },
      {
        clave: 'banner_urls',
        valor: [
          {
            "url": "https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop",
            "link": "/productos"
          },
          {
            "url": "https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop", 
            "link": "/ofertas"
          }
        ],
        descripcion: 'URLs de los banners principales',
        tipo: 'banner'
      },
      {
        clave: 'hero_banner_url',
        valor: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
        descripcion: 'Banner principal del hero',
        tipo: 'banner'
      },
      {
        clave: 'mercadopago_public_key',
        valor: 'TEST-ejemplo',
        descripcion: 'Clave pública de MercadoPago',
        tipo: 'payment'
      }
    ];
    
    console.log('📝 Insertando configuración...');
    
    // Insertar cada configuración
    for (const config of configData) {
      const { data, error } = await supabase
        .from('configuracion')
        .upsert({
          clave: config.clave,
          valor: config.valor,
          descripcion: config.descripcion,
          tipo: config.tipo
        }, { 
          onConflict: 'clave',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.log(`⚠️ Error insertando ${config.clave}:`, error.message);
      } else {
        console.log(`✅ Configurado: ${config.clave}`);
      }
    }
    
    // Datos de banners
    const bannersData = [
      {
        titulo: 'Nueva Colección',
        subtitulo: 'Descubre las últimas tendencias',
        imagen_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
        link_url: '/productos',
        link_texto: 'Ver productos',
        orden: 1,
        activo: true
      },
      {
        titulo: 'Ofertas Especiales',
        subtitulo: 'Hasta 50% de descuento',
        imagen_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop',
        link_url: '/ofertas',
        link_texto: 'Ver ofertas', 
        orden: 2,
        activo: true
      }
    ];
    
    console.log('🖼️ Insertando banners...');
    
    for (const banner of bannersData) {
      const { data, error } = await supabase
        .from('banners')
        .upsert(banner, { 
          onConflict: 'titulo',
          ignoreDuplicates: false 
        });
      
      if (error) {
        console.log(`⚠️ Error insertando banner ${banner.titulo}:`, error.message);
      } else {
        console.log(`✅ Banner configurado: ${banner.titulo}`);
      }
    }
    
    console.log('🎉 ¡Base de datos inicializada correctamente!');
    console.log('');
    console.log('📋 Resumen:');
    console.log('- Mensajes del announcer slider: ✅');
    console.log('- Banners principales: ✅'); 
    console.log('- Configuración básica: ✅');
    console.log('');
    console.log('🌐 Puedes ver los cambios en: http://localhost:3000');
    
  } catch (error) {
    console.error('❌ Error inicializando base de datos:', error.message);
    console.log('');
    console.log('💡 Posibles soluciones:');
    console.log('1. Verificar que las credenciales de Supabase sean correctas');
    console.log('2. Asegurarse de que las tablas existan en Supabase');
    console.log('3. Verificar las políticas RLS en Supabase');
    console.log('');
    console.log('📖 Ejecuta el script configurar_database.sql en Supabase SQL Editor');
  }
}

// Ejecutar
initDatabase();