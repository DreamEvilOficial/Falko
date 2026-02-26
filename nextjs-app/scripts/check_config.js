const path = require('path');
const sqlite3 = require('sqlite3').verbose();

const dbPath = path.join(__dirname, '..', '..', 'sql', 'urbancdg.db');
const db = new sqlite3.Database(dbPath);

console.log('=== Checking Configuration Data ===\n');

db.all('SELECT clave, valor FROM configuracion', (err, rows) => {
  if (err) {
    console.error('Error:', err);
  } else {
    console.log('Configuration entries:', rows.length);
    rows.forEach(row => {
      console.log(`\n${row.clave}:`);
      try {
        const parsed = JSON.parse(row.valor);
        console.log('  ', JSON.stringify(parsed));
      } catch {
        console.log('  ', row.valor);
      }
    });
  }
  
  console.log('\n=== Checking Banners ===\n');
  db.all('SELECT * FROM banners', (err, banners) => {
    if (err) {
      console.error('Error:', err);
    } else {
      console.log('Banners count:', banners.length);
      if (banners.length > 0) {
        console.log(JSON.stringify(banners, null, 2));
      }
    }
    db.close();
  });
});
