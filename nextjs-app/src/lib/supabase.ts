
import { createClient as createSupabaseClient } from '@supabase/supabase-js'

// Cliente público para el navegador
const publicUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co'
const publicAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder'

export const supabase = createSupabaseClient(publicUrl, publicAnonKey)

// Cliente con permisos de admin (Service Role) para usar SOLO en el servidor
const adminUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL
const adminKey = process.env.SUPABASE_SERVICE_ROLE_KEY

export const supabaseAdmin = (adminUrl && adminKey) 
  ? createSupabaseClient(adminUrl, adminKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    }) 
  : null


export interface Producto {
  id: string
  nombre: string
  slug?: string
  descripcion: string
  precio: number
  precio_original?: number | null
  descuento_porcentaje?: number
  stock_actual: number
  stock_minimo?: number
  categoria_id?: string
  subcategoria_id?: string
  imagen_url?: string
  imagenes?: string[]
  variantes?: {talle: string, color: string, color_nombre?: string, stock: number, imagen_url?: string}[]
  activo: boolean
  destacado: boolean
  top: boolean
  proximo_lanzamiento?: boolean
  proximamente?: boolean
  nuevo_lanzamiento?: boolean
  descuento_activo?: boolean | number
  fecha_lanzamiento?: string | null
  sku?: string | null
  peso?: number | null
  dimensiones?: any
  proveedor_nombre?: string
  proveedor_contacto?: string
  precio_costo?: number
  metadata?: any
  created_at: string
  updated_at?: string
  drops?: Drop[]
}

export interface Drop {
  id: string
  nombre: string
  slug: string
  fecha_lanzamiento?: string
  descripcion?: string
  imagen_url?: string
  activo: boolean
  created_at?: string
  updated_at?: string
}

export interface Categoria {
  id: string
  nombre: string
  slug: string
  imagen_url?: string
  activo: boolean
  orden: number
  subcategorias?: Subcategoria[]
}

export interface Subcategoria {
  id: string
  categoria_id: string
  nombre: string
  slug: string
  activo: boolean
  orden: number
}

export interface Etiqueta {
  id: string
  nombre: string
  tipo: string
  color: string
  icono: string
}

export interface Orden {
  id: string
  numero_orden: string
  cliente_nombre: string
  cliente_email: string
  cliente_telefono?: string
  direccion_envio?: string
  envio?: number
  subtotal?: number
  descuento?: number
  total: number
  estado: string
  metodo_pago?: string
  mercadopago_payment_id?: number
  notas?: string
  items?: any[]
  tracking_code?: string
  total_transferencia?: number
  coupon_code?: string
  created_at: string
}

export interface Cupon {
  id: string
  codigo: string
  tipo: 'porcentaje' | 'fijo'
  valor: number
  descripcion?: string | null
  activo: boolean
  minimo_compra?: number | null
  max_uso_total?: number | null
  usos_actuales?: number | null
  valido_hasta?: string | null
  created_at?: string
  updated_at?: string
}

// Helper para fetch
async function apiFetch(endpoint: string, options: RequestInit = {}) {
  // 1. Construir URL con prefijo /api y timestamp para evitar cache
  const separator = endpoint.includes('?') ? '&' : '?';
  const url = endpoint.startsWith('/') 
    ? `/api${endpoint}${options.method === 'GET' || !options.method ? `${separator}t=${Date.now()}` : ''}` 
    : `/api/${endpoint}${options.method === 'GET' || !options.method ? `${separator}t=${Date.now()}` : ''}`;

  try {
    const res = await fetch(url, {
      cache: 'no-store',
      ...options,
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      }
    });

    const data = await res.json();

    if (!res.ok) {
      console.error(`[apiFetch] Error ${res.status} (${url}):`, data);
      throw new Error(data.error || data.message || `Error ${res.status}`);
    }

    return data;
  } catch (error: any) {
    console.error(`[apiFetch] Fetch Error (${url}):`, error.message);
    
    // Devolvemos un array vacío como fallback seguro para evitar .map() errors si es un GET de listas
    if (!options.method || options.method === 'GET') {
      const isListEndpoint = ['products', 'categories', 'tags', 'orders', 'debts', 'sections', 'reviews'].some(e => url.includes(e));
      if (isListEndpoint) {
        return [];
      }
    }
    throw error;
  }
}

