<?php
/**
 * Template part para mostrar productos individuales
 */

$precio = get_post_meta(get_the_ID(), '_precio', true);
$stock = get_post_meta(get_the_ID(), '_stock', true);
$codigo = get_post_meta(get_the_ID(), '_codigo', true);
$colores = get_the_terms(get_the_ID(), 'color');
$talles = get_the_terms(get_the_ID(), 'talle');
?>

<article class="product-card" 
         data-id="<?php echo get_the_ID(); ?>" 
         data-price="<?php echo esc_attr($precio); ?>"
         data-category="<?php echo esc_attr(get_the_terms(get_the_ID(), 'categoria_producto')[0]->slug ?? ''); ?>"
         data-colors="<?php echo esc_attr(implode(',', wp_list_pluck($colores ?: [], 'slug'))); ?>">
    
    <?php if (has_post_thumbnail()) : ?>
        <img src="<?php echo get_the_post_thumbnail_url(get_the_ID(), 'large'); ?>" 
             alt="<?php the_title(); ?>" 
             class="product-image">
    <?php else : ?>
        <div class="product-image" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); display: flex; align-items: center; justify-content: center; color: white;">
            Sin imagen
        </div>
    <?php endif; ?>
    
    <div class="product-info">
        <h3 class="product-title"><?php the_title(); ?></h3>
        
        <?php if ($precio) : ?>
            <p class="product-price">$<?php echo number_format($precio, 2); ?></p>
        <?php endif; ?>
        
        <?php if ($colores && !is_wp_error($colores)) : ?>
            <div class="product-colors">
                <?php foreach ($colores as $color) : ?>
                    <span class="color-dot" 
                          style="background-color: <?php echo esc_attr($color->slug); ?>;" 
                          title="<?php echo esc_attr($color->name); ?>"></span>
                <?php endforeach; ?>
            </div>
        <?php endif; ?>
        
        <?php if ($talles && !is_wp_error($talles)) : ?>
            <div class="product-sizes" style="margin-top: 0.5rem; font-size: 0.875rem; color: #666;">
                Talles: <?php echo implode(', ', wp_list_pluck($talles, 'name')); ?>
            </div>
        <?php endif; ?>
        
        <?php if ($stock && $stock > 0) : ?>
            <button class="btn add-to-cart-btn" style="width: 100%; margin-top: 1rem;">
                Agregar al carrito
            </button>
        <?php else : ?>
            <button class="btn" disabled style="width: 100%; margin-top: 1rem; opacity: 0.5;">
                Sin stock
            </button>
        <?php endif; ?>
        
        <a href="<?php the_permalink(); ?>" class="btn-secondary" style="display: block; text-align: center; margin-top: 0.5rem; padding: 0.5rem;">
            Ver detalles
        </a>
    </div>
</article>
