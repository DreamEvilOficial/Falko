const { Pool } = require('pg');
require('dotenv').config();

async function migrate() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  });

  try {
    console.log('🚀 Starting migration to "variantes" table...');
    
    // 1. Check if unique constraint exists, if not create it
    try {
        await pool.query(`
            ALTER TABLE variantes 
            ADD CONSTRAINT variantes_producto_talle_color_key UNIQUE (producto_id, talle, color_hex);
        `);
        console.log('✅ Added unique constraint.');
    } catch (e) {
        console.log('ℹ️ Unique constraint might already exist or failed:', e.message);
    }

    // 2. Fetch products
    const res = await pool.query('SELECT id, variantes FROM productos WHERE variantes IS NOT NULL');
    console.log(`📦 Found ${res.rowCount} products with variants.`);

    let inserted = 0;

    for (const p of res.rows) {
        let variants = p.variantes;
        if (typeof variants === 'string') {
            try { variants = JSON.parse(variants); } catch (e) { continue; }
        }
        
        if (!Array.isArray(variants)) continue;

        for (const v of variants) {
            // Validar datos mínimos
            if (!v.talle || !v.color) continue;
            
            const colorHex = v.color; // In JSON, color is often the hex
            const colorName = v.color_nombre || v.color; // Fallback to hex if no name
            const stock = parseInt(v.stock || '0');
            
            // Generate SKU if missing
            // Format: ID_PREFIX-TALLE-COLORHEX_LAST4
            const cleanHex = colorHex.replace('#', '').substring(0,6);
            const sku = v.sku || `${p.id.substring(0,8)}-${v.talle}-${cleanHex}`.toUpperCase();

            try {
                await pool.query(`
                    INSERT INTO variantes (
                        producto_id, talle, color, color_hex, stock, sku, activo, created_at, updated_at
                    ) VALUES ($1, $2, $3, $4, $5, $6, true, NOW(), NOW())
                    ON CONFLICT (producto_id, talle, color_hex) 
                    DO UPDATE SET 
                        stock = EXCLUDED.stock,
                        updated_at = NOW()
                `, [
                    p.id, 
                    v.talle, 
                    colorName, 
                    colorHex, 
                    stock, 
                    sku
                ]);
                inserted++;
            } catch (err) {
                console.error(`❌ Error inserting variant for Product ${p.id}: ${err.message}`);
            }
        }
    }
    
    console.log(`✅ Migration finished. Inserted/Updated ${inserted} variants.`);

  } catch (err) {
    console.error('❌ Fatal error:', err);
  } finally {
    await pool.end();
  }
}

migrate();
