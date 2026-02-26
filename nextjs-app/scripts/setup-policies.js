const { Pool } = require('pg');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ No DATABASE_URL found in .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function setupPolicies() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectado a la base de datos...');

    // --- CATEGORIAS ---
    console.log('🔧 Configurando políticas para CATEGORIAS...');
    // Habilitar RLS (por si acaso)
    await client.query(`ALTER TABLE categorias ENABLE ROW LEVEL SECURITY;`);
    
    // Eliminar políticas existentes para evitar duplicados
    await client.query(`DROP POLICY IF EXISTS "Permitir lectura publica de categorias" ON categorias;`);
    await client.query(`DROP POLICY IF EXISTS "Permitir todo a admins en categorias" ON categorias;`);

    // Política de Lectura (Public)
    await client.query(`
      CREATE POLICY "Permitir lectura publica de categorias"
      ON categorias FOR SELECT
      USING (true);
    `);
    console.log('✅ Política de lectura creada.');

    // Política de Escritura (Admin/Service Role - aunque Service Role salta RLS, esto es para usuarios admin logueados si usaran supabase auth)
    // Para simplificar, permitiremos INSERT/UPDATE/DELETE a todos por ahora O solo autenticados.
    // Dado que el usuario usa su propio sistema de auth en 'usuarios', RLS de Supabase Auth no aplica directamente a menos que usemos set_config.
    // PERO, el Service Role Key SIEMPRE salta RLS.
    // El problema es que el cliente 'anon' (usado en db.ts) NO puede escribir si no hay policy.
    // Vamos a permitir escritura 'anon' PERO controlada por la API? No, es peligroso.
    // MEJOR ESTRATEGIA: La API de escritura (POST) usará Service Role explícitamente.
    // La API de lectura (GET) usará cliente Anon con esta política de SELECT true.

    // --- SUBCATEGORIAS ---
    console.log('🔧 Configurando políticas para SUBCATEGORIAS...');
    await client.query(`ALTER TABLE subcategorias ENABLE ROW LEVEL SECURITY;`);
    
    await client.query(`DROP POLICY IF EXISTS "Permitir lectura publica de subcategorias" ON subcategorias;`);

    await client.query(`
      CREATE POLICY "Permitir lectura publica de subcategorias"
      ON subcategorias FOR SELECT
      USING (true);
    `);
    console.log('✅ Política de lectura creada.');
    
    // --- USUARIOS (Para evitar problemas futuros) ---
    console.log('🔧 Configurando políticas para USUARIOS...');
    await client.query(`DROP POLICY IF EXISTS "Permitir lectura publica de usuarios" ON usuarios;`);
     // Permitimos que cualquiera lea usuarios? No, es sensible.
     // Pero el login fallaba.
     // Dejemos usuarios como está, ya arreglamos el login con Service Role.

  } catch (err) {
    console.error('❌ Error:', err);
  } finally {
    client.release();
    pool.end();
  }
}

setupPolicies();