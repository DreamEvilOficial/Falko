import { Pool, QueryResult } from 'pg';
import { supabase, supabaseAdmin } from './supabase';

/**
 * CAPA DE ACCESO A DATOS (DAL) OPTIMIZADA
 */

// FORZAR A NODE.JS A ACEPTAR CERTIFICADOS AUTOFIRMADOS (Común en Supabase/Vercel)
if (process.env.NODE_ENV === 'production') {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
}

const client = supabaseAdmin || supabase;
const connectionString = process.env.DATABASE_URL || process.env.POSTGRES_URL;

// Singleton pattern para evitar saturar conexiones en desarrollo (Hot Reload)
declare global {
  var _postgresPool: Pool | undefined;
}

let pool: Pool | null = null;

if (connectionString) {
  // Limpiar la cadena de conexión de parámetros conflictivos y asegurar sslmode
  let finalConnectionString = connectionString;
  if (!finalConnectionString.includes('sslmode=')) {
    finalConnectionString += (finalConnectionString.includes('?') ? '&' : '?') + 'sslmode=no-verify';
  }

  const poolConfig = {
    connectionString: finalConnectionString,
    ssl: {
      rejectUnauthorized: false
    },
    max: 10, // Reducido para mayor estabilidad en serverless
    idleTimeoutMillis: 20000,
    connectionTimeoutMillis: 15000,
  };

  if (process.env.NODE_ENV === 'production') {
    pool = new Pool(poolConfig);
  } else {
    if (!global._postgresPool) {
      global._postgresPool = new Pool(poolConfig);
      // Solo adjuntar listener de error una vez
      global._postgresPool.on('error', (err) => {
        console.error('❌ Error crítico en Pool de Postgres:', err.message);
      });
    }
    pool = global._postgresPool;
  }
}

if (pool && process.env.NODE_ENV === 'production') {
  pool.on('error', (err) => {
    console.error('❌ Error crítico en Pool de Postgres:', err.message);
  });
}

/**
 * Normaliza SQL de SQLite a PostgreSQL y maneja parámetros
 */
function normalizeSql(sql: string): string {
  let index = 0;
  return sql
    .replace(/\?/g, () => {
      index += 1;
      return `$${index}`;
    })
    .replace(/\bdatetime\('now'\)\b/gi, 'NOW()')
    .replace(/\bCURRENT_TIMESTAMP\b/g, 'NOW()')
    .replace(/(\w+)\s*=\s*1/gi, (match, col) => {
      const lowerCol = col.toLowerCase();
      if (['activo', 'destacado', 'top', 'admin', 'aprobado', 'proximo_lanzamiento', 'nuevo_lanzamiento', 'proximamente', 'descuento_activo'].includes(lowerCol)) {
        return `${col} = TRUE`;
      }
      return match;
    })
    .replace(/(\w+)\s*=\s*0/gi, (match, col) => {
      const lowerCol = col.toLowerCase();
      if (['activo', 'destacado', 'top', 'admin', 'aprobado', 'proximo_lanzamiento', 'nuevo_lanzamiento', 'proximamente', 'descuento_activo'].includes(lowerCol)) {
        return `${col} = FALSE`;
      }
      return match;
    });
}

class Database {
  /**
   * Ejecuta una consulta y devuelve todas las filas
   */
  async all<T = any>(sql: string, params: any[] = [], client: any = null): Promise<T[]> {
    const executor = client || pool;
    if (executor) {
      try {
        const result = await executor.query(normalizeSql(sql), params);
        return result.rows as T[];
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error('❌ Postgres Pool Error (all):', err.message, { sql, params });
        }
        throw err;
      }
    }

