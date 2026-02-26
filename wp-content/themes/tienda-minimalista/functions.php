<?php
/**
 * Tienda Minimalista Theme Functions
 */

// Configuración del tema
function tienda_minimalista_setup() {
    // Soporte para título del sitio
    add_theme_support('title-tag');
    
    // Soporte para imágenes destacadas
    add_theme_support('post-thumbnails');
    
    // Soporte para HTML5
    add_theme_support('html5', array(
        'search-form',
        'comment-form',
        'comment-list',
        'gallery',
        'caption',
    ));
    
    // Registrar menús
    register_nav_menus(array(
        'primary' => __('Menú Principal', 'tienda-minimalista'),
        'footer' => __('Menú Footer', 'tienda-minimalista'),
    ));
}
add_action('after_setup_theme', 'tienda_minimalista_setup');

// Cargar estilos y scripts
function tienda_minimalista_scripts() {
    // Google Fonts
    wp_enqueue_style('google-fonts', 'https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap', array(), null);
    
    // Estilo principal
    wp_enqueue_style('tienda-minimalista-style', get_stylesheet_uri(), array(), '1.0');
    
    // Scripts personalizados
    wp_enqueue_script('tienda-minimalista-main', get_template_directory_uri() . '/js/main.js', array(), '1.0', true);
    
    // Pasar variables PHP a JavaScript
    wp_localize_script('tienda-minimalista-main', 'tiendaData', array(
        'ajaxUrl' => admin_url('admin-ajax.php'),
        'nonce' => wp_create_nonce('tienda_nonce'),
        'supabaseUrl' => get_option('supabase_url'),
        'supabaseKey' => get_option('supabase_anon_key'),
    ));
}
add_action('wp_enqueue_scripts', 'tienda_minimalista_scripts');

// Registrar Custom Post Type para Productos
function tienda_register_productos() {
    $labels = array(
        'name' => 'Productos',
        'singular_name' => 'Producto',
        'add_new' => 'Añadir Nuevo',
        'add_new_item' => 'Añadir Nuevo Producto',
        'edit_item' => 'Editar Producto',
        'new_item' => 'Nuevo Producto',
        'view_item' => 'Ver Producto',
        'search_items' => 'Buscar Productos',
        'not_found' => 'No se encontraron productos',
        'not_found_in_trash' => 'No hay productos en la papelera',
    );
    
    $args = array(
        'labels' => $labels,
        'public' => true,
        'has_archive' => true,
        'menu_icon' => 'dashicons-products',
        'supports' => array('title', 'editor', 'thumbnail', 'custom-fields'),
        'rewrite' => array('slug' => 'productos'),
        'show_in_rest' => true,
    );
    
    register_post_type('producto', $args);
}
add_action('init', 'tienda_register_productos');

// Registrar taxonomías para productos
function tienda_register_taxonomies() {
    // Categorías de productos
    register_taxonomy('categoria_producto', 'producto', array(
        'hierarchical' => true,
        'labels' => array(
            'name' => 'Categorías',
            'singular_name' => 'Categoría',
        ),
        'show_in_rest' => true,
        'rewrite' => array('slug' => 'categoria'),
    ));
    
    // Colores
    register_taxonomy('color', 'producto', array(
        'hierarchical' => false,
        'labels' => array(
            'name' => 'Colores',
            'singular_name' => 'Color',
        ),
        'show_in_rest' => true,
    ));
    
    // Talles
    register_taxonomy('talle', 'producto', array(
        'hierarchical' => false,
        'labels' => array(
            'name' => 'Talles',
            'singular_name' => 'Talle',
        ),
        'show_in_rest' => true,
    ));
}
add_action('init', 'tienda_register_taxonomies');

// AJAX: Obtener productos desde Supabase
function ajax_get_productos() {
    check_ajax_referer('tienda_nonce', 'nonce');
    
    // Aquí se conectaría con Supabase
    // Por ahora retornamos datos de ejemplo
    $productos = get_posts(array(
        'post_type' => 'producto',
        'posts_per_page' => -1,
    ));
    
    wp_send_json_success($productos);
}
add_action('wp_ajax_get_productos', 'ajax_get_productos');
add_action('wp_ajax_nopriv_get_productos', 'ajax_get_productos');

