
const { createClient } = require('@supabase/supabase-js');
const { Pool } = require('pg');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const dbUrl = process.env.DATABASE_URL; // Para consultas SQL directas si hace falta

if (!supabaseUrl || !serviceKey) {
  console.error('Error: Faltan variables de entorno NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceKey);

async function setupStorage() {
  console.log('--- Configurando Storage ---');
  const buckets = ['productos', 'banners', 'tiendas', 'avatares'];

  for (const bucket of buckets) {
    const { data, error } = await supabase.storage.getBucket(bucket);
    
    if (error && error.message.includes('not found')) {
      console.log(`Creando bucket: ${bucket}`);
      const { error: createError } = await supabase.storage.createBucket(bucket, {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ['image/png', 'image/jpeg', 'image/webp', 'image/gif']
      });
      if (createError) console.error(`Error creando bucket ${bucket}:`, createError.message);
      else console.log(`Bucket ${bucket} creado.`);
    } else if (data) {
      console.log(`Bucket ${bucket} ya existe.`);
      // Asegurar que sea público
      if (!data.public) {
        console.log(`Actualizando ${bucket} a público...`);
        await supabase.storage.updateBucket(bucket, { public: true });
      }
    }
  }

  // Políticas de Storage (SQL es más confiable para esto)
  // Usaremos el cliente de PG si está disponible, sino intentaremos vía RPC o asumiremos que se configuran manual
  // Pero para buckets públicos, la lectura ya debería funcionar si "public: true".
  // La escritura requiere policies.
}

async function setupRLS(pool) {
    console.log('\n--- Configurando RLS y Políticas de Base de Datos ---');
    
    const queries = [
        // Habilitar RLS en productos
        `ALTER TABLE IF EXISTS productos ENABLE ROW LEVEL SECURITY;`,
        
        // Política de lectura pública para productos
        `DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'productos' AND policyname = 'Lectura pública de productos'
            ) THEN
                CREATE POLICY "Lectura pública de productos" ON productos FOR SELECT USING (true);
            END IF;
        END $$;`,

        // Política de lectura pública para storage objects (para ver imágenes)
        `DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Public Access'
            ) THEN
                CREATE POLICY "Public Access" ON storage.objects FOR SELECT USING ( bucket_id IN ('productos', 'banners', 'tiendas', 'avatares') );
            END IF;
        END $$;`,

         // Política de escritura autenticada para storage objects
        `DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Upload'
            ) THEN
                CREATE POLICY "Authenticated Upload" ON storage.objects FOR INSERT WITH CHECK ( auth.role() = 'authenticated' );
            END IF;
        END $$;`,
        
        // Política de actualización autenticada para storage objects
        `DO $$ 
        BEGIN
            IF NOT EXISTS (
                SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage' AND policyname = 'Authenticated Update'
            ) THEN
                CREATE POLICY "Authenticated Update" ON storage.objects FOR UPDATE USING ( auth.role() = 'authenticated' );
            END IF;
        END $$;`
    ];

    for (const query of queries) {
        try {
            await pool.query(query);
            console.log('Política aplicada/verificada.');
        } catch (e) {
            console.error('Error aplicando política:', e.message);
        }
    }
}

async function main() {
  await setupStorage();
  
  if (dbUrl) {
      const pool = new Pool({
          connectionString: dbUrl,
          ssl: { rejectUnauthorized: false }
      });
      await setupRLS(pool);
      await pool.end();
  } else {
      console.log('Saltando configuración SQL de políticas (falta DATABASE_URL), asegúrate de que los buckets sean públicos.');
  }
}

main();