export const productosAPI = {
  async obtenerTodos() {
    return apiFetch('/products?active=true') as Promise<Producto[]>;
  },
  
  async obtenerPorSlug(slug: string) {
    const list = await apiFetch(`/products?slug=${encodeURIComponent(slug)}&active=true&limit=1`) as Producto[];
    return Array.isArray(list) ? (list[0] as Producto | undefined) : undefined;
  },
  
  async obtenerTodosAdmin() {
    return apiFetch('/products?admin=true') as Promise<Producto[]>;
  },

  async obtenerDestacados() {
    return apiFetch('/products?destacado=true&limit=8') as Promise<Producto[]>;
  },

  async obtenerTOP() {
    return apiFetch('/products?top=true&limit=6') as Promise<Producto[]>;
  },

  async obtenerPorId(id: string) {
    return apiFetch(`/products/${id}`) as Promise<Producto>;
  },

  async crear(producto: Partial<Producto>) {
    return apiFetch('/products', {
        method: 'POST',
        body: JSON.stringify(producto)
    }) as Promise<Producto>;
  },

  async actualizar(id: string, producto: Partial<Producto>) {
    return apiFetch(`/products/${id}`, {
        method: 'PUT',
        body: JSON.stringify(producto)
    }) as Promise<Producto>;
  },

  async eliminar(id: string) {
    return apiFetch(`/products/${id}`, {
        method: 'DELETE'
    });
  },

  async obtenerPorCategoria(slug: string) {
    return apiFetch(`/products?category_slug=${slug}`) as Promise<Producto[]>;
  }
}

export const ordenesAPI = {
  async crear(orden: Partial<Orden>) {
     // Implementar ordenes API route
     return apiFetch('/orders', {
        method: 'POST',
        body: JSON.stringify(orden)
     }) as Promise<Orden>;
  },

  async obtenerPorEmail(email: string) {
     return apiFetch(`/orders?email=${email}`) as Promise<Orden[]>;
  }
}

export const cuponesAPI = {
  async listar() {
    return apiFetch('/coupons') as Promise<Cupon[]>;
  },

  async crear(cupon: Partial<Cupon>) {
    return apiFetch('/coupons', {
      method: 'POST',
      body: JSON.stringify(cupon),
    }) as Promise<Cupon>;
  },

  async actualizar(id: string, cupon: Partial<Cupon>) {
    return apiFetch(`/coupons/${id}`, {
      method: 'PUT',
      body: JSON.stringify(cupon),
    }) as Promise<Cupon>;
  },

  async eliminar(id: string) {
    return apiFetch(`/coupons/${id}`, {
      method: 'DELETE',
    });
  },
}

export const authAPI = {
  async signUp(email: string, password: string) {
    // throw new Error("Registro deshabilitado por el momento");
     return apiFetch('/auth/signup', {
         method: 'POST',
         body: JSON.stringify({ email, password })
     });
  },

  async signIn(email: string, password: string) {
     const { user } = await apiFetch('/auth/login', {
         method: 'POST',
         body: JSON.stringify({ email, password })
     });
     return { user, session: { user } }; // Adapt to match expected supabase return shape roughly
  },

  async signOut() {
    await apiFetch('/auth/logout', { method: 'POST' });
  },

  async getUser() {
    const { user } = await apiFetch('/auth/me');
    return user ? { user } : { user: null };
  }
}

export const categoriasAPI = {
  async obtenerTodas() {
    return apiFetch('/categories') as Promise<Categoria[]>;
  },

  async crear(categoria: Partial<Categoria>) {
    return apiFetch('/categories', { method: 'POST', body: JSON.stringify(categoria) });
  },

  async crearSubcategoria(subcategoria: Partial<Subcategoria>) {
    return apiFetch('/categories/sub', { method: 'POST', body: JSON.stringify(subcategoria) });
  },
  
  async eliminar(id: string) {
     return apiFetch(`/categories/${id}`, { method: 'DELETE' });
  },

  async eliminarSubcategoria(id: string) {
     return apiFetch(`/categories/sub/${id}`, { method: 'DELETE' });
  }
}

export const etiquetasAPI = {
  async obtenerTodas() {
    return apiFetch('/tags') as Promise<Etiqueta[]>;
  },

  async asignarProducto(productoId: string, etiquetaId: string) {
     // TODO
  },

  async desasignarProducto(productoId: string, etiquetaId: string) {
     // TODO
  },

  async obtenerPorProducto(productoId: string) {
    return [] as string[]; // TODO
  }
}

export const deudasAPI = {
  async obtenerTodas() {
    return apiFetch('/debts');
  },
  
  async crear(cliente: any) {
    return apiFetch('/debts', {
      method: 'POST',
      body: JSON.stringify(cliente)
    });
  },
  
  async agregarMovimiento(data: {
    id: string,
    monto: number,
    descripcion: string,
    tipo: 'deuda' | 'pago',
    producto?: string,
    fecha?: string,
    cuotas?: number,
    frecuencia?: string,
    frecuenciaDias?: number
  }) {
    return apiFetch('/debts', {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  },
  
  async enviarRecordatorio(data: { id: string, via: 'manual' | 'automatico', mensaje?: string, fecha?: string }) {
    return apiFetch('/debts', {
      method: 'PUT',
      body: JSON.stringify({
        action: 'recordatorio',
        ...data
      })
    })
  },
  
  async eliminar(id: string) {
    return apiFetch(`/debts?id=${id}`, {
      method: 'DELETE'
    });
  }
}