// Agregar metaboxes para productos
function tienda_add_producto_metaboxes() {
    add_meta_box(
        'producto_detalles',
        'Detalles del Producto',
        'tienda_producto_detalles_callback',
        'producto',
        'normal',
        'high'
    );
}
add_action('add_meta_boxes', 'tienda_add_producto_metaboxes');

function tienda_producto_detalles_callback($post) {
    wp_nonce_field('tienda_save_producto', 'tienda_producto_nonce');
    
    $precio = get_post_meta($post->ID, '_precio', true);
    $stock = get_post_meta($post->ID, '_stock', true);
    $codigo = get_post_meta($post->ID, '_codigo', true);
    $destacado = get_post_meta($post->ID, '_destacado', true);
    ?>
    <p>
        <label for="producto_precio"><strong>Precio:</strong></label><br>
        <input type="number" id="producto_precio" name="producto_precio" value="<?php echo esc_attr($precio); ?>" step="0.01" style="width: 100%;">
    </p>
    <p>
        <label for="producto_stock"><strong>Stock:</strong></label><br>
        <input type="number" id="producto_stock" name="producto_stock" value="<?php echo esc_attr($stock); ?>" style="width: 100%;">
    </p>
    <p>
        <label for="producto_codigo"><strong>Código/SKU:</strong></label><br>
        <input type="text" id="producto_codigo" name="producto_codigo" value="<?php echo esc_attr($codigo); ?>" style="width: 100%;">
    </p>
    <p>
        <label>
            <input type="checkbox" name="producto_destacado" value="1" <?php checked($destacado, '1'); ?>>
            <strong>Producto Destacado</strong>
        </label>
    </p>
    <?php
}

// Guardar metadatos del producto
function tienda_save_producto_meta($post_id) {
    if (!isset($_POST['tienda_producto_nonce']) || !wp_verify_nonce($_POST['tienda_producto_nonce'], 'tienda_save_producto')) {
        return;
    }
    
    if (defined('DOING_AUTOSAVE') && DOING_AUTOSAVE) {
        return;
    }
    
    if (!current_user_can('edit_post', $post_id)) {
        return;
    }
    
    if (isset($_POST['producto_precio'])) {
        update_post_meta($post_id, '_precio', sanitize_text_field($_POST['producto_precio']));
    }
    
    if (isset($_POST['producto_stock'])) {
        update_post_meta($post_id, '_stock', sanitize_text_field($_POST['producto_stock']));
    }
    
    if (isset($_POST['producto_codigo'])) {
        update_post_meta($post_id, '_codigo', sanitize_text_field($_POST['producto_codigo']));
    }
    
    $destacado = isset($_POST['producto_destacado']) ? '1' : '0';
    update_post_meta($post_id, '_destacado', $destacado);
}
add_action('save_post_producto', 'tienda_save_producto_meta');

// Shortcode para mostrar productos destacados
function tienda_productos_destacados_shortcode($atts) {
    $atts = shortcode_atts(array(
        'cantidad' => 4,
    ), $atts);
    
    $args = array(
        'post_type' => 'producto',
        'posts_per_page' => $atts['cantidad'],
        'meta_query' => array(
            array(
                'key' => '_destacado',
                'value' => '1',
            ),
        ),
    );
    
    $query = new WP_Query($args);
    
    ob_start();
    
    if ($query->have_posts()) {
        echo '<div class="products-grid">';
        while ($query->have_posts()) {
            $query->the_post();
            get_template_part('template-parts/content', 'producto');
        }
        echo '</div>';
    }
    
    wp_reset_postdata();
    
    return ob_get_clean();
}
add_shortcode('productos_destacados', 'tienda_productos_destacados_shortcode');

