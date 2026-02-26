const { Client } = require('pg');

// Using the connection string from .env
const connectionString = 'postgresql://postgres.bxrrldexzibiylgbheen:Chicassexyg3%40@aws-1-sa-east-1.pooler.supabase.com:5432/postgres?sslmode=no-verify';

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

async function run() {
  try {
    await client.connect();
    console.log('Connected to database');
    
    const columns = [
      'activo BOOLEAN DEFAULT TRUE',
      'destacado BOOLEAN DEFAULT FALSE',
      'top BOOLEAN DEFAULT FALSE',
      'nuevo_lanzamiento BOOLEAN DEFAULT FALSE',
      'proximo_lanzamiento BOOLEAN DEFAULT FALSE',
      'proximamente BOOLEAN DEFAULT FALSE',
      'descuento_activo BOOLEAN DEFAULT FALSE',
      'fecha_lanzamiento TIMESTAMP'
    ];

    for (const colDef of columns) {
      try {
        await client.query(`ALTER TABLE productos ADD COLUMN ${colDef}`);
        console.log(`Added ${colDef}`);
      } catch (err) {
        if (err.message.includes('already exists')) {
             console.log(`Column already exists: ${colDef.split(' ')[0]}`);
        } else {
             console.log(`Error adding ${colDef}: ${err.message}`);
        }
      }
    }

  } catch (err) {
    console.error('Connection error', err);
  } finally {
    await client.end();
  }
}

run();
