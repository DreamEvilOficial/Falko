<?php
/**
 * Single Product Template
 * Página individual de producto
 */

get_header();

if (have_posts()) :
    while (have_posts()) : the_post();
        $precio = get_post_meta(get_the_ID(), '_precio', true);
        $stock = get_post_meta(get_the_ID(), '_stock', true);
        $codigo = get_post_meta(get_the_ID(), '_codigo', true);
        $colores = get_the_terms(get_the_ID(), 'color');
        $talles = get_the_terms(get_the_ID(), 'talle');
        ?>
        
        <article class="product-single" style="max-width: 1400px; margin: 2rem auto; padding: 2rem;">
            <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 3rem;">
                
                <!-- Galería de Imágenes -->
                <div class="product-gallery">
                    <?php if (has_post_thumbnail()) : ?>
                        <div class="main-image glass-card" style="margin-bottom: 1rem;">
                            <?php the_post_thumbnail('large', ['style' => 'width: 100%; border-radius: 16px;']); ?>
                        </div>
                    <?php endif; ?>
                </div>
                
                <!-- Información del Producto -->
                <div class="product-details">
                    <h1 style="font-size: 2.5rem; margin-bottom: 1rem;"><?php the_title(); ?></h1>
                    
                    <?php if ($precio) : ?>
                        <p class="product-price" style="font-size: 2rem; font-weight: 700; margin-bottom: 2rem;">
                            $<?php echo number_format($precio, 2); ?>
                        </p>
                    <?php endif; ?>
                    
                    <div class="product-description" style="margin-bottom: 2rem; line-height: 1.8;">
                        <?php the_content(); ?>
                    </div>
                    
                    <?php if ($codigo) : ?>
                        <p style="margin-bottom: 1rem; color: #666;">
                            <strong>Código:</strong> <?php echo esc_html($codigo); ?>
                        </p>
                    <?php endif; ?>
                    
                    <!-- Selección de Talle -->
                    <?php if ($talles && !is_wp_error($talles)) : ?>
                        <div style="margin-bottom: 2rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Talle:</label>
                            <div style="display: flex; gap: 0.5rem; flex-wrap: wrap;">
                                <?php foreach ($talles as $talle) : ?>
                                    <button class="size-option" style="padding: 0.5rem 1rem; border: 2px solid #000; background: white; border-radius: 8px; cursor: pointer;" 
                                            onclick="selectSize(this, '<?php echo esc_attr($talle->slug); ?>')">
                                        <?php echo esc_html($talle->name); ?>
                                    </button>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Selección de Color -->
                    <?php if ($colores && !is_wp_error($colores)) : ?>
                        <div style="margin-bottom: 2rem;">
                            <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Color:</label>
                            <div style="display: flex; gap: 1rem;">
                                <?php foreach ($colores as $color) : ?>
                                    <button class="color-option" 
                                            style="width: 40px; height: 40px; border-radius: 50%; border: 3px solid transparent; background-color: <?php echo esc_attr($color->slug); ?>; cursor: pointer;"
                                            onclick="selectColor(this, '<?php echo esc_attr($color->slug); ?>')"
                                            title="<?php echo esc_attr($color->name); ?>">
                                    </button>
                                <?php endforeach; ?>
                            </div>
                        </div>
                    <?php endif; ?>
                    
                    <!-- Cantidad -->
                    <div style="margin-bottom: 2rem;">
                        <label style="display: block; margin-bottom: 0.5rem; font-weight: 600;">Cantidad:</label>
                        <div style="display: flex; align-items: center; gap: 1rem;">
                            <button onclick="changeQuantity(-1)" style="width: 40px; height: 40px; border: 2px solid #000; background: white; border-radius: 50%; font-size: 1.25rem; cursor: pointer;">-</button>
                            <input type="number" id="quantity" value="1" min="1" max="<?php echo esc_attr($stock); ?>" style="width: 80px; text-align: center; padding: 0.5rem; border: 2px solid #000; border-radius: 8px; font-size: 1.125rem;">
                            <button onclick="changeQuantity(1)" style="width: 40px; height: 40px; border: 2px solid #000; background: white; border-radius: 50%; font-size: 1.25rem; cursor: pointer;">+</button>
                        </div>
                    </div>
                    
                    <!-- Stock -->
                    <?php if ($stock) : ?>
                        <p style="margin-bottom: 2rem; color: <?php echo $stock > 10 ? '#28a745' : '#dc3545'; ?>;">
                            <?php if ($stock > 10) : ?>
                                ✓ En stock
                            <?php else : ?>
                                ⚠️ Solo quedan <?php echo $stock; ?> unidades
                            <?php endif; ?>
                        </p>
                    <?php endif; ?>
                    
                    <!-- Botón de Compra -->
                    <?php if ($stock && $stock > 0) : ?>
                        <button class="btn" 
                                style="width: 100%; padding: 1rem; font-size: 1.125rem; margin-bottom: 1rem;"
                                onclick="addToCartFromSingle()">
                            Agregar al Carrito
                        </button>
                    <?php else : ?>
                        <button class="btn" disabled style="width: 100%; padding: 1rem; font-size: 1.125rem; opacity: 0.5; cursor: not-allowed;">
                            Sin Stock
                        </button>
                    <?php endif; ?>
                    
                    <!-- Información Adicional -->
                    <div class="glass-card" style="padding: 1.5rem; margin-top: 2rem;">
                        <h3 style="margin-bottom: 1rem;">Información de Envío</h3>
                        <ul style="list-style: none; padding: 0;">
                            <li style="margin-bottom: 0.5rem;">📦 Envío gratis en compras superiores a $10,000</li>
                            <li style="margin-bottom: 0.5rem;">🚚 Envío a todo el país</li>
                            <li style="margin-bottom: 0.5rem;">↩️ Devoluciones gratis dentro de 30 días</li>
                            <li style="margin-bottom: 0.5rem;">💳 Hasta 12 cuotas sin interés</li>
                        </ul>
                    </div>
                </div>
            </div>
        </article>
        
        <script>
        let selectedSize = null;
        let selectedColor = null;
        
        function selectSize(button, size) {
            document.querySelectorAll('.size-option').forEach(btn => {
                btn.style.background = 'white';
                btn.style.color = '#000';
            });
            button.style.background = '#000';
            button.style.color = 'white';
            selectedSize = size;
        }
        
        function selectColor(button, color) {
            document.querySelectorAll('.color-option').forEach(btn => {
                btn.style.borderColor = 'transparent';
            });
            button.style.borderColor = '#000';
            selectedColor = color;
        }
        
        function changeQuantity(delta) {
            const input = document.getElementById('quantity');
            const newValue = parseInt(input.value) + delta;
            const max = parseInt(input.max);
            
            if (newValue >= 1 && newValue <= max) {
                input.value = newValue;
            }
        }
        
        function addToCartFromSingle() {
            const quantity = parseInt(document.getElementById('quantity').value);
            
            const productData = {
                title: '<?php echo esc_js(get_the_title()); ?>',
                price: <?php echo $precio; ?>,
                image: '<?php echo esc_js(get_the_post_thumbnail_url(get_the_ID(), 'medium')); ?>',
                size: selectedSize,
                color: selectedColor
            };
            
            // Agregar múltiples unidades
            for (let i = 0; i < quantity; i++) {
                tiendaApp.addToCart(<?php echo get_the_ID(); ?>, productData);
            }
            
            // Mostrar mensaje de éxito
            alert(`${quantity} ${quantity > 1 ? 'productos agregados' : 'producto agregado'} al carrito`);
        }
        </script>
        
        <?php
    endwhile;
endif;

get_footer();
?>
