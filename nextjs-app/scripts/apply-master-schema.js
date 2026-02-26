const fs = require('fs');
const path = require('path');
require('dotenv').config();
const { Pool } = require('pg');

async function main() {
  const dbUrl = process.env.DATABASE_URL;

  if (!dbUrl) {
    console.error('❌ Falta DATABASE_URL en variables de entorno');
    process.exit(1);
  }

  console.log('Connecting to database...');
  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  });

  const masterSchemaPath = path.resolve(__dirname, '..', '..', 'database', 'MASTER-SCHEMA.sql');
  
  if (!fs.existsSync(masterSchemaPath)) {
    console.error(`❌ No se encontró el archivo MASTER-SCHEMA.sql en: ${masterSchemaPath}`);
    process.exit(1);
  }

  const schemaSql = fs.readFileSync(masterSchemaPath, 'utf8');

  console.log('Aplicando Esquema Maestro Consolidado...');
  try {
    // Dividir por punto y coma para ejecutar sentencias individualmente si es necesario, 
    // pero pg pool.query puede manejar múltiples sentencias si están separadas correctamente.
    // Sin embargo, para mayor seguridad con extensiones y políticas, a veces es mejor separar.
    // Vamos a intentar ejecutar todo el bloque primero.
    await pool.query(schemaSql);
    console.log('✅ Esquema Maestro aplicado con éxito');
  } catch (e) {
    console.error('❌ Error al aplicar el esquema:', e.message);
    
    // Si falla, intentamos reportar dónde falló
    if (e.position) {
      const start = Math.max(0, e.position - 50);
      const end = Math.min(schemaSql.length, e.position + 50);
      console.error('Contexto del error:', schemaSql.substring(start, end));
    }
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main().catch(err => {
  console.error('Error fatal:', err);
  process.exit(1);
});
