const { Pool } = require('pg');
require('dotenv').config();

async function checkSchema() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    const res = await pool.query(`
      SELECT table_name, column_name, data_type 
      FROM information_schema.columns 
      WHERE table_schema = 'public' 
      ORDER BY table_name, ordinal_position;
    `);
    
    console.log('--- Current DB Schema ---');
    res.rows.forEach(row => {
      console.log(`${row.table_name}.${row.column_name}: ${row.data_type}`);
    });
  } catch (err) {
    console.error('Error checking schema:', err);
  } finally {
    await pool.end();
  }
}

checkSchema();
