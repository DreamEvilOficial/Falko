const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const crypto = require('crypto');

const dbPath = path.join(__dirname, '..', 'sql', 'urbancdg.db');
const db = new sqlite3.Database(dbPath);

console.log('Seeding database at:', dbPath);

function uuidv4() {
  return crypto.randomUUID ? crypto.randomUUID() : 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    var r = Math.random() * 16 | 0, v = c == 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

function run(sql, params = []) {
    return new Promise((resolve, reject) => {
        db.run(sql, params, function(err) {
            if (err) reject(err);
            else resolve(this);
        });
    });
}

const seedData = async () => {
  try {
      // 1. Categories
      console.log('Seeding categories...');
      const cats = [
          { id: uuidv4(), nombre: 'Remeras', slug: 'remeras', orden: 1 },
          { id: uuidv4(), nombre: 'Buzos', slug: 'buzos', orden: 2 },
          { id: uuidv4(), nombre: 'Pantalones', slug: 'pantalones', orden: 3 },
          { id: uuidv4(), nombre: 'Accesorios', slug: 'accesorios', orden: 4 }
      ];

      for (const cat of cats) {
        await run(`INSERT OR IGNORE INTO categorias (id, nombre, slug, orden, activo) VALUES (?, ?, ?, ?, 1)`,
            [cat.id, cat.nombre, cat.slug, cat.orden]
        );
      }

      // 2. Products (Examples with discounts)
      console.log('Seeding products...');
      const products = [
          {
              nombre: 'Remera Oversize Basic',
              slug: 'remera-oversize-basic',
              descripcion: 'Remera de algodón premium, corte oversize.',
              precio: 15000,
              precio_original: 18000,
              descuento_porcentaje: 15,
              stock_actual: 50,
              categoria_id: cats[0].id,
              imagen_url: 'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800&q=80',
              destacado: 1,
              top: 1
          },
          {
              nombre: 'Buzo Hoodie Street',
              slug: 'buzo-hoodie-street',
              descripcion: 'Hoodie con frisa invisible, ideal para el invierno.',
              precio: 35000,
              precio_original: 45000,
              descuento_porcentaje: 22,
              stock_actual: 30,
              categoria_id: cats[1].id,
              imagen_url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&q=80',
              destacado: 1,
              top: 0
          },
          {
              nombre: 'Cargo Pants Black',
              slug: 'cargo-pants-black',
              descripcion: 'Pantalón cargo con múltiples bolsillos.',
              precio: 28000,
              stock_actual: 25,
              categoria_id: cats[2].id,
              imagen_url: 'https://images.unsplash.com/photo-1517438476312-10d79c077509?w=800&q=80',
              destacado: 0,
              top: 1
          }
      ];

      for (const p of products) {
         await run(`
            INSERT OR IGNORE INTO productos (
                id, nombre, slug, descripcion, precio, precio_original, descuento_porcentaje,
                stock_actual, categoria_id, imagen_url, destacado, top, imagenes, variantes, activo
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
         `, [
             uuidv4(), p.nombre, p.slug, p.descripcion, p.precio, p.precio_original, p.descuento_porcentaje,
             p.stock_actual, p.categoria_id, p.imagen_url, p.destacado, p.top, JSON.stringify([]), JSON.stringify([])
         ]);
      }

      // 3. Banners
      console.log('Seeding banners...');
      const banners = [
          {
             titulo: 'Nueva Colección',
             subtitulo: 'Descubre las últimas tendencias',
             imagen_url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1200&h=600&fit=crop',
             link_url: '/productos',
             link_texto: 'Ver productos',
             orden: 1 
          },
          {
             titulo: 'Ofertas Especiales',
             subtitulo: 'Hasta 50% de descuento',
             imagen_url: 'https://images.unsplash.com/photo-1445205170230-053b83016050?w=1200&h=600&fit=crop',
             link_url: '/ofertas',
             link_texto: 'Ver ofertas',
             orden: 2
          }
      ];

      for (const b of banners) {
          await run(`
             INSERT OR IGNORE INTO banners (id, titulo, subtitulo, imagen_url, link_url, link_texto, orden, activo)
             VALUES (?, ?, ?, ?, ?, ?, ?, 1)
          `, [uuidv4(), b.titulo, b.subtitulo, b.imagen_url, b.link_url, b.link_texto, b.orden]);
      }
      
      // Update Config Strings from previous setup
      console.log('Updating Config...');
      await run(`INSERT OR IGNORE INTO configuracion (id, clave, valor) VALUES (?, 'anuncio_1', ?)`, [uuidv4(), JSON.stringify('🔥 EN TRANSFERENCIA - MYSTERY BOXES CON 70% OFF')]);
      await run(`INSERT OR IGNORE INTO configuracion (id, clave, valor) VALUES (?, 'anuncio_2', ?)`, [uuidv4(), JSON.stringify('HASTA 6 CUOTAS SIN INTERÉS')]);
      await run(`INSERT OR IGNORE INTO configuracion (id, clave, valor) VALUES (?, 'anuncio_3', ?)`, [uuidv4(), JSON.stringify('10% EN TRANSFERENCIAS')]);

      console.log('Seeding complete.');

  } catch (err) {
      console.error('Seeding error:', err);
  } finally {
      db.close();
  }
};

seedData();
