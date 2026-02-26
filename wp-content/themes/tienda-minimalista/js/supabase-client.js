/**
 * Cliente de Supabase para la tienda
 * Gestión de autenticación, productos y órdenes
 */

class SupabaseClient {
    constructor(url, anonKey) {
        this.client = supabase.createClient(url, anonKey);
        this.currentUser = null;
        this.currentTienda = null;
    }

    // ==================== AUTENTICACIÓN ====================
    
    async signUp(email, password, tiendaNombre, userData = {}) {
        try {
            // 1. Crear usuario en Supabase Auth
            const { data: authData, error: authError } = await this.client.auth.signUp({
                email,
                password,
            });

            if (authError) throw authError;

            // 2. Crear tienda
            const { data: tiendaData, error: tiendaError } = await this.client
                .from('tiendas')
                .insert([{
                    nombre: tiendaNombre,
                    slug: this.generateSlug(tiendaNombre),
                    email: email
                }])
                .select()
                .single();

            if (tiendaError) throw tiendaError;

            // 3. Crear perfil de usuario
            const { data: usuarioData, error: usuarioError } = await this.client
                .from('usuarios')
                .insert([{
                    id: authData.user.id,
                    tienda_id: tiendaData.id,
                    email: email,
                    nombre: userData.nombre || email.split('@')[0],
                    rol: 'admin'
                }])
                .select()
                .single();

            if (usuarioError) throw usuarioError;

            return {
                success: true,
                user: authData.user,
                tienda: tiendaData,
                usuario: usuarioData
            };
        } catch (error) {
            console.error('Error en signUp:', error);
            return { success: false, error: error.message };
        }
    }

    async signIn(email, password) {
        try {
            const { data, error } = await this.client.auth.signInWithPassword({
                email,
                password,
            });

            if (error) throw error;

            this.currentUser = data.user;

            // Obtener datos del usuario y tienda
            await this.loadUserData();

            // Actualizar último acceso
            await this.client
                .from('usuarios')
                .update({ ultimo_acceso: new Date().toISOString() })
                .eq('id', data.user.id);

            return { success: true, user: data.user };
        } catch (error) {
            console.error('Error en signIn:', error);
            return { success: false, error: error.message };
        }
    }

    async signOut() {
        try {
            const { error } = await this.client.auth.signOut();
            if (error) throw error;

            this.currentUser = null;
            this.currentTienda = null;

            return { success: true };
        } catch (error) {
            console.error('Error en signOut:', error);
            return { success: false, error: error.message };
        }
    }

    async getCurrentUser() {
        const { data: { user } } = await this.client.auth.getUser();
        return user;
    }

    async loadUserData() {
        try {
            const user = await this.getCurrentUser();
            if (!user) return null;

            // Obtener datos del usuario
            const { data: usuario, error: usuarioError } = await this.client
                .from('usuarios')
                .select('*, tiendas(*)')
                .eq('id', user.id)
                .single();

            if (usuarioError) throw usuarioError;

            this.currentUser = usuario;
            this.currentTienda = usuario.tiendas;

            return usuario;
        } catch (error) {
            console.error('Error al cargar datos del usuario:', error);
            return null;
        }
    }

    // ==================== PRODUCTOS ====================

