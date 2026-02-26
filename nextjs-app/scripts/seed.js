import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://ybxhrcclufxpfraxpvdl.supabase.co'
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlieGhyY2NsdWZ4cGZyYXhwdmRsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjQ3OTk3NzYsImV4cCI6MjA4MDM3NTc3Nn0.J1YXv0v63CwvKY9X78ftqJ4sHlP3m85-9JFlz8jbS6A'

const supabase = createClient(supabaseUrl, supabaseKey)

const productos = [
  {
    nombre: 'Camiseta Básica Blanca',
    descripcion: 'Camiseta de algodón 100% orgánico, corte clásico y elegante. Perfecta para cualquier ocasión.',
    precio: 2500,
    stock_actual: 50,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Camiseta Negra Premium',
    descripcion: 'Camiseta de alta calidad con acabado suave. Diseño minimalista atemporal.',
    precio: 2800,
    stock_actual: 45,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Camiseta Gris Melange',
    descripcion: 'Tejido suave y transpirable. Ideal para uso diario con estilo urbano.',
    precio: 2400,
    stock_actual: 60,
    destacado: false,
    activo: true
  },
  {
    nombre: 'Pantalón Chino Beige',
    descripcion: 'Corte moderno y cómodo. Material resistente y elegante para look casual-formal.',
    precio: 4500,
    stock_actual: 30,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Jean Slim Fit Negro',
    descripcion: 'Denim de alta calidad con elasticidad. Ajuste perfecto y duradero.',
    precio: 5200,
    stock_actual: 40,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Pantalón Jogger Gris',
    descripcion: 'Estilo deportivo-urbano con cintura elástica. Comodidad y versatilidad.',
    precio: 3800,
    stock_actual: 35,
    destacado: false,
    activo: true
  },
  {
    nombre: 'Hoodie Negro Minimalista',
    descripcion: 'Sudadera con capucha, algodón premium. Diseño limpio sin logos visibles.',
    precio: 5500,
    stock_actual: 25,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Sweater Crewneck Beige',
    descripcion: 'Cuello redondo clásico, tejido suave. Perfecto para entretiempo.',
    precio: 4800,
    stock_actual: 30,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Chaqueta Denim Clásica',
    descripcion: 'Jacket de mezclilla atemporal. Diseño versátil para todas las estaciones.',
    precio: 7500,
    stock_actual: 20,
    destacado: false,
    activo: true
  },
  {
    nombre: 'Bomber Jacket Negro',
    descripcion: 'Chaqueta bomber con cierre. Estilo urbano contemporáneo.',
    precio: 8200,
    stock_actual: 15,
    destacado: true,
    activo: true
  },
  {
    nombre: 'Gorra Minimalista',
    descripcion: 'Gorra ajustable de 6 paneles. Diseño simple y elegante.',
    precio: 1800,
    stock_actual: 50,
    destacado: false,
    activo: true
  },
  {
    nombre: 'Mochila Urbana',
    descripcion: 'Mochila resistente al agua con compartimento para laptop. Diseño funcional.',
    precio: 6500,
    stock_actual: 20,
    destacado: false,
    activo: true
  }
]

async function seedProductos() {
  console.log('🌱 Iniciando seed de productos...')
  
  const { data, error } = await supabase
    .from('productos')
    .insert(productos)
    .select()
  
  if (error) {
    console.error('❌ Error insertando productos:', error)
    return
  }
  
  console.log('✅ Productos insertados correctamente:', data.length)
  console.log('📦 Productos:')
  data.forEach(p => console.log(`   - ${p.nombre} ($${p.precio})`))
}

seedProductos()
