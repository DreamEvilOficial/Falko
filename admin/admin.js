/**
 * Admin Panel JavaScript
 * Gestión del panel de administración
 */

let supabase = null;
let currentUser = null;
let currentTienda = null;

// Configuración de Supabase
const SUPABASE_URL = 'https://ybxhrcclufxpfraxpvdl.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGhyY2NsdWZ4cGZyYXhwdmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTk3NzYsImV4cCI6MjA4MDM3NTc3Nn0.J1YXv0v63CwvKY9X78ftqJ4sHlP3m85-9JFlz8jbS6A';

// Inicializar
document.addEventListener('DOMContentLoaded', async () => {
    // Inicializar Supabase
    if (typeof SupabaseClient !== 'undefined') {
        supabase = new SupabaseClient(SUPABASE_URL, SUPABASE_ANON_KEY);
        
        // Verificar sesión existente
        const user = await supabase.getCurrentUser();
        if (user) {
            await loadAdminPanel();
        }
    } else {
        console.error('Supabase client no está disponible');
    }
});

// ==================== AUTENTICACIÓN ====================

async function handleLogin(event) {
    event.preventDefault();
    
    const email = document.getElementById('login-email').value;
    const password = document.getElementById('login-password').value;
    
    const result = await supabase.signIn(email, password);
    
    if (result.success) {
        await loadAdminPanel();
    } else {
        alert('Error al iniciar sesión: ' + result.error);
    }
}

async function handleRegister(event) {
    event.preventDefault();
    
    const tiendaNombre = document.getElementById('register-tienda').value;
    const nombre = document.getElementById('register-nombre').value;
    const email = document.getElementById('register-email').value;
    const password = document.getElementById('register-password').value;
    
    const result = await supabase.signUp(email, password, tiendaNombre, { nombre });
    
    if (result.success) {
        alert('¡Cuenta creada exitosamente! Por favor, verifica tu email.');
        showLoginForm();
    } else {
        alert('Error al crear cuenta: ' + result.error);
    }
}

async function handleLogout() {
    const result = await supabase.signOut();
    
    if (result.success) {
        document.getElementById('auth-container').classList.remove('hidden');
        document.getElementById('admin-panel').classList.add('hidden');
        currentUser = null;
        currentTienda = null;
    }
}

function showLoginForm() {
    document.getElementById('login-form').classList.remove('hidden');
    document.getElementById('register-form').classList.add('hidden');
}

function showRegisterForm() {
    document.getElementById('login-form').classList.add('hidden');
    document.getElementById('register-form').classList.remove('hidden');
}

// ==================== PANEL ADMIN ====================

async function loadAdminPanel() {
    const userData = await supabase.loadUserData();
    
    if (!userData) {
        alert('Error al cargar datos del usuario');
        return;
    }
    
    currentUser = userData;
    currentTienda = userData.tiendas;
    
    // Ocultar auth, mostrar panel
    document.getElementById('auth-container').classList.add('hidden');
    document.getElementById('admin-panel').classList.remove('hidden');
    
    // Actualizar UI
    document.getElementById('tienda-nombre').textContent = currentTienda.nombre;
    document.getElementById('user-email').textContent = currentUser.email;
    document.getElementById('user-welcome').textContent = `Hola, ${currentUser.nombre}`;
    
    // Cargar datos iniciales
    await loadDashboardData();
    await loadProductos();
}

async function loadDashboardData() {
    // Cargar estadísticas
    const ordenes = await supabase.getOrdenes({ tienda_id: currentTienda.id });
    const productos = await supabase.getProductos({ tienda_id: currentTienda.id });
    
    // Actualizar cards (implementar lógica de cálculo)
    // ...
    
    // Cargar órdenes recientes
    if (ordenes.success && ordenes.data.length > 0) {
        displayRecentOrders(ordenes.data.slice(0, 5));
    }
}

