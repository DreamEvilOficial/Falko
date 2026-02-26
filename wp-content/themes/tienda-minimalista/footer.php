<footer class="site-footer">
    <div class="footer-container">
        <div class="footer-section">
            <h3><?php bloginfo('name'); ?></h3>
            <p><?php bloginfo('description'); ?></p>
        </div>
        
        <div class="footer-section">
            <h3>Enlaces Rápidos</h3>
            <?php
            wp_nav_menu(array(
                'theme_location' => 'footer',
                'container' => false,
                'fallback_cb' => function() {
                    echo '<a href="' . home_url('/') . '">Inicio</a>';
                    echo '<a href="' . home_url('/productos') . '">Productos</a>';
                    echo '<a href="' . home_url('/sobre-nosotros') . '">Sobre Nosotros</a>';
                    echo '<a href="' . home_url('/contacto') . '">Contacto</a>';
                },
            ));
            ?>
        </div>
        
        <div class="footer-section">
            <h3>Contacto</h3>
            <?php if (get_option('whatsapp_number')) : ?>
                <a href="https://wa.me/<?php echo esc_attr(get_option('whatsapp_number')); ?>" target="_blank">WhatsApp</a>
            <?php endif; ?>
            <?php if (get_option('instagram_url')) : ?>
                <a href="<?php echo esc_url(get_option('instagram_url')); ?>" target="_blank">Instagram</a>
            <?php endif; ?>
            <a href="mailto:<?php echo get_option('admin_email'); ?>">Email</a>
        </div>
        
        <div class="footer-section">
            <h3>Legal</h3>
            <a href="<?php echo home_url('/terminos-y-condiciones'); ?>">Términos y Condiciones</a>
            <a href="<?php echo home_url('/politica-de-privacidad'); ?>">Política de Privacidad</a>
            <a href="<?php echo home_url('/politica-de-devolucion'); ?>">Política de Devolución</a>
        </div>
    </div>
    
    <div class="footer-bottom" style="text-align: center; margin-top: 2rem; padding-top: 2rem; border-top: 1px solid rgba(255,255,255,0.1);">
        <p>&copy; <?php echo date('Y'); ?> <?php bloginfo('name'); ?>. Todos los derechos reservados.</p>
    </div>
</footer>

<?php wp_footer(); ?>
</body>
</html>
