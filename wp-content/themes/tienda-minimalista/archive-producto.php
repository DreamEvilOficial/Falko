<?php
/**
 * Archive template for productos
 * Listado de todos los productos
 */

get_header();
?>

<main id="main-content" style="max-width: 1400px; margin: 0 auto; padding: 2rem;">
    
    <div class="archive-header" style="text-align: center; margin-bottom: 3rem;">
        <h1 style="font-size: 3rem; margin-bottom: 1rem;">Todos los Productos</h1>
        <p style="font-size: 1.125rem; color: #666;">Descubre nuestra colección completa</p>
    </div>
    
    <!-- Filtros -->
    <div class="filters glass-card" style="padding: 1.5rem; margin-bottom: 2rem; display: flex; gap: 1rem; flex-wrap: wrap; align-items: center;">
        <div>
            <label style="font-weight: 600; margin-right: 0.5rem;">Categoría:</label>
            <select id="filter-category" onchange="applyFilters()" style="padding: 0.5rem; border-radius: 8px; border: 2px solid #ddd;">
                <option value="">Todas</option>
                <?php
                $categorias = get_terms(array('taxonomy' => 'categoria_producto', 'hide_empty' => false));
                foreach ($categorias as $cat) {
                    echo '<option value="' . esc_attr($cat->slug) . '">' . esc_html($cat->name) . '</option>';
                }
                ?>
            </select>
        </div>
        
        <div>
            <label style="font-weight: 600; margin-right: 0.5rem;">Ordenar:</label>
            <select id="filter-sort" onchange="applyFilters()" style="padding: 0.5rem; border-radius: 8px; border: 2px solid #ddd;">
                <option value="date">Más recientes</option>
                <option value="price-low">Precio: Menor a Mayor</option>
                <option value="price-high">Precio: Mayor a Menor</option>
                <option value="name">Nombre A-Z</option>
            </select>
        </div>
        
        <div style="margin-left: auto;">
            <input type="search" id="search-products" placeholder="Buscar productos..." 
                   onkeyup="searchProducts()" 
                   style="padding: 0.5rem 1rem; border-radius: 50px; border: 2px solid #ddd; min-width: 250px;">
        </div>
    </div>
    
    <!-- Grid de Productos -->
    <div class="products-grid">
        <?php
        if (have_posts()) :
            while (have_posts()) : the_post();
                get_template_part('template-parts/content', 'producto');
            endwhile;
        else :
            echo '<p style="text-align: center; padding: 3rem;">No se encontraron productos.</p>';
        endif;
        ?>
    </div>
    
    <!-- Paginación -->
    <div class="pagination" style="margin-top: 3rem; text-align: center;">
        <?php
        the_posts_pagination(array(
            'mid_size' => 2,
            'prev_text' => '← Anterior',
            'next_text' => 'Siguiente →',
        ));
        ?>
    </div>
    
</main>

<script>
function applyFilters() {
    const category = document.getElementById('filter-category').value;
    const sort = document.getElementById('filter-sort').value;
    
    let url = new URL(window.location);
    
    if (category) {
        url.searchParams.set('categoria', category);
    } else {
        url.searchParams.delete('categoria');
    }
    
    if (sort) {
        url.searchParams.set('ordenar', sort);
    } else {
        url.searchParams.delete('ordenar');
    }
    
    window.location = url;
}

function searchProducts() {
    const searchTerm = document.getElementById('search-products').value.toLowerCase();
    const products = document.querySelectorAll('.product-card');
    
    products.forEach(product => {
        const title = product.querySelector('.product-title').textContent.toLowerCase();
        if (title.includes(searchTerm)) {
            product.style.display = 'block';
        } else {
            product.style.display = 'none';
        }
    });
}
</script>

<?php
get_footer();
?>
