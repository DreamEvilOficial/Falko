const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const connectionString = process.env.DATABASE_URL;

if (!connectionString) {
  console.error('❌ DATABASE_URL no está definida en .env');
  process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
});

async function createAdmin() {
  const client = await pool.connect();
  try {
    console.log('🔌 Conectado a la base de datos...');

    // 1. Agregar columna 'usuario' si no existe
    try {
      await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS usuario VARCHAR(255)');
      console.log('✅ Columna "usuario" verificada.');
    } catch (e) {
      console.log('⚠️ No se pudo agregar columna usuario (quizás ya existe):', e.message);
    }

    // 2. Agregar índice único para usuario si no existe
    try {
        // Intentar crear índice único (fallará si hay duplicados nulos, pero para admin está bien)
        // Mejor solo lo creamos si no existe, pero PG no tiene CREATE INDEX IF NOT EXISTS en versiones viejas.
        // Supabase suele ser PG 15+, así que IF NOT EXISTS funciona.
        await client.query('CREATE UNIQUE INDEX IF NOT EXISTS idx_usuarios_usuario ON usuarios(usuario)');
    } catch (e) {
        console.log('⚠️ Aviso sobre índice:', e.message);
    }

    // 3. Agregar columna 'contrasena' si no existe (por compatibilidad)
    try {
      await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS contrasena VARCHAR(255)');
       console.log('✅ Columna "contrasena" verificada.');
    } catch (e) {
       console.log('⚠️ No se pudo agregar columna contrasena:', e.message);
    }
    
    // 4. Asegurar columna 'admin' (booleano)
    try {
       await client.query('ALTER TABLE usuarios ADD COLUMN IF NOT EXISTS admin BOOLEAN DEFAULT FALSE');
    } catch (e) {}

    const username = 'admin';
    const password = 'Omega10';
    const hashedPassword = bcrypt.hashSync(password, 10);
    const email = 'admin@urban.com'; 

    // Buscar usuario existente
    const res = await client.query('SELECT * FROM usuarios WHERE usuario = $1 OR email = $2', [username, email]);
    
    if (res.rows.length > 0) {
      console.log(`🔄 Usuario encontrado (ID: ${res.rows[0].id}). Actualizando...`);
      await client.query(`
        UPDATE usuarios 
        SET usuario = $1, 
            password_hash = $2, 
            rol = 'admin', 
            admin = TRUE,
            activo = TRUE
        WHERE id = $3
      `, [username, hashedPassword, res.rows[0].id]);
      console.log('✅ Usuario admin actualizado exitosamente.');
    } else {
      console.log('🆕 Creando nuevo usuario admin...');
      await client.query(`
        INSERT INTO usuarios (usuario, email, password_hash, rol, nombre, activo, admin, created_at)
        VALUES ($1, $2, $3, 'admin', 'Administrador', TRUE, TRUE, NOW())
      `, [username, email, hashedPassword]);
      console.log('✅ Usuario admin creado exitosamente.');
    }

  } catch (error) {
    console.error('❌ Error crítico:', error);
  } finally {
    client.release();
    pool.end();
  }
}

createAdmin();
