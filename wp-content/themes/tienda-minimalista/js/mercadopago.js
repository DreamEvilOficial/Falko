/**
 * MercadoPago Integration - Frontend JavaScript
 */

class MercadoPagoIntegration {
    constructor(publicKey) {
        this.mp = null;
        this.publicKey = publicKey;
        this.initialized = false;
        this.init();
    }

    init() {
        if (typeof MercadoPago !== 'undefined' && this.publicKey) {
            this.mp = new MercadoPago(this.publicKey);
            this.initialized = true;
            console.log('MercadoPago inicializado');
        }
    }

    async createPreference(items, buyerInfo = {}) {
        try {
            const response = await fetch(tiendaData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'create_mercadopago_preference',
                    nonce: tiendaData.nonce,
                    cart: JSON.stringify(items),
                    buyer: JSON.stringify(buyerInfo)
                })
            });

            const data = await response.json();
            return data;
        } catch (error) {
            console.error('Error al crear preferencia:', error);
            return { success: false, error: error.message };
        }
    }

    async createCardPayment(formData) {
        if (!this.initialized) {
            return { success: false, error: 'MercadoPago no inicializado' };
        }

        try {
            const cardToken = await this.mp.createCardToken({
                cardNumber: formData.cardNumber,
                cardholderName: formData.cardholderName,
                cardExpirationMonth: formData.expirationMonth,
                cardExpirationYear: formData.expirationYear,
                securityCode: formData.securityCode,
                identificationType: formData.identificationType,
                identificationNumber: formData.identificationNumber,
            });

            if (cardToken.error) {
                return { success: false, error: cardToken.error };
            }

            // Procesar el pago con el token
            const response = await fetch(tiendaData.ajaxUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/x-www-form-urlencoded',
                },
                body: new URLSearchParams({
                    action: 'process_card_payment',
                    nonce: tiendaData.nonce,
                    token: cardToken.id,
                    ...formData
                })
            });

            return await response.json();
        } catch (error) {
            console.error('Error al procesar pago con tarjeta:', error);
            return { success: false, error: error.message };
        }
    }

    redirectToCheckout(preferenceId) {
        if (!this.initialized) {
            console.error('MercadoPago no inicializado');
            return;
        }

        // Redirigir al checkout de MercadoPago
        this.mp.checkout({
            preference: {
                id: preferenceId
            },
            autoOpen: true
        });
    }

    async getPaymentMethods() {
        if (!this.initialized) {
            return [];
        }

        try {
            const response = await this.mp.getPaymentMethods();
            return response;
        } catch (error) {
            console.error('Error al obtener métodos de pago:', error);
            return [];
        }
    }

    async getInstallments(bin, amount) {
        if (!this.initialized) {
            return [];
        }

        try {
            const response = await this.mp.getInstallments({
                bin: bin,
                amount: amount
            });
            return response;
        } catch (error) {
            console.error('Error al obtener cuotas:', error);
            return [];
        }
    }
}

// Funciones de utilidad para el checkout
function initMercadoPagoCheckout() {
    const publicKey = tiendaData.mercadoPagoPublicKey;
    
    if (!publicKey) {
        console.error('MercadoPago Public Key no configurada');
        return;
    }

    const mpIntegration = new MercadoPagoIntegration(publicKey);
    window.mpIntegration = mpIntegration;

    // Agregar event listener al botón de checkout
    const checkoutBtn = document.getElementById('checkout-btn');
    if (checkoutBtn) {
        checkoutBtn.addEventListener('click', handleMercadoPagoCheckout);
    }
}

async function handleMercadoPagoCheckout() {
    const cart = JSON.parse(localStorage.getItem('tienda_cart') || '[]');
    
    if (cart.length === 0) {
        showNotification('El carrito está vacío');
        return;
    }

    // Mostrar loader
    const btn = document.getElementById('checkout-btn');
    const originalText = btn.textContent;
    btn.textContent = 'Procesando...';
    btn.disabled = true;

    try {
        const result = await window.mpIntegration.createPreference(cart);
        
        if (result.success) {
            // Limpiar carrito
            localStorage.removeItem('tienda_cart');
            
            // Redirigir a MercadoPago
            window.location.href = result.data.init_point;
        } else {
            showNotification('Error al procesar el pago: ' + result.error);
            btn.textContent = originalText;
            btn.disabled = false;
        }
    } catch (error) {
        console.error('Error en checkout:', error);
        showNotification('Error al procesar el pago');
        btn.textContent = originalText;
        btn.disabled = false;
    }
}

// Formulario de pago con tarjeta (opcional)
function createCardPaymentForm() {
    return `
        <form id="mp-card-form">
            <div class="form-group">
                <label>Número de Tarjeta</label>
                <input type="text" id="cardNumber" class="form-control" maxlength="16" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Mes de Vencimiento</label>
                    <input type="text" id="expirationMonth" class="form-control" maxlength="2" required>
                </div>
                <div class="form-group">
                    <label>Año de Vencimiento</label>
                    <input type="text" id="expirationYear" class="form-control" maxlength="2" required>
                </div>
            </div>
            <div class="form-group">
                <label>Nombre del Titular</label>
                <input type="text" id="cardholderName" class="form-control" required>
            </div>
            <div class="form-group">
                <label>Código de Seguridad</label>
                <input type="text" id="securityCode" class="form-control" maxlength="4" required>
            </div>
            <div class="form-row">
                <div class="form-group">
                    <label>Tipo de Documento</label>
                    <select id="identificationType" class="form-control" required>
                        <option value="DNI">DNI</option>
                        <option value="CUIL">CUIL</option>
                        <option value="CUIT">CUIT</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Número de Documento</label>
                    <input type="text" id="identificationNumber" class="form-control" required>
                </div>
            </div>
            <button type="submit" class="btn btn-primary">Pagar</button>
        </form>
    `;
}

// Inicializar cuando esté listo
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initMercadoPagoCheckout);
} else {
    initMercadoPagoCheckout();
}
