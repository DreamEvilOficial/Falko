<?php
/*
Plugin Name: Tienda MercadoPago
Plugin URI: https://tutienda.com
Description: Integración completa de MercadoPago para tienda de ropa
Version: 1.0.0
Author: Tu Nombre
Author URI: https://tutienda.com
License: GPL v2 or later
Text Domain: tienda-mercadopago
*/

// Evitar acceso directo
if (!defined('ABSPATH')) {
    exit;
}

// Incluir archivo principal
require_once plugin_dir_path(__FILE__) . 'tienda-mercadopago.php';

// Hook de activación
register_activation_hook(__FILE__, 'tienda_mercadopago_activate');

function tienda_mercadopago_activate() {
    // Crear tabla de órdenes si no existe
    global $wpdb;
    $table_name = $wpdb->prefix . 'tienda_ordenes';
    
    $charset_collate = $wpdb->get_charset_collate();
    
    $sql = "CREATE TABLE IF NOT EXISTS $table_name (
        id mediumint(9) NOT NULL AUTO_INCREMENT,
        numero_orden varchar(50) NOT NULL,
        cliente_nombre varchar(255) NOT NULL,
        cliente_email varchar(255) NOT NULL,
        total decimal(10,2) NOT NULL,
        estado varchar(50) DEFAULT 'pendiente',
        mp_preference_id varchar(255),
        mp_payment_id varchar(255),
        created_at datetime DEFAULT CURRENT_TIMESTAMP,
        PRIMARY KEY  (id)
    ) $charset_collate;";
    
    require_once(ABSPATH . 'wp-admin/includes/upgrade.php');
    dbDelta($sql);
}
