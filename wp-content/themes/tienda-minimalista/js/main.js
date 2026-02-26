/**
 * JavaScript principal para la tienda
 */

(function() {
    'use strict';
    
    // Variables globales
    let cart = JSON.parse(localStorage.getItem('tienda_cart')) || [];
    let supabaseClient = null;
    
    // Inicializar Supabase
    function initSupabase() {
        if (typeof tiendaData !== 'undefined' && tiendaData.supabaseUrl && tiendaData.supabaseKey) {
            // Nota: Necesitarás incluir el SDK de Supabase
            // <script src="https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2"></script>
            if (typeof supabase !== 'undefined') {
                supabaseClient = supabase.createClient(
                    tiendaData.supabaseUrl,
                    tiendaData.supabaseKey
                );
            }
        }
    }
    
    // Actualizar contador del carrito
    function updateCartCount() {
        const cartCount = document.getElementById('cart-count');
        if (cartCount) {
            const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
            cartCount.textContent = totalItems;
        }
    }
    
    // Agregar producto al carrito
    function addToCart(productId, productData) {
        const existingItem = cart.find(item => item.id === productId);
        
        if (existingItem) {
            existingItem.quantity += 1;
        } else {
            cart.push({
                id: productId,
                title: productData.title,
                price: productData.price,
                image: productData.image,
                quantity: 1,
                size: productData.size || null,
                color: productData.color || null
            });
        }
        
        localStorage.setItem('tienda_cart', JSON.stringify(cart));
        updateCartCount();
        updateCartUI();
        showNotification('Producto agregado al carrito');
    }
    
    // Eliminar del carrito
    function removeFromCart(productId) {
        cart = cart.filter(item => item.id !== productId);
        localStorage.setItem('tienda_cart', JSON.stringify(cart));
        updateCartCount();
        updateCartUI();
    }
    
    // Actualizar cantidad
    function updateQuantity(productId, change) {
        const item = cart.find(item => item.id === productId);
        if (item) {
            item.quantity += change;
            if (item.quantity <= 0) {
                removeFromCart(productId);
            } else {
                localStorage.setItem('tienda_cart', JSON.stringify(cart));
                updateCartUI();
            }
        }
    }
    
    // Actualizar UI del carrito
    function updateCartUI() {
        const cartItems = document.getElementById('cart-items');
        const cartTotal = document.getElementById('cart-total');
        
        if (!cartItems) return;
        
        if (cart.length === 0) {
            cartItems.innerHTML = '<p style="text-align: center; padding: 2rem;">El carrito está vacío</p>';
            cartTotal.textContent = '$0.00';
            return;
        }
        
        let html = '';
        let total = 0;
        
        cart.forEach(item => {
            const itemTotal = item.price * item.quantity;
            total += itemTotal;
            
            html += `
                <div class="cart-item" data-id="${item.id}">
                    <img src="${item.image}" alt="${item.title}" class="cart-item-image">
                    <div class="cart-item-details">
                        <h4>${item.title}</h4>
                        ${item.size ? `<p>Talle: ${item.size}</p>` : ''}
                        ${item.color ? `<p>Color: ${item.color}</p>` : ''}
                        <p>$${item.price}</p>
                    </div>
                    <div class="cart-item-quantity">
                        <button class="qty-btn" onclick="tiendaApp.updateQuantity(${item.id}, -1)">-</button>
                        <span>${item.quantity}</span>
                        <button class="qty-btn" onclick="tiendaApp.updateQuantity(${item.id}, 1)">+</button>
                    </div>
                    <button class="remove-btn" onclick="tiendaApp.removeFromCart(${item.id})">🗑️</button>
                </div>
            `;
        });
        
        cartItems.innerHTML = html;
        cartTotal.textContent = '$' + total.toFixed(2);
    }
    
    // Mostrar/ocultar carrito
    function toggleCart() {
        const miniCart = document.getElementById('mini-cart');
        if (miniCart) {
            miniCart.style.display = miniCart.style.display === 'none' ? 'flex' : 'none';
        }
    }
    
    // Notificaciones
    function showNotification(message) {
        const notification = document.createElement('div');
        notification.className = 'notification';
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: rgba(0, 0, 0, 0.8);
            color: white;
            padding: 1rem 2rem;
            border-radius: 50px;
            z-index: 10000;
            animation: slideIn 0.3s ease;
        `;
        
        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.style.animation = 'slideOut 0.3s ease';
            setTimeout(() => notification.remove(), 300);
        }, 3000);
    }
    
    // Checkout con MercadoPago
    async function checkout() {
        if (cart.length === 0) {
            showNotification('El carrito está vacío');
            return;
        }
        
        try {
            const response = await fetch(tiendaData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'create_mercadopago_preference',
                    nonce: tiendaData.nonce,
                    cart: JSON.stringify(cart)
                })
            });
            
            const data = await response.json();
            
            if (data.success && data.data.preference_id) {
                // Redirigir a MercadoPago
                window.location.href = data.data.init_point;
            } else {
                showNotification('Error al procesar el pago');
            }
        } catch (error) {
            console.error('Error en checkout:', error);
            showNotification('Error al procesar el pago');
        }
    }
    
    // Sincronizar con Supabase
    async function syncWithSupabase() {
        if (!supabaseClient) return;
        
        try {
            // Obtener productos desde Supabase
            const { data, error } = await supabaseClient
                .from('productos')
                .select('*')
                .eq('activo', true);
            
            if (error) throw error;
            
            // Actualizar productos en la página
            if (data && data.length > 0) {
                updateProductsDisplay(data);
            }
        } catch (error) {
            console.error('Error al sincronizar con Supabase:', error);
        }
    }
    
    // Actualizar display de productos
    function updateProductsDisplay(productos) {
        const grid = document.getElementById('productos-grid');
        if (!grid) return;
        
        // Esta función se puede expandir para actualizar dinámicamente
        // los productos desde Supabase
    }
    
    // Filtrar productos
    function filterProducts(filters) {
        // Implementar filtrado por categoría, precio, color, talle, etc.
        const products = document.querySelectorAll('.product-card');
        
        products.forEach(product => {
            let show = true;
            
            // Aplicar filtros
            if (filters.category && product.dataset.category !== filters.category) {
                show = false;
            }
            
            if (filters.color && !product.dataset.colors.includes(filters.color)) {
                show = false;
            }
            
            product.style.display = show ? 'block' : 'none';
        });
    }
    
    // Animaciones de scroll
    function initScrollAnimations() {
        const observerOptions = {
            threshold: 0.1,
            rootMargin: '0px 0px -50px 0px'
        };
        
        const observer = new IntersectionObserver((entries) => {
            entries.forEach(entry => {
                if (entry.isIntersecting) {
                    entry.target.classList.add('fade-in-up');
                    observer.unobserve(entry.target);
                }
            });
        }, observerOptions);
        
        document.querySelectorAll('.product-card, .glass-card').forEach(el => {
            observer.observe(el);
        });
    }
    
    // Event Listeners
    function initEventListeners() {
        // Toggle carrito
        const cartToggle = document.getElementById('cart-toggle');
        if (cartToggle) {
            cartToggle.addEventListener('click', toggleCart);
        }
        
        // Cerrar carrito
        const closeCart = document.getElementById('close-cart');
        if (closeCart) {
            closeCart.addEventListener('click', toggleCart);
        }
        
        // Cerrar carrito al hacer click fuera
        const miniCart = document.getElementById('mini-cart');
        if (miniCart) {
            miniCart.addEventListener('click', (e) => {
                if (e.target === miniCart) {
                    toggleCart();
                }
            });
        }
        
        // Checkout
        const checkoutBtn = document.getElementById('checkout-btn');
        if (checkoutBtn) {
            checkoutBtn.addEventListener('click', checkout);
        }
        
        // Agregar al carrito desde tarjetas de producto
        document.querySelectorAll('.add-to-cart-btn').forEach(btn => {
            btn.addEventListener('click', function(e) {
                e.preventDefault();
                const productCard = this.closest('.product-card');
                const productData = {
                    title: productCard.querySelector('.product-title').textContent,
                    price: parseFloat(productCard.dataset.price),
                    image: productCard.querySelector('.product-image').src
                };
                addToCart(productCard.dataset.id, productData);
            });
        });
    }
    
    // Inicialización
    function init() {
        initSupabase();
        updateCartCount();
        updateCartUI();
        initEventListeners();
        initScrollAnimations();
        
        // Sincronizar con Supabase cada 30 segundos
        if (supabaseClient) {
            syncWithSupabase();
            setInterval(syncWithSupabase, 30000);
        }
    }
    
    // Exponer funciones necesarias globalmente
    window.tiendaApp = {
        addToCart,
        removeFromCart,
        updateQuantity,
        checkout,
        filterProducts
    };
    
    // Iniciar cuando el DOM esté listo
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }
    
})();

// Estilos adicionales para el carrito (agregar al CSS si es necesario)
const cartStyles = `
    .mini-cart {
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(5px);
        z-index: 9999;
        display: flex;
        justify-content: flex-end;
        align-items: flex-start;
        padding: 1rem;
    }
    
    .mini-cart-content {
        width: 100%;
        max-width: 400px;
        max-height: 90vh;
        overflow-y: auto;
        animation: slideInRight 0.3s ease;
    }
    
    .mini-cart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 1rem;
        padding-bottom: 1rem;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
    }
    
    .mini-cart-header button {
        background: none;
        border: none;
        font-size: 1.5rem;
        cursor: pointer;
    }
    
    .cart-item {
        display: grid;
        grid-template-columns: 60px 1fr auto auto;
        gap: 1rem;
        padding: 1rem 0;
        border-bottom: 1px solid rgba(0, 0, 0, 0.1);
        align-items: center;
    }
    
    .cart-item-image {
        width: 60px;
        height: 60px;
        object-fit: cover;
        border-radius: 8px;
    }
    
    .cart-item-details h4 {
        margin: 0 0 0.25rem 0;
        font-size: 0.9rem;
    }
    
    .cart-item-details p {
        margin: 0;
        font-size: 0.8rem;
        color: #666;
    }
    
    .cart-item-quantity {
        display: flex;
        gap: 0.5rem;
        align-items: center;
    }
    
    .qty-btn {
        background: #000;
        color: white;
        border: none;
        width: 24px;
        height: 24px;
        border-radius: 50%;
        cursor: pointer;
        font-size: 1rem;
        display: flex;
        align-items: center;
        justify-content: center;
    }
    
    .remove-btn {
        background: none;
        border: none;
        cursor: pointer;
        font-size: 1.2rem;
    }
    
    .mini-cart-footer {
        margin-top: 1rem;
        padding-top: 1rem;
        border-top: 2px solid rgba(0, 0, 0, 0.1);
    }
    
    .cart-total {
        display: flex;
        justify-content: space-between;
        margin-bottom: 1rem;
        font-size: 1.25rem;
    }
    
    @keyframes slideInRight {
        from {
            transform: translateX(100%);
        }
        to {
            transform: translateX(0);
        }
    }
    
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;

// Inyectar estilos
const styleSheet = document.createElement('style');
styleSheet.textContent = cartStyles;
document.head.appendChild(styleSheet);
