require('dotenv').config({ path: '.env' });
// const fetch = require('node-fetch'); // Removed because Node 24 has native fetch

// Polyfill fetch if needed (for Node < 18, though we are on 24)
// But wait, the project doesn't have node-fetch in dependencies, it uses native fetch.
// So I should remove the require if I want to use native fetch, OR use the one from next/dist/server/web/spec-extension/fetch if accessible, but native is better.
// I will try without require first, relying on Node 24 native fetch.

const API_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

async function runDiagnosis() {
    console.log('🔍 Iniciando diagnóstico de actualización de productos...');
    console.log(`📡 URL API: ${API_URL}`);

    try {
        // 1. Obtener un producto existente para probar
        console.log('\n1. Obteniendo lista de productos...');
        const listRes = await fetch(`${API_URL}/api/products?limit=1`);
        
        if (!listRes.ok) {
            throw new Error(`Error al obtener productos: ${listRes.status} ${listRes.statusText}`);
        }
        
        const products = await listRes.json();
        if (!products || products.length === 0) {
            console.error('❌ No se encontraron productos para probar.');
            return;
        }

        const product = products[0];
        console.log(`✅ Producto encontrado: ${product.nombre} (ID: ${product.id})`);
        console.log(`   Precio actual: ${product.precio}`);

        // 2. Intentar actualizar con precio limpio (number)
        console.log('\n2. Prueba A: Actualización con precio numérico (50000)...');
        const payloadA = {
            id: product.id,
            nombre: product.nombre,
            precio: 50000,
            precio_original: 60000,
            variantes: product.variantes // Keep existing variants to avoid issues
        };

        const resA = await fetch(`${API_URL}/api/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadA)
        });

        const dataA = await resA.json();
        if (resA.ok) {
            console.log('✅ Prueba A exitosa.');
        } else {
            console.error('❌ Prueba A fallida:');
            console.error(JSON.stringify(dataA, null, 2));
        }

        // 3. Intentar actualizar con precio sucio (string con formato)
        console.log('\n3. Prueba B: Actualización con precio string ("$ 50.000")...');
        const payloadB = {
            id: product.id,
            nombre: product.nombre,
            precio: "$ 50.000",
            precio_original: "$ 60.000",
            variantes: product.variantes
        };

        const resB = await fetch(`${API_URL}/api/products/${product.id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payloadB)
        });

        const dataB = await resB.json();
        if (resB.ok) {
            console.log('✅ Prueba B exitosa (El backend sanitizó correctamente).');
        } else {
            console.error('❌ Prueba B fallida (El backend no pudo sanitizar):');
            console.error(JSON.stringify(dataB, null, 2));
        }

    } catch (error) {
        console.error('💥 Error crítico durante el diagnóstico:', error.message);
        if (error.code === 'ECONNREFUSED') {
            console.error('   -> Asegúrate de que el servidor Next.js esté corriendo (npm run dev).');
        }
    }
}

runDiagnosis();