    // Fallback a Supabase PostgREST (Limitado a consultas simples)
    if (!client) {
      console.warn('⚠️ Usando fallback de Supabase PostgREST para SELECT');
      return this.fallbackSelect<T>(sql, params);
    }
    return [];
  }

  /**
   * Ejecuta una consulta y devuelve una sola fila
   */
  async get<T = any>(sql: string, params: any[] = [], client: any = null): Promise<T | undefined> {
    const executor = client || pool;
    if (executor) {
      try {
        const result = await executor.query(normalizeSql(sql), params);
        return (result.rows[0] as T) || undefined;
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error('❌ Postgres Pool Error (get):', err.message, { sql, params });
        }
        throw err;
      }
    }

    if (!client) {
      const rows = await this.fallbackSelect<T>(sql, params);
      return rows[0];
    }
    return undefined;
  }

  /**
   * Ejecuta una operación de escritura (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = [], client: any = null): Promise<{ id: any, changes: number }> {
    const executor = client || pool;
    if (executor) {
      try {
        const normalized = normalizeSql(sql);
        // Si es un INSERT, intentamos obtener el ID retornado
        const finalSql = normalized.trim().toUpperCase().startsWith('INSERT') && !normalized.toUpperCase().includes('RETURNING')
          ? `${normalized} RETURNING id` 
          : normalized;
          
        const result = await executor.query(finalSql, params);
        return {
          id: result.rows[0]?.id || null,
          changes: result.rowCount || 0
        };
      } catch (err: any) {
        if (!err.message.includes('already exists')) {
          console.error('❌ Postgres Pool Error (run):', err.message, { sql, params });
        }
        throw err;
      }
    }

    if (!client) {
      console.warn('⚠️ Usando fallback de Supabase PostgREST para DML');
      return this.fallbackDml(sql, params);
    }
    return { id: null, changes: 0 };
  }

  /**
   * Ejecuta SQL crudo (Útil para DDL como CREATE TABLE o ALTER TABLE)
   */
  async raw(sql: string): Promise<QueryResult> {
    if (!pool) throw new Error('Raw SQL requires PostgreSQL Pool');
    try {
      return await pool.query(sql);
    } catch (err: any) {
      if (!err.message.includes('already exists')) {
        console.error('❌ Postgres Pool Error (raw):', err.message, { sql });
      }
      throw err;
    }
  }

  /**
   * Ejecuta una transacción (Solo disponible con Pool)
   */
  async transaction<T>(callback: (client: any) => Promise<T>): Promise<T> {
    if (!pool) {
      throw new Error('Las transacciones requieren una conexión directa a PostgreSQL (Pool)');
    }
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // --- MÉTODOS DE FALLBACK (Privados) ---

  private async fallbackSelect<T>(sql: string, params: any[]): Promise<T[]> {
    if (!client) return [];
    
    const table = this.extractTable(sql);
    if (!table) return [];

    let query = client.from(table).select('*');
    
    // Intento básico de mapear WHERE id = ? o slug = ?
    if (sql.includes('id = ?')) query = query.eq('id', params[0]);
    if (sql.includes('slug = ?')) query = query.eq('slug', params[0]);
    if (sql.includes('activo = TRUE')) query = query.eq('activo', true);
    
    const { data, error } = await query;
    if (error) throw error;
    return (data as T[]) || [];
  }

  private async fallbackDml(sql: string, params: any[]): Promise<{ id: any, changes: number }> {
    if (!client) return { id: null, changes: 0 };
    
    const table = this.extractTable(sql);
    if (!table) return { id: null, changes: 0 };

    const isInsert = sql.toUpperCase().includes('INSERT');
    const isUpdate = sql.toUpperCase().includes('UPDATE');

    if (isInsert) {
      // Implementación simplificada: asume que los parámetros coinciden con las columnas
      // Esto es arriesgado pero es un fallback.
      return { id: null, changes: 0 }; 
    }
    
    return { id: null, changes: 0 };
  }

  private extractTable(sql: string): string | null {
    const match = sql.match(/(?:FROM|INTO|UPDATE)\s+([\w.]+)/i);
    return match ? match[1] : null;
  }
}

const db = new Database();
export default db;
