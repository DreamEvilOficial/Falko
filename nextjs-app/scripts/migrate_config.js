const fs = require('fs');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();

// Correct Paths relative to nextjs-app/scripts (assuming script is run from nextjs-app root or via node scripts/...)
// but we use __dirname so it's safer.
const sqlPath = path.join(__dirname, '..', '..', 'configurar_database.sql');
const dbPath = path.join(__dirname, '..', '..', 'sql', 'urbancdg.db');

const uuidDefault = "(lower(hex(randomblob(4))) || '-' || lower(hex(randomblob(2))) || '-4' || substr(lower(hex(randomblob(2))),2) || '-' || substr('89ab',abs(random()) % 4 + 1, 1) || substr(lower(hex(randomblob(2))),2) || '-' || lower(hex(randomblob(6))))";

// Read SQL
let sqlContent = fs.readFileSync(sqlPath, 'utf8');

function convertToSqlite(sql) {
    let lines = sql.split('\n');
    let newLines = [];

    // Drops to ensure clean state and correct defaults
    newLines.push("DROP TABLE IF EXISTS configuracion;");
    newLines.push("DROP TABLE IF EXISTS banners;");

    for (let line of lines) {
        let l = line.trim();
        if (l.startsWith('--') || l === '') continue;
        if (l.startsWith('CREATE EXTENSION')) continue;
        if (l.toUpperCase().startsWith('ALTER TABLE') && l.includes('ROW LEVEL SECURITY')) continue;
        if (l.toUpperCase().startsWith('DROP POLICY')) continue;
        if (l.toUpperCase().startsWith('CREATE POLICY')) continue;

        // Types
        l = l.replace(/UUID PRIMARY KEY DEFAULT uuid_generate_v4\(\)/gi, `TEXT PRIMARY KEY DEFAULT ${uuidDefault}`);
        l = l.replace(/UUID PRIMARY KEY DEFAULT gen_random_uuid\(\)/gi, `TEXT PRIMARY KEY DEFAULT ${uuidDefault}`);
        l = l.replace(/UUID/gi, 'TEXT');
        l = l.replace(/JSONB/gi, 'TEXT');
        l = l.replace(/BOOLEAN/gi, 'INTEGER');
        l = l.replace(/TIMESTAMP WITH TIME ZONE DEFAULT NOW\(\)/gi, "TEXT DEFAULT (datetime('now'))");
        l = l.replace(/TIMESTAMP WITH TIME ZONE/gi, 'TEXT');
        
        // Data & Functions
        l = l.replace(/NOW\(\)/gi, "datetime('now')");
        l = l.replace(/true/gi, '1');
        l = l.replace(/false/gi, '0');
        
        // Fix UPSERT if necessary. SQLite supports ON CONFLICT(clave) DO UPDATE SET ...
        // Postgres: ON CONFLICT (clave) DO UPDATE SET valor = EXCLUDED.valor
        // SQLite: ON CONFLICT(clave) DO UPDATE SET valor = excluded.valor
        l = l.replace(/EXCLUDED\./gi, 'excluded.');

        newLines.push(l);
    }
    return newLines.join('\n');
}

const sqliteSql = convertToSqlite(sqlContent);
const db = new sqlite3.Database(dbPath);

console.log("Migrating Configuration (configurar_database)...");
db.serialize(() => {
    db.run("PRAGMA foreign_keys = OFF;");
    db.run("BEGIN TRANSACTION;");

    const statements = sqliteSql.split(';');

    statements.forEach(stmt => {
        if (stmt.trim()) {
            db.run(stmt, (err) => {
                if (err) {
                    console.error("Error running statement:", stmt.substring(0, 100));
                    console.error(err.message);
                }
            });
        }
    });

    db.run("COMMIT;", (err) => {
        if (err) console.error("Commit error:", err);
        else console.log("Configuration migration finished successfully.");
    });
});

db.close();
