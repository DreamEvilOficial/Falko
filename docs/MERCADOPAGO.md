# Configuración de MercadoPago

## Obtener Credenciales

### 1. Crear Cuenta de Desarrollador

1. Ve a [MercadoPago Developers](https://www.mercadopago.com.ar/developers)
2. Inicia sesión con tu cuenta de MercadoPago
3. Ve a **Tus integraciones** > **Crear aplicación**
4. Completa los datos de tu aplicación

### 2. Credenciales de Prueba

Para testing, usa las credenciales de prueba:

```
Public Key: TEST-xxx-xxx-xxx
Access Token: TEST-xxx-xxx-xxx
```

**Tarjetas de Prueba:**

| Tarjeta | Número | CVV | Fecha | Resultado |
|---------|--------|-----|-------|-----------|
| Visa | 4509 9535 6623 3704 | 123 | 11/25 | Aprobado |
| Mastercard | 5031 7557 3453 0604 | 123 | 11/25 | Aprobado |
| Visa | 4074 0951 7325 3691 | 123 | 11/25 | Rechazado |

**Usuarios de Prueba:**

```
Email: test_user_123456@testuser.com
Password: qatest123
```

### 3. Credenciales de Producción

Una vez probado, cambia a credenciales reales:

```
Public Key: APP_USR-xxx-xxx-xxx
Access Token: APP_USR-xxx-xxx-xxx
```

## Configurar Webhook

1. En tu panel de MercadoPago, ve a **Webhooks**
2. Agrega una nueva URL: `https://tudominio.com/wp-admin/admin-ajax.php?action=mercadopago_webhook`
3. Selecciona los eventos:
   - Pagos
   - Pedidos
   - Reembolsos

## Configurar Cuenta CVU/CBU (Opcional)

Para transferencias directas:

1. Ve a **Configuración** en el panel admin
2. Ingresa tu CVU o CBU
3. Los clientes podrán transferir directamente

## Configuración Avanzada

### Personalizar Checkout

Edita `wp-content/themes/tienda-minimalista/js/mercadopago.js`:

```javascript
const preference = {
    items: items,
    back_urls: {
        success: "https://tudominio.com/pago-exitoso",
        failure: "https://tudominio.com/pago-fallido",
        pending: "https://tudominio.com/pago-pendiente"
    },
    auto_return: "approved",
    binary_mode: true, // Solo aprobado o rechazado
    statement_descriptor: "TU TIENDA", // Aparece en resumen de tarjeta
    external_reference: "ORDER-" + orderId
};
```

### Configurar Cuotas

```javascript
const preference = {
    // ... otros campos
    payment_methods: {
        installments: 12, // Máximo de cuotas
        default_installments: 1 // Cuotas por defecto
    }
};
```

### Excluir Métodos de Pago

```javascript
payment_methods: {
    excluded_payment_types: [
        { id: "ticket" } // Excluir pagos en efectivo
    ],
    excluded_payment_methods: [
        { id: "amex" } // Excluir American Express
    ]
}
```

## Seguridad

### Verificar Firma del Webhook

```php
function verify_mercadopago_signature($request_body, $signature) {
    $secret = get_option('mercadopago_webhook_secret');
    $hash = hash_hmac('sha256', $request_body, $secret);
    return hash_equals($hash, $signature);
}
```

## Manejo de Errores

| Código | Significado | Acción |
|--------|-------------|--------|
| 200 | Aprobado | Completar orden |
| 201 | Pendiente | Esperar confirmación |
| 400 | Error en datos | Verificar formulario |
| 401 | No autorizado | Revisar credenciales |
| 404 | No encontrado | Verificar IDs |

## Testing Checklist

- [ ] Pago aprobado
- [ ] Pago rechazado
- [ ] Pago pendiente
- [ ] Webhook recibido
- [ ] Email de confirmación
- [ ] Actualización de stock
- [ ] Reembolso
- [ ] Múltiples productos
- [ ] Diferentes métodos de pago
- [ ] Cuotas sin interés

## Documentación Oficial

- [API Reference](https://www.mercadopago.com.ar/developers/es/reference)
- [SDKs](https://www.mercadopago.com.ar/developers/es/docs/sdks-library/landing)
- [Checkout Pro](https://www.mercadopago.com.ar/developers/es/docs/checkout-pro/landing)
