<?php
/**
 * Integración con MercadoPago
 * Plugin personalizado para WordPress
 */

// Agregar endpoints AJAX para MercadoPago
add_action('wp_ajax_create_mercadopago_preference', 'create_mercadopago_preference');
add_action('wp_ajax_nopriv_create_mercadopago_preference', 'create_mercadopago_preference');

function create_mercadopago_preference() {
    check_ajax_referer('tienda_nonce', 'nonce');
    
    $cart = json_decode(stripslashes($_POST['cart']), true);
    
    if (empty($cart)) {
        wp_send_json_error('Carrito vacío');
        return;
    }
    
    $access_token = get_option('mercadopago_access_token');
    
    if (!$access_token) {
        wp_send_json_error('MercadoPago no configurado');
        return;
    }
    
    // Preparar items para MercadoPago
    $items = array();
    $total = 0;
    
    foreach ($cart as $item) {
        $items[] = array(
            'title' => $item['title'],
            'quantity' => $item['quantity'],
            'unit_price' => floatval($item['price']),
            'currency_id' => 'ARS',
        );
        $total += $item['price'] * $item['quantity'];
    }
    
    // Crear preferencia de pago
    $preference_data = array(
        'items' => $items,
        'back_urls' => array(
            'success' => home_url('/pago-exitoso'),
            'failure' => home_url('/pago-fallido'),
            'pending' => home_url('/pago-pendiente'),
        ),
        'auto_return' => 'approved',
        'statement_descriptor' => get_bloginfo('name'),
        'external_reference' => 'ORDER-' . time(),
    );
    
    // Hacer request a MercadoPago
    $response = wp_remote_post('https://api.mercadopago.com/checkout/preferences', array(
        'headers' => array(
            'Content-Type' => 'application/json',
            'Authorization' => 'Bearer ' . $access_token,
        ),
        'body' => json_encode($preference_data),
        'timeout' => 30,
    ));
    
    if (is_wp_error($response)) {
        wp_send_json_error('Error al conectar con MercadoPago');
        return;
    }
    
    $body = json_decode(wp_remote_retrieve_body($response), true);
    
    if (isset($body['id'])) {
        // Guardar orden en la base de datos
        save_order_to_database($cart, $body['id'], $total);
        
        wp_send_json_success(array(
            'preference_id' => $body['id'],
            'init_point' => $body['init_point'],
            'sandbox_init_point' => $body['sandbox_init_point'],
        ));
    } else {
        wp_send_json_error('Error al crear preferencia de pago');
    }
}

function save_order_to_database($cart, $preference_id, $total) {
    global $wpdb;
    
    // Guardar en tabla de órdenes (si tienes una)
    // O usar custom post type
    
    $order_data = array(
        'post_title' => 'Orden ' . $preference_id,
        'post_type' => 'orden',
        'post_status' => 'pending',
        'meta_input' => array(
            'cart_items' => json_encode($cart),
            'mp_preference_id' => $preference_id,
            'total' => $total,
            'created_at' => current_time('mysql'),
        ),
    );
    
    $order_id = wp_insert_post($order_data);
    
    return $order_id;
}

// Webhook para recibir notificaciones de MercadoPago
add_action('wp_ajax_nopriv_mercadopago_webhook', 'handle_mercadopago_webhook');
add_action('wp_ajax_mercadopago_webhook', 'handle_mercadopago_webhook');

function handle_mercadopago_webhook() {
    $input = file_get_contents('php://input');
    $data = json_decode($input, true);
    
    error_log('MercadoPago Webhook: ' . print_r($data, true));
    
    if (isset($data['type']) && $data['type'] === 'payment') {
        $payment_id = $data['data']['id'];
        
        // Obtener información del pago
        $access_token = get_option('mercadopago_access_token');
        $response = wp_remote_get("https://api.mercadopago.com/v1/payments/{$payment_id}", array(
            'headers' => array(
                'Authorization' => 'Bearer ' . $access_token,
            ),
        ));
        
        if (!is_wp_error($response)) {
            $payment = json_decode(wp_remote_retrieve_body($response), true);
            
            // Actualizar estado de la orden
            if (isset($payment['external_reference'])) {
                update_order_payment_status($payment);
            }
        }
    }
    
    wp_send_json_success();
}