function displayRecentOrders(ordenes) {
    const container = document.getElementById('recent-orders');
    
    if (ordenes.length === 0) {
        container.innerHTML = '<p>No hay órdenes recientes.</p>';
        return;
    }
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Fecha</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    ordenes.forEach(orden => {
        const estadoBadge = getEstadoBadge(orden.estado);
        html += `
            <tr>
                <td>${orden.numero_orden}</td>
                <td>${orden.cliente_nombre}</td>
                <td>$${orden.total}</td>
                <td>${estadoBadge}</td>
                <td>${new Date(orden.created_at).toLocaleDateString()}</td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ==================== PRODUCTOS ====================

async function loadProductos() {
    const result = await supabase.getProductos({ tienda_id: currentTienda.id });
    
    if (result.success) {
        displayProductos(result.data);
    }
}

function displayProductos(productos) {
    const container = document.getElementById('productos-list');
    
    if (productos.length === 0) {
        container.innerHTML = '<p>No hay productos. Crea tu primer producto.</p>';
        return;
    }
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Precio</th>
                    <th>Stock</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(producto => {
        const estadoBadge = producto.activo 
            ? '<span class="badge badge-success">Activo</span>' 
            : '<span class="badge badge-danger">Inactivo</span>';
            
        html += `
            <tr>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.sku || '-'}</td>
                <td>$${producto.precio}</td>
                <td>${producto.stock_actual}</td>
                <td>${estadoBadge}</td>
                <td>
                    <button class="btn btn-primary" onclick="editProduct('${producto.id}')">Editar</button>
                    <button class="btn btn-danger" onclick="deleteProduct('${producto.id}')">Eliminar</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

function showProductModal() {
    document.getElementById('product-modal').classList.add('active');
}

function closeProductModal() {
    document.getElementById('product-modal').classList.remove('active');
    document.getElementById('product-form').reset();
}

async function handleProductSubmit(event) {
    event.preventDefault();
    
    const productoData = {
        nombre: document.getElementById('product-name').value,
        precio: parseFloat(document.getElementById('product-price').value),
        stock_actual: parseInt(document.getElementById('product-stock').value),
        descripcion: document.getElementById('product-description').value,
        sku: document.getElementById('product-sku').value,
        activo: true
    };
    
    const result = await supabase.createProducto(productoData);
    
    if (result.success) {
        alert('Producto creado exitosamente');
        closeProductModal();
        await loadProductos();
    } else {
        alert('Error al crear producto: ' + result.error);
    }
}

async function deleteProduct(id) {
    if (!confirm('¿Estás seguro de eliminar este producto?')) return;
    
    const result = await supabase.deleteProducto(id);
    
    if (result.success) {
        alert('Producto eliminado');
        await loadProductos();
    } else {
        alert('Error al eliminar producto: ' + result.error);
    }
}

// ==================== CONFIGURACIÓN ====================

async function saveConfig(event, tipo) {
    event.preventDefault();
    
    if (tipo === 'mercadopago') {
        const config = {
            mp_public_key: document.getElementById('mp-public-key').value,
            mp_access_token: document.getElementById('mp-access-token').value,
            mp_cvu: document.getElementById('mp-cvu').value
        };
        
        // Actualizar en Supabase
        const result = await supabase.client
            .from('tiendas')
            .update(config)
            .eq('id', currentTienda.id);
        
        if (!result.error) {
            alert('Configuración guardada exitosamente');
        } else {
            alert('Error al guardar configuración');
        }
    } else if (tipo === 'contacto') {
        const config = {
            whatsapp: document.getElementById('whatsapp').value,
            instagram: document.getElementById('instagram').value
        };
        
        const result = await supabase.client
            .from('tiendas')
            .update(config)
            .eq('id', currentTienda.id);
        
        if (!result.error) {
            alert('Contacto guardado exitosamente');
        } else {
            alert('Error al guardar contacto');
        }
    }
}

// ==================== NAVEGACIÓN ====================

function showSection(sectionName) {
    // Ocultar todas las secciones
    document.querySelectorAll('.content-section').forEach(section => {
        section.classList.remove('active');
    });
    
    // Remover active de todos los items del menú
    document.querySelectorAll('.menu-item').forEach(item => {
        item.classList.remove('active');
    });
    
    // Mostrar sección seleccionada
    const section = document.getElementById(`${sectionName}-section`);
    if (section) {
        section.classList.add('active');
    }
    
    // Marcar item del menú como activo
    event.target.closest('.menu-item').classList.add('active');
    
    // Actualizar título
    const titles = {
        'dashboard': 'Dashboard',
        'productos': 'Productos',
        'ordenes': 'Órdenes',
        'stock': 'Inventario',
        'config': 'Configuración'
    };
    
    document.getElementById('page-title').textContent = titles[sectionName] || 'Panel Admin';
    
    // Cargar datos de la sección
    switch(sectionName) {
        case 'dashboard':
            loadDashboardData();
            break;
        case 'productos':
            loadProductos();
            break;
        case 'ordenes':
            loadOrdenes();
            break;
        case 'stock':
            loadStock();
            break;
    }
}

// ==================== ÓRDENES ====================

async function loadOrdenes() {
    const result = await supabase.getOrdenes({ tienda_id: currentTienda.id });
    
    if (result.success) {
        displayOrdenes(result.data);
    }
}

function displayOrdenes(ordenes) {
    const container = document.getElementById('ordenes-list');
    
    if (ordenes.length === 0) {
        container.innerHTML = '<p>No hay órdenes.</p>';
        return;
    }
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Número</th>
                    <th>Cliente</th>
                    <th>Email</th>
                    <th>Total</th>
                    <th>Estado</th>
                    <th>Pago</th>
                    <th>Fecha</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    ordenes.forEach(orden => {
        html += `
            <tr>
                <td><strong>${orden.numero_orden}</strong></td>
                <td>${orden.cliente_nombre}</td>
                <td>${orden.cliente_email}</td>
                <td>$${orden.total}</td>
                <td>${getEstadoBadge(orden.estado)}</td>
                <td>${getEstadoPagoBadge(orden.estado_pago)}</td>
                <td>${new Date(orden.created_at).toLocaleDateString()}</td>
                <td>
                    <button class="btn btn-primary" onclick="viewOrden('${orden.id}')">Ver</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ==================== STOCK ====================

async function loadStock() {
    const result = await supabase.getProductos({ tienda_id: currentTienda.id });
    
    if (result.success) {
        displayStock(result.data);
    }
}

function displayStock(productos) {
    const container = document.getElementById('stock-list');
    
    let html = `
        <table class="table">
            <thead>
                <tr>
                    <th>Producto</th>
                    <th>SKU</th>
                    <th>Stock Actual</th>
                    <th>Stock Mínimo</th>
                    <th>Estado</th>
                    <th>Acciones</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    productos.forEach(producto => {
        const stockStatus = producto.stock_actual <= producto.stock_minimo
            ? '<span class="badge badge-danger">Stock Bajo</span>'
            : '<span class="badge badge-success">OK</span>';
            
        html += `
            <tr>
                <td><strong>${producto.nombre}</strong></td>
                <td>${producto.sku || '-'}</td>
                <td>${producto.stock_actual}</td>
                <td>${producto.stock_minimo}</td>
                <td>${stockStatus}</td>
                <td>
                    <button class="btn btn-primary" onclick="adjustStock('${producto.id}')">Ajustar</button>
                </td>
            </tr>
        `;
    });
    
    html += '</tbody></table>';
    container.innerHTML = html;
}

// ==================== UTILIDADES ====================

function getEstadoBadge(estado) {
    const badges = {
        'pendiente': '<span class="badge badge-warning">Pendiente</span>',
        'procesando': '<span class="badge badge-warning">Procesando</span>',
        'enviado': '<span class="badge badge-success">Enviado</span>',
        'entregado': '<span class="badge badge-success">Entregado</span>',
        'cancelado': '<span class="badge badge-danger">Cancelado</span>'
    };
    return badges[estado] || '<span class="badge">Desconocido</span>';
}

function getEstadoPagoBadge(estado) {
    const badges = {
        'pendiente': '<span class="badge badge-warning">Pendiente</span>',
        'aprobado': '<span class="badge badge-success">Aprobado</span>',
        'rechazado': '<span class="badge badge-danger">Rechazado</span>',
        'reembolsado': '<span class="badge badge-warning">Reembolsado</span>'
    };
    return badges[estado] || '<span class="badge">Desconocido</span>';
}
