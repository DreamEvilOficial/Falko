// Inicializa la base de datos y storage en Supabase usando envs
const fs = require('fs')
const path = require('path')
require('dotenv').config()
const { Pool } = require('pg')
const { createClient } = require('@supabase/supabase-js')

async function main() {
  const dbUrl = process.env.DATABASE_URL
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

  if (!dbUrl) throw new Error('Falta DATABASE_URL en variables de entorno')
  const canUseStorage = !!(supabaseUrl && serviceKey)

  const pool = new Pool({
    connectionString: dbUrl,
    ssl: { rejectUnauthorized: false },
  })
  const supabase = canUseStorage ? createClient(supabaseUrl, serviceKey) : null

  const schemaPath = path.resolve(__dirname, '..', '..', 'supabase', 'schema.sql')
  const configPath = path.resolve(__dirname, '..', '..', 'configurar_database.sql')
  const compatPath = path.resolve(__dirname, '..', '..', 'supabase', 'compat_schema.sql')

  const schemaSql = fs.readFileSync(schemaPath, 'utf8')
  const configSql = fs.existsSync(configPath) ? fs.readFileSync(configPath, 'utf8') : ''
  const compatSql = fs.readFileSync(compatPath, 'utf8')

  console.log('Aplicando esquema principal...')
  try {
    await pool.query(schemaSql)
    console.log('✓ Esquema aplicado')
  } catch (e) {
    const msg = String(e.message || '')
    if (msg.includes('already exists')) {
      console.log('↺ Esquema ya aplicado; continuando')
    } else {
      throw e
    }
  }

  if (configSql.trim().length > 0) {
    console.log('Aplicando configuración base...')
    try {
      await pool.query(configSql)
      console.log('✓ Configuración aplicada')
    } catch (e) {
      const msg = String(e.message || '')
      if (msg.includes('already exists')) {
        console.log('↺ Configuración ya aplicada; continuando')
      } else {
        throw e
      }
    }
  }
  
  console.log('Aplicando esquema de compatibilidad (tablas esperadas por la app)...')
  await pool.query(compatSql)
  console.log('✓ Compatibilidad aplicada')

  if (canUseStorage) {
    console.log('Creando buckets de Storage...')
    try {
      await supabase.storage.createBucket('productos', { public: true })
    } catch (e) {
      if (!String(e.message || '').includes('already exists')) throw e
    }
    try {
      await supabase.storage.createBucket('tiendas', { public: true })
    } catch (e) {
      if (!String(e.message || '').includes('already exists')) throw e
    }
    try {
      await supabase.storage.createBucket('avatares', { public: true })
    } catch (e) {
      if (!String(e.message || '').includes('already exists')) throw e
    }
    console.log('✓ Buckets asegurados')
  } else {
    console.log('Saltando creación de buckets: faltan NEXT_PUBLIC_SUPABASE_URL o SUPABASE_SERVICE_ROLE_KEY')
  }

  await pool.end()
  console.log('✓ Inicialización completa')
}

main().catch(err => {
  console.error('Error en setup-supabase:', err)
  process.exit(1)
})