function update_order_payment_status($payment) {
    $external_reference = $payment['external_reference'];
    $status = $payment['status'];
    
    // Buscar orden por preference_id
    $orders = get_posts(array(
        'post_type' => 'orden',
        'meta_key' => 'mp_preference_id',
        'meta_value' => $payment['metadata']['preference_id'] ?? '',
        'posts_per_page' => 1,
    ));
    
    if (!empty($orders)) {
        $order = $orders[0];
        
        // Actualizar estado según respuesta de MercadoPago
        $order_status = match($status) {
            'approved' => 'completed',
            'pending' => 'pending',
            'rejected' => 'failed',
            'refunded' => 'refunded',
            default => 'pending',
        };
        
        wp_update_post(array(
            'ID' => $order->ID,
            'post_status' => $order_status,
        ));
        
        update_post_meta($order->ID, 'mp_payment_id', $payment['id']);
        update_post_meta($order->ID, 'mp_status', $status);
        update_post_meta($order->ID, 'mp_status_detail', $payment['status_detail']);
        
        // Enviar email de confirmación si está aprobado
        if ($status === 'approved') {
            send_order_confirmation_email($order->ID);
        }
    }
}

function send_order_confirmation_email($order_id) {
    $order = get_post($order_id);
    $cart_items = json_decode(get_post_meta($order_id, 'cart_items', true), true);
    $total = get_post_meta($order_id, 'total', true);
    
    $to = get_option('admin_email'); // O email del cliente
    $subject = 'Confirmación de Orden - ' . get_bloginfo('name');
    
    $message = "¡Tu orden ha sido confirmada!\n\n";
    $message .= "Número de orden: " . $order->post_title . "\n\n";
    $message .= "Items:\n";
    
    foreach ($cart_items as $item) {
        $message .= "- {$item['title']} x{$item['quantity']} - \${$item['price']}\n";
    }
    
    $message .= "\nTotal: \${$total}\n\n";
    $message .= "Gracias por tu compra!\n";
    $message .= get_bloginfo('name');
    
    wp_mail($to, $subject, $message);
}

// Registrar custom post type para órdenes
function register_orden_post_type() {
    register_post_type('orden', array(
        'labels' => array(
            'name' => 'Órdenes',
            'singular_name' => 'Orden',
        ),
        'public' => false,
        'show_ui' => true,
        'show_in_menu' => 'tienda-config',
        'capability_type' => 'post',
        'supports' => array('title'),
    ));
}
add_action('init', 'register_orden_post_type');

// Agregar SDK de MercadoPago al frontend
function enqueue_mercadopago_sdk() {
    $public_key = get_option('mercadopago_public_key');
    if ($public_key) {
        wp_enqueue_script('mercadopago-sdk', 'https://sdk.mercadopago.com/js/v2', array(), null, true);
        wp_add_inline_script('mercadopago-sdk', "
            const mp = new MercadoPago('{$public_key}');
            window.mercadoPago = mp;
        ");
    }
}
add_action('wp_enqueue_scripts', 'enqueue_mercadopago_sdk');

// Shortcode para botón de MercadoPago
function mercadopago_button_shortcode($atts) {
    $atts = shortcode_atts(array(
        'text' => 'Pagar con MercadoPago',
    ), $atts);
    
    return '<button class="btn btn-primary" id="mp-checkout-btn">' . esc_html($atts['text']) . '</button>';
}
add_shortcode('mercadopago_button', 'mercadopago_button_shortcode');

// Script para inicializar checkout de MercadoPago
function mercadopago_checkout_script() {
    ?>
    <script>
    document.addEventListener('DOMContentLoaded', function() {
        const mpBtn = document.getElementById('mp-checkout-btn');
        if (mpBtn && typeof mercadoPago !== 'undefined') {
            mpBtn.addEventListener('click', async function() {
                const cart = JSON.parse(localStorage.getItem('tienda_cart') || '[]');
                
                if (cart.length === 0) {
                    alert('El carrito está vacío');
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
                    
                    if (data.success) {
                        // Redirigir a checkout de MercadoPago
                        window.location.href = data.data.init_point;
                    } else {
                        alert('Error: ' + data.data);
                    }
                } catch (error) {
                    console.error('Error:', error);
                    alert('Error al procesar el pago');
                }
            });
        }
    });
    </script>
    <?php
}
add_action('wp_footer', 'mercadopago_checkout_script');
?>
