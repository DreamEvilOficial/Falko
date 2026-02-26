import { NextResponse } from 'next/server';
import db from '@/lib/db';

export const dynamic = 'force-dynamic';

export async function GET() {
    try {
        const sql = `
            DO $$
            BEGIN
                -- 1. Create table for variants if not exists
                CREATE TABLE IF NOT EXISTS variantes_producto (
                    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
                    producto_id UUID REFERENCES productos(id) ON DELETE CASCADE,
                    talla TEXT NOT NULL,
                    color TEXT NOT NULL,
                    sku TEXT,
                    stock INT DEFAULT 0,
                    precio_extra NUMERIC(10,2) DEFAULT 0,
                    created_at TIMESTAMPTZ DEFAULT NOW(),
                    updated_at TIMESTAMPTZ DEFAULT NOW(),
                    UNIQUE(producto_id, talla, color)
                );

                -- 2. Create index for faster lookups
                CREATE INDEX IF NOT EXISTS idx_variantes_producto_id ON variantes_producto(producto_id);

                -- 3. Create function and trigger for SKU generation
                -- Drop first to allow updates to function logic if needed
                DROP TRIGGER IF EXISTS trigger_generate_variant_sku ON variantes_producto;
                
                -- Check if function exists before creating (or just CREATE OR REPLACE)
            END $$;
        `;

        await db.run(sql);

        // Separate raw execution for function definition to avoid $$ nesting issues if any, 
        // though strictly standard Postgres allows it. Let's do it safely.
        await db.run(`
            CREATE OR REPLACE FUNCTION generate_variant_sku()
            RETURNS TRIGGER AS $func$
            BEGIN
                IF NEW.sku IS NULL OR NEW.sku = '' THEN
                    -- Generate SKU: PROD_UUID_PREFIX-TALLA-COLOR
                    -- Taking first 8 chars of UUID to keep it shorter
                    NEW.sku := substring(NEW.producto_id::text from 1 for 8) || '-' || NEW.talla || '-' || NEW.color;
                END IF;
                RETURN NEW;
            END;
            $func$ LANGUAGE plpgsql;
        `);

        await db.run(`
            DROP TRIGGER IF EXISTS trigger_generate_variant_sku ON variantes_producto;
            CREATE TRIGGER trigger_generate_variant_sku
            BEFORE INSERT ON variantes_producto
            FOR EACH ROW
            EXECUTE FUNCTION generate_variant_sku();
        `);

        // DATA MIGRATION
        // 1. Fetch all products
        const products = await db.all('SELECT id, variantes FROM productos WHERE variantes IS NOT NULL');
        
        let migratedCount = 0;
        let errorCount = 0;

        for (const p of products) {
            try {
                let variants = p.variantes;
                if (typeof variants === 'string') {
                    try {
                        variants = JSON.parse(variants);
                    } catch (e) {
                        continue; // Invalid JSON
                    }
                }

                if (Array.isArray(variants)) {
                    for (const v of variants) {
                        if (v.talle && v.color) {
                            // Insert variant
                            // Use ON CONFLICT to avoid errors on re-run
                            await db.run(`
                                INSERT INTO variantes_producto (producto_id, talla, color, stock)
                                VALUES ($1, $2, $3, $4)
                                ON CONFLICT (producto_id, talla, color) 
                                DO UPDATE SET stock = EXCLUDED.stock, updated_at = NOW()
                            `, [p.id, v.talle, v.color, v.stock || 0]);
                            migratedCount++;
                        }
                    }
                }
            } catch (err) {
                console.error(`Error migrating product ${p.id}:`, err);
                errorCount++;
            }
        }

        return NextResponse.json({ 
            success: true, 
            message: 'Variants table setup and migration complete',
            migrated_variants: migratedCount,
            errors: errorCount
        });

    } catch (error: any) {
        console.error('Migration error:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
