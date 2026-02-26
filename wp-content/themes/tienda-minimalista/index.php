<?php get_header(); ?>

<main id="main-content">
    <!-- Hero Section -->
    <section class="hero-section fade-in-up">
        <h1 class="hero-title"><?php bloginfo('name'); ?></h1>
        <p class="hero-subtitle"><?php bloginfo('description'); ?></p>
    </section>

    <!-- Productos Destacados -->
    <section class="products-section">
        <h2 class="section-title">Productos Destacados</h2>
        <?php echo do_shortcode('[productos_destacados cantidad="8"]'); ?>
    </section>

    <!-- Todos los Productos -->
    <section class="products-section">
        <h2 class="section-title">Todos los Productos</h2>
        <div class="products-grid" id="productos-grid">
            <?php
            $args = array(
                'post_type' => 'producto',
                'posts_per_page' => 12,
            );
            
            $query = new WP_Query($args);
            
            if ($query->have_posts()) :
                while ($query->have_posts()) : $query->the_post();
                    get_template_part('template-parts/content', 'producto');
                endwhile;
            else :
                echo '<p>No hay productos disponibles en este momento.</p>';
            endif;
            
            wp_reset_postdata();
            ?>
        </div>
    </section>

    <!-- Reseñas -->
    <section class="reviews-section">
        <h2 class="section-title">Lo que dicen nuestros clientes</h2>
        <div class="reviews-grid">
            <div class="review-card glass-card">
                <div class="review-stars">★★★★★</div>
                <p class="review-text">"Excelente calidad de ropa y atención al cliente. Super recomendable!"</p>
                <p class="review-author">- María G.</p>
            </div>
            <div class="review-card glass-card">
                <div class="review-stars">★★★★★</div>
                <p class="review-text">"Me encanta el diseño minimalista de la tienda. Comprar es muy fácil."</p>
                <p class="review-author">- Carlos R.</p>
            </div>
            <div class="review-card glass-card">
                <div class="review-stars">★★★★★</div>
                <p class="review-text">"Envío rápido y productos exactamente como se muestran. Volveré a comprar."</p>
                <p class="review-author">- Laura P.</p>
            </div>
        </div>
    </section>

    <!-- Contacto -->
    <section class="contact-section">
        <h2 class="section-title">Contáctanos</h2>
        <div class="contact-grid">
            <?php if (get_option('whatsapp_number')) : ?>
            <div class="contact-card glass-card">
                <div class="contact-icon">📱</div>
                <h3>WhatsApp</h3>
                <p>Escríbenos directamente</p>
                <a href="https://wa.me/<?php echo esc_attr(get_option('whatsapp_number')); ?>" class="contact-link" target="_blank">Chatear ahora</a>
            </div>
            <?php endif; ?>
            
            <?php if (get_option('instagram_url')) : ?>
            <div class="contact-card glass-card">
                <div class="contact-icon">📷</div>
                <h3>Instagram</h3>
                <p>Síguenos en Instagram</p>
                <a href="<?php echo esc_url(get_option('instagram_url')); ?>" class="contact-link" target="_blank">Seguir</a>
            </div>
            <?php endif; ?>
            
            <div class="contact-card glass-card">
                <div class="contact-icon">✉️</div>
                <h3>Email</h3>
                <p>Envíanos un mensaje</p>
                <a href="mailto:<?php echo get_option('admin_email'); ?>" class="contact-link">Escribir email</a>
            </div>
        </div>
    </section>
</main>

<?php get_footer(); ?>
