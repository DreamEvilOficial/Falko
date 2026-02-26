const fs = require('fs')
const path = require('path')
const { Client } = require('pg')

const ROOT_DIR = path.join(__dirname, '..')
const SQL_STEPS = [
  { label: 'estructura principal', relativePath: path.join('database', 'RECREATE-ALL.sql') },
  { label: 'modulo de deudas', relativePath: path.join('database', 'setup_debts.sql') }
]
const DEFAULT_CONNECTION = 'postgresql://postgres:Omega101998%40%23@db.ybxhrcclufxpfraxpvdl.supabase.co:5432/postgres'

function loadEnvMap() {
  const order = ['.env', '.env.database']
  const map = {}

  order.forEach((fileName) => {
    const filePath = path.join(ROOT_DIR, fileName)
    if (!fs.existsSync(filePath)) {
      return
    }

    const content = fs.readFileSync(filePath, 'utf8')
    content.split(/\r?\n/).forEach((line) => {
      let trimmed = line.trim()
      if (!trimmed || trimmed.startsWith('#')) {
        return
      }
      if (trimmed.startsWith('export ')) {
        trimmed = trimmed.slice(7).trim()
      }
      const eqIndex = trimmed.indexOf('=')
      if (eqIndex === -1) {
        return
      }
      const key = trimmed.slice(0, eqIndex).trim()
      let value = trimmed.slice(eqIndex + 1).trim()
      if (!key) {
        return
      }
      if (
        (value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))
      ) {
        value = value.slice(1, -1)
      }
      map[key] = value
    })
  })

  return map
}

function getEnvValue(key, envMap) {
  if (process.env[key] && process.env[key].length) {
    return process.env[key]
  }
  if (envMap[key] && envMap[key].length) {
    return envMap[key]
  }
  return null
}

function extractHost(connectionString) {
  if (!connectionString) {
    return null
  }
  try {
    const url = new URL(connectionString)
    return url.hostname
  } catch (_err) {
    return null
  }
}

function shouldUseSsl(hostCandidate, rawConnectionString, envMap) {
  const sslFlag = (getEnvValue('PG_SSL_MODE', envMap) || getEnvValue('PG_SSL', envMap) || '')
    .toString()
    .trim()
    .toLowerCase()
  if (sslFlag === 'disable' || sslFlag === 'off' || sslFlag === 'false') {
    return false
  }

  if (!hostCandidate && rawConnectionString) {
    hostCandidate = extractHost(rawConnectionString)
  }

  if (!hostCandidate) {
    return true
  }

  return !/localhost|127\.0\.0\.1/i.test(hostCandidate)
}

function buildClientConfig(envMap) {
  const candidates = [
    { value: getEnvValue('PG_CONNECTION_STRING', envMap), source: 'PG_CONNECTION_STRING' },
    { value: getEnvValue('DATABASE_URL', envMap), source: 'DATABASE_URL' },
    { value: getEnvValue('SUPABASE_DB_URL', envMap), source: 'SUPABASE_DB_URL' },
    { value: getEnvValue('SUPABASE_DB_CONNECTION', envMap), source: 'SUPABASE_DB_CONNECTION' }
  ]

  for (const candidate of candidates) {
    if (candidate.value) {
      const config = { connectionString: candidate.value }
      if (shouldUseSsl(null, candidate.value, envMap)) {
        config.ssl = { rejectUnauthorized: false }
      }
      return { config, source: candidate.source }
    }
  }

  const host = getEnvValue('PGHOST', envMap)
  const user = getEnvValue('PGUSER', envMap)
  const database = getEnvValue('PGDATABASE', envMap) || getEnvValue('PGDB', envMap)
  const portRaw = getEnvValue('PGPORT', envMap)
  const password = getEnvValue('PGPASSWORD', envMap)

  if (host && user && database) {
    const port = portRaw ? parseInt(portRaw, 10) || 5432 : 5432
    const config = { host, port, user, database }
    if (password) {
      config.password = password
    }
    if (shouldUseSsl(host, null, envMap)) {
      config.ssl = { rejectUnauthorized: false }
    }
    return { config, source: 'PGHOST/PGUSER/PGDATABASE' }
  }

  const fallback = DEFAULT_CONNECTION
  const config = { connectionString: fallback }
  if (shouldUseSsl(null, fallback, envMap)) {
    config.ssl = { rejectUnauthorized: false }
  }
  return { config, source: 'default connection string (configure PG_CONNECTION_STRING para sobrescribir)' }
}

async function ensurePrerequisites(client) {
  await client.query('CREATE EXTENSION IF NOT EXISTS "pgcrypto";')
  await client.query('CREATE EXTENSION IF NOT EXISTS "uuid-ossp";')

  const { rows } = await client.query(`
    SELECT EXISTS (
      SELECT 1 FROM information_schema.tables
      WHERE table_schema = 'public'
        AND table_name = 'filtros_especiales'
    ) AS exists;
  `)

  if (!rows[0].exists) {
    console.log('[INFO] Creando tabla filtros_especiales temporal para la primera migracion...')
    await client.query(`
      CREATE TABLE filtros_especiales (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        nombre TEXT NOT NULL,
        clave TEXT UNIQUE,
        config JSONB DEFAULT '{}'::jsonb,
        icono TEXT,
        imagen_url TEXT,
        color VARCHAR(50),
        orden INTEGER DEFAULT 0,
        activo BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `)
  }
}

async function executeSqlFile(client, label, relativePath) {
  const filePath = path.join(ROOT_DIR, relativePath)
  if (!fs.existsSync(filePath)) {
    console.warn(`[WARN] No se encontro el archivo SQL: ${relativePath}`)
    return
  }

  let sql = fs.readFileSync(filePath, 'utf8')
  sql = sql.replace(/^\uFEFF/, '').trim()
  if (!sql) {
    console.log(`[INFO] ${relativePath} esta vacio, nada para ejecutar.`)
    return
  }

  console.log(`[INFO] Ejecutando ${label} (${relativePath})...`)
  await client.query(sql)
  console.log(`[OK] ${label} completado.`)
}

async function main() {
  const envMap = loadEnvMap()
  const { config, source } = buildClientConfig(envMap)

  console.log('[INFO] Conectando a la base de datos...')
  const client = new Client(config)

  try {
    await client.connect()
    console.log(`[OK] Conexion establecida usando ${source}.`)

    await ensurePrerequisites(client)

    for (const step of SQL_STEPS) {
      await executeSqlFile(client, step.label, step.relativePath)
    }

    console.log('[DONE] Base de datos lista para usarse.')
  } catch (error) {
    console.error('[ERROR] Fallo al preparar la base de datos:')
    console.error(error)
    process.exitCode = 1
  } finally {
    await client.end().catch(() => {})
  }
}

main()