// Agregar página de configuración de MercadoPago
function tienda_add_admin_menu() {
    add_menu_page(
        'Configuración Tienda',
        'Tienda Config',
        'manage_options',
        'tienda-config',
        'tienda_config_page',
        'dashicons-store',
        30
    );
}
add_action('admin_menu', 'tienda_add_admin_menu');

function tienda_config_page() {
    ?>
    <div class="wrap">
        <h1>Configuración de la Tienda</h1>
        <form method="post" action="options.php">
            <?php
            settings_fields('tienda_config_group');
            do_settings_sections('tienda-config');
            submit_button();
            ?>
        </form>
    </div>
    <?php
}

function tienda_register_settings() {
    // Supabase
    register_setting('tienda_config_group', 'supabase_url');
    register_setting('tienda_config_group', 'supabase_anon_key');
    
    // MercadoPago
    register_setting('tienda_config_group', 'mercadopago_public_key');
    register_setting('tienda_config_group', 'mercadopago_access_token');
    register_setting('tienda_config_group', 'mercadopago_cvu');
    
    // Contacto
    register_setting('tienda_config_group', 'whatsapp_number');
    register_setting('tienda_config_group', 'instagram_url');
    
    add_settings_section(
        'tienda_supabase_section',
        'Configuración de Supabase',
        null,
        'tienda-config'
    );
    
    add_settings_field('supabase_url', 'URL de Supabase', 'tienda_supabase_url_field', 'tienda-config', 'tienda_supabase_section');
    add_settings_field('supabase_anon_key', 'Anon Key de Supabase', 'tienda_supabase_key_field', 'tienda-config', 'tienda_supabase_section');
    
    add_settings_section(
        'tienda_mercadopago_section',
        'Configuración de MercadoPago',
        null,
        'tienda-config'
    );
    
    add_settings_field('mercadopago_public_key', 'Public Key', 'tienda_mp_public_key_field', 'tienda-config', 'tienda_mercadopago_section');
    add_settings_field('mercadopago_access_token', 'Access Token', 'tienda_mp_access_token_field', 'tienda-config', 'tienda_mercadopago_section');
    add_settings_field('mercadopago_cvu', 'CVU', 'tienda_mp_cvu_field', 'tienda-config', 'tienda_mercadopago_section');
    
    add_settings_section(
        'tienda_contacto_section',
        'Información de Contacto',
        null,
        'tienda-config'
    );
    
    add_settings_field('whatsapp_number', 'Número de WhatsApp', 'tienda_whatsapp_field', 'tienda-config', 'tienda_contacto_section');
    add_settings_field('instagram_url', 'URL de Instagram', 'tienda_instagram_field', 'tienda-config', 'tienda_contacto_section');
}
add_action('admin_init', 'tienda_register_settings');

// Campos de configuración
function tienda_supabase_url_field() {
    $value = get_option('supabase_url');
    echo '<input type="text" name="supabase_url" value="' . esc_attr($value) . '" class="regular-text">';
}

function tienda_supabase_key_field() {
    $value = get_option('supabase_anon_key');
    echo '<input type="text" name="supabase_anon_key" value="' . esc_attr($value) . '" class="regular-text">';
}

function tienda_mp_public_key_field() {
    $value = get_option('mercadopago_public_key');
    echo '<input type="text" name="mercadopago_public_key" value="' . esc_attr($value) . '" class="regular-text">';
}

function tienda_mp_access_token_field() {
    $value = get_option('mercadopago_access_token');
    echo '<input type="text" name="mercadopago_access_token" value="' . esc_attr($value) . '" class="regular-text">';
}

function tienda_mp_cvu_field() {
    $value = get_option('mercadopago_cvu');
    echo '<input type="text" name="mercadopago_cvu" value="' . esc_attr($value) . '" class="regular-text">';
}

function tienda_whatsapp_field() {
    $value = get_option('whatsapp_number');
    echo '<input type="text" name="whatsapp_number" value="' . esc_attr($value) . '" class="regular-text" placeholder="+5491112345678">';
}

function tienda_instagram_field() {
    $value = get_option('instagram_url');
    echo '<input type="url" name="instagram_url" value="' . esc_attr($value) . '" class="regular-text">';
}