    async getProductos(filters = {}) {
        try {
            let query = this.client
                .from('productos')
                .select(`
                    *,
                    categorias(nombre, slug),
                    producto_imagenes(url, alt_text, es_principal),
                    variantes(id, talle, color, color_hex, stock, precio_adicional)
                `)
                .eq('activo', true);

            if (filters.tienda_id) {
                query = query.eq('tienda_id', filters.tienda_id);
            }

            if (filters.categoria_id) {
                query = query.eq('categoria_id', filters.categoria_id);
            }

            if (filters.destacado) {
                query = query.eq('destacado', true);
            }

            if (filters.busqueda) {
                query = query.or(`nombre.ilike.%${filters.busqueda}%,descripcion.ilike.%${filters.busqueda}%`);
            }

            if (filters.precio_min) {
                query = query.gte('precio', filters.precio_min);
            }

            if (filters.precio_max) {
                query = query.lte('precio', filters.precio_max);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener productos:', error);
            return { success: false, error: error.message };
        }
    }

    async getProductoById(id) {
        try {
            const { data, error } = await this.client
                .from('productos')
                .select(`
                    *,
                    categorias(nombre, slug),
                    producto_imagenes(url, alt_text, orden, es_principal),
                    variantes(id, talle, color, color_hex, stock, precio_adicional, sku),
                    resenas(id, calificacion, titulo, comentario, cliente_nombre, created_at)
                `)
                .eq('id', id)
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener producto:', error);
            return { success: false, error: error.message };
        }
    }

    async createProducto(productoData) {
        try {
            const { data, error } = await this.client
                .from('productos')
                .insert([{
                    ...productoData,
                    tienda_id: this.currentTienda.id,
                    slug: this.generateSlug(productoData.nombre)
                }])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al crear producto:', error);
            return { success: false, error: error.message };
        }
    }

    async updateProducto(id, productoData) {
        try {
            const { data, error } = await this.client
                .from('productos')
                .update(productoData)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar producto:', error);
            return { success: false, error: error.message };
        }
    }

    async deleteProducto(id) {
        try {
            const { error } = await this.client
                .from('productos')
                .delete()
                .eq('id', id);

            if (error) throw error;

            return { success: true };
        } catch (error) {
            console.error('Error al eliminar producto:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== VARIANTES ====================

    async createVariante(varianteData) {
        try {
            const { data, error } = await this.client
                .from('variantes')
                .insert([varianteData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al crear variante:', error);
            return { success: false, error: error.message };
        }
    }

    async updateStockVariante(varianteId, cantidad) {
        try {
            const { data, error } = await this.client
                .from('variantes')
                .update({ stock: cantidad })
                .eq('id', varianteId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar stock:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== ÓRDENES ====================

    async createOrden(ordenData, items) {
        try {
            // 1. Crear orden
            const { data: orden, error: ordenError } = await this.client
                .from('ordenes')
                .insert([{
                    ...ordenData,
                    tienda_id: this.currentTienda?.id || ordenData.tienda_id
                }])
                .select()
                .single();

            if (ordenError) throw ordenError;

            // 2. Crear items de la orden
            const itemsData = items.map(item => ({
                orden_id: orden.id,
                producto_id: item.producto_id,
                variante_id: item.variante_id,
                nombre_producto: item.nombre,
                sku: item.sku,
                precio_unitario: item.precio,
                cantidad: item.cantidad,
                subtotal: item.precio * item.cantidad,
                talle: item.talle,
                color: item.color
            }));

            const { data: ordenItems, error: itemsError } = await this.client
                .from('orden_items')
                .insert(itemsData)
                .select();

            if (itemsError) throw itemsError;

            return { success: true, data: { orden, items: ordenItems } };
        } catch (error) {
            console.error('Error al crear orden:', error);
            return { success: false, error: error.message };
        }
    }

    async getOrdenes(filters = {}) {
        try {
            let query = this.client
                .from('ordenes')
                .select(`
                    *,
                    orden_items(
                        *,
                        productos(nombre, slug)
                    )
                `);

            if (filters.tienda_id) {
                query = query.eq('tienda_id', filters.tienda_id);
            }

            if (filters.estado) {
                query = query.eq('estado', filters.estado);
            }

            if (filters.email) {
                query = query.eq('cliente_email', filters.email);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener órdenes:', error);
            return { success: false, error: error.message };
        }
    }

    async updateOrdenEstado(ordenId, estado, estadoPago = null) {
        try {
            const updateData = { estado };
            if (estadoPago) {
                updateData.estado_pago = estadoPago;
            }

            const { data, error } = await this.client
                .from('ordenes')
                .update(updateData)
                .eq('id', ordenId)
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al actualizar estado de orden:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== RESEÑAS ====================

    async createResena(resenaData) {
        try {
            const { data, error } = await this.client
                .from('resenas')
                .insert([resenaData])
                .select()
                .single();

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al crear reseña:', error);
            return { success: false, error: error.message };
        }
    }

    async getResenas(productoId, soloAprobadas = true) {
        try {
            let query = this.client
                .from('resenas')
                .select('*')
                .eq('producto_id', productoId);

            if (soloAprobadas) {
                query = query.eq('aprobado', true);
            }

            const { data, error } = await query.order('created_at', { ascending: false });

            if (error) throw error;

            return { success: true, data };
        } catch (error) {
            console.error('Error al obtener reseñas:', error);
            return { success: false, error: error.message };
        }
    }

    // ==================== UTILIDADES ====================

    generateSlug(text) {
        return text
            .toLowerCase()
            .normalize('NFD')
            .replace(/[\u0300-\u036f]/g, '')
            .replace(/[^a-z0-9]+/g, '-')
            .replace(/^-+|-+$/g, '');
    }

    async uploadImage(file, bucket = 'productos') {
        try {
            const fileExt = file.name.split('.').pop();
            const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
            const filePath = `${fileName}`;

            const { data, error } = await this.client.storage
                .from(bucket)
                .upload(filePath, file);

            if (error) throw error;

            const { data: urlData } = this.client.storage
                .from(bucket)
                .getPublicUrl(filePath);

            return { success: true, url: urlData.publicUrl };
        } catch (error) {
            console.error('Error al subir imagen:', error);
            return { success: false, error: error.message };
        }
    }
}

// Exportar para uso en WordPress
if (typeof window !== 'undefined') {
    window.SupabaseClient = SupabaseClient;
}
