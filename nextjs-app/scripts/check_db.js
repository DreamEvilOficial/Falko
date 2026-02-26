const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '..', 'sql', 'urbancdg.db');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
    db.all("SELECT name FROM sqlite_master WHERE type='table';", (err, tables) => {
        if (err) {
            console.error("Error listing tables:", err);
            return;
        }
        console.log("Tables:", tables.map(t => t.name));
        
        db.get("SELECT count(*) as count FROM usuarios", (err, row) => {
            if (err) console.log("Error querying usuarios:", err.message);
            else console.log("Usuarios count:", row.count);
        });

        db.get("SELECT count(*) as count FROM productos", (err, row) => {
            if (err) console.log("Error querying productos:", err.message);
            else console.log("Productos count:", row.count);
        });
    });
});

db.close();
