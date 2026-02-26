const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const fs = require('fs');

const dbPath = path.resolve(__dirname, '../src/lib/urbancd.db');
console.log('DB Path:', dbPath);

if (!fs.existsSync(dbPath)) {
  console.error('Database file not found!');
  process.exit(1);
}

const db = new sqlite3.Database(dbPath);

function runAsync(sql) {
    return new Promise((resolve, reject) => {
        db.run(sql, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

function allAsync(sql) {
    return new Promise((resolve, reject) => {
        db.all(sql, function(err, rows) {
            if (err) reject(err);
            else resolve(rows);
        });
    });
}

async function main() {
    try {
        const rows = await allAsync("PRAGMA table_info(productos)");
        const columns = rows.map(r => r.name);
        console.log('Columns found:', columns);

        if (columns.length === 0) {
            console.error('Table "productos" seems to be empty or does not exist.');
            // Check tables
            const tables = await allAsync("SELECT name FROM sqlite_master WHERE type='table'");
            console.log('Tables in DB:', tables.map(t => t.name));
            return;
        }

        const required = ['descuento_activo', 'nuevo_lanzamiento', 'proximamente', 'proximo_lanzamiento', 'fecha_lanzamiento'];
        const missing = required.filter(c => !columns.includes(c));

        if (missing.length > 0) {
            console.log('Missing columns:', missing);
            for (const col of missing) {
                let type = 'BOOLEAN DEFAULT 0';
                if (col === 'fecha_lanzamiento') type = 'TEXT';
                
                console.log(`Adding ${col}...`);
                try {
                    await runAsync(`ALTER TABLE productos ADD COLUMN ${col} ${type}`);
                    console.log(`Added ${col}`);
                } catch (e) {
                    console.error(`Error adding ${col}:`, e.message);
                }
            }
        } else {
            console.log('All required columns exist.');
        }

    } catch (err) {
        console.error('Error:', err);
    } finally {
        db.close();
    }
}

main();
