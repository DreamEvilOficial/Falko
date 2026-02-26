<!DOCTYPE html>
<html <?php language_attributes(); ?>>
<head>
    <meta charset="<?php bloginfo('charset'); ?>">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <?php wp_head(); ?>
</head>
<body <?php body_class(); ?>>
<?php wp_body_open(); ?>

<header class="site-header">
    <div class="header-container">
        <a href="<?php echo esc_url(home_url('/')); ?>" class="site-logo">
            <?php bloginfo('name'); ?>
        </a>
        
        <nav class="main-nav">
            <?php
            wp_nav_menu(array(
                'theme_location' => 'primary',
                'container' => false,
                'fallback_cb' => function() {
                    echo '<ul>';
                    echo '<li><a href="' . home_url('/') . '">Inicio</a></li>';
                    echo '<li><a href="' . home_url('/productos') . '">Productos</a></li>';
                    echo '<li><a href="#contacto">Contacto</a></li>';
                    echo '</ul>';
                },
            ));
            ?>
        </nav>
        
        <div class="header-actions">
            <div class="cart-icon" id="cart-toggle">
                🛒
                <span class="cart-count" id="cart-count">0</span>
            </div>
        </div>
    </div>
</header>

<!-- Mini Cart (Modal) -->
<div id="mini-cart" class="mini-cart" style="display: none;">
    <div class="mini-cart-content glass-card">
        <div class="mini-cart-header">
            <h3>Tu Carrito</h3>
            <button id="close-cart">✕</button>
        </div>
        <div class="mini-cart-items" id="cart-items">
            <!-- Items del carrito se cargan dinámicamente -->
        </div>
        <div class="mini-cart-footer">
            <div class="cart-total">
                <strong>Total:</strong>
                <span id="cart-total">$0.00</span>
            </div>
            <button class="btn" id="checkout-btn">Finalizar Compra</button>
        </div>
    </div>
</div>
