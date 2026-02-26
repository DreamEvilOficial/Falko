
const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.resolve(__dirname, 'src/lib/database.sqlite');
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.all("PRAGMA table_info(productos)", (err, rows) => {
    if (err) {
      console.error(err);
      return;
    }
    console.log("Columns in productos table:");
    rows.forEach(row => {
      console.log(`- ${row.name} (${row.type})`);
    });
  });
});

db.close();
