
const { Pool } = require('pg');
require('dotenv').config({ path: '.env' }); 

const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

if (!connectionString) {
    console.error('No DATABASE_URL found');
    process.exit(1);
}

const pool = new Pool({
  connectionString,
  ssl: {
    rejectUnauthorized: false
  }
});

async function run() {
  try {
    console.log('Adding imagen_url to variantes table...');
    await pool.query(`ALTER TABLE variantes ADD COLUMN IF NOT EXISTS imagen_url TEXT;`);
    console.log('Successfully added imagen_url column.');
  } catch (err) {
    console.error('Error adding column:', err);
  } finally {
    await pool.end();
  }
}

run();
