import { useState } from 'react'
import { formatPrice } from '@/lib/formatters'
import { Plus, Edit, Trash2, Search, Filter } from 'lucide-react'
import { Producto, Drop } from '@/lib/supabase'
import NextImage from 'next/image'

interface ProductListProps {
  productos: Producto[]
  categorias: any[]
  drops?: Drop[]
  onEdit: (producto: Producto) => void
  onDelete: (id: string) => void
  onNew: () => void
}

export default function ProductList({ productos, categorias, drops, onEdit, onDelete, onNew }: ProductListProps) {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('todos')
  const [dropFilter, setDropFilter] = useState('todos')
  const [stockFilter, setStockFilter] = useState('todos') // todos, bajo, agotado
  const [statusFilter, setStatusFilter] = useState('todos') // todos, activos, inactivos

  const filteredProducts = (productos || []).filter(p => {
    if (!p || !p.nombre) return false;
    const matchesSearch = p.nombre.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()))
    const matchesCategory = categoryFilter === 'todos' || p.categoria_id === categoryFilter
    
    let matchesDrop = true
    if (dropFilter !== 'todos') {
      const pDrops = (p as any).drops || []
      matchesDrop = pDrops.some((d: any) => d.id === dropFilter)
    }
    
    let matchesStock = true
    if (stockFilter === 'bajo') matchesStock = (p.stock_actual || 0) > 0 && (p.stock_actual || 0) < 5
    if (stockFilter === 'agotado') matchesStock = (p.stock_actual || 0) <= 0
    
    let matchesStatus = true
    if (statusFilter === 'activos') matchesStatus = !!p.activo
    if (statusFilter === 'inactivos') matchesStatus = !p.activo

    return matchesSearch && matchesCategory && matchesDrop && matchesStock && matchesStatus
  })

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <h1 className="font-display text-3xl tracking-[0.08em] uppercase text-white">
          Productos <span className="text-white/40 text-base font-sans font-black tracking-[0.25em]">({productos.length})</span>
        </h1>
        <button
          onClick={onNew}
          className="flex items-center gap-2 px-5 py-3 bg-accent text-ink rounded-2xl transition shadow-[0_18px_50px_-30px_rgba(183,255,42,0.6)] hover:brightness-95 active:scale-[0.99]"
        >
          <Plus className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-[0.28em]">Nuevo Producto</span>
        </button>
      </div>

      {/* Filtros Avanzados */}
      <div className="bg-[#06070c]/70 backdrop-blur-2xl p-6 rounded-[28px] shadow-[0_30px_100px_-70px_rgba(0,0,0,0.8)] border border-white/10 flex flex-col gap-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white/45 w-5 h-5" />
            <input
              type="text"
              placeholder="Buscar por nombre o SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-sm font-bold focus:border-accent/40 transition outline-none"
            />
          </div>
          <button
            onClick={() => {
              setSearchTerm('')
              setCategoryFilter('todos')
              setDropFilter('todos')
              setStockFilter('todos')
              setStatusFilter('todos')
            }}
            className="px-6 py-3 text-[10px] font-black uppercase tracking-[0.35em] text-white/45 hover:text-white transition"
          >
            Limpiar Filtros
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/45 tracking-[0.35em] px-1">Categoría</label>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-3 bg-white/[0.03] border border-white/10 rounded-2xl text-xs font-bold outline-none cursor-pointer focus:border-accent/40 transition appearance-none"
            >
              <option value="todos">Todas las categorías</option>
              {categorias.map(cat => (
                <option key={cat.id} value={cat.id}>{cat.nombre}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/45 tracking-[0.35em] px-1">Nivel de Stock</label>
            <div className="flex gap-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'bajo', label: 'Bajo Stock' },
                { id: 'agotado', label: 'Sin Stock' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStockFilter(opt.id)}
                  className={`flex-1 py-3 px-2 rounded-2xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                    stockFilter === opt.id ? 'bg-white text-black border-white' : 'bg-white/[0.02] text-white/55 border-white/10 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-white/45 tracking-[0.35em] px-1">Estado</label>
            <div className="flex gap-2">
              {[
                { id: 'todos', label: 'Todos' },
                { id: 'activos', label: 'En Venta' },
                { id: 'inactivos', label: 'Pausados' }
              ].map(opt => (
                <button
                  key={opt.id}
                  onClick={() => setStatusFilter(opt.id)}
                  className={`flex-1 py-3 px-2 rounded-2xl text-[9px] font-black uppercase tracking-tighter border transition-all ${
                    statusFilter === opt.id ? 'bg-white text-black border-white' : 'bg-white/[0.02] text-white/55 border-white/10 hover:border-white/20'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Vista Móvil (Tarjetas) */}
      <div className="grid grid-cols-1 gap-4 md:hidden">
        {filteredProducts.length > 0 ? (
          filteredProducts.map((producto) => {
            const getSafeImage = (p: Producto) => {
              const url = p.imagen_url || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : null)
              if (!url) return '/urban.png'
              // Si es una URL completa que no es de supabase ni relativa, fallback
              if (url.startsWith('http') && !url.includes('supabase.co')) return '/urban.png'
              return url
            }
            const img = getSafeImage(producto)
            
            return (
              <div key={producto.id} className="bg-[#06070c]/70 backdrop-blur-2xl border border-white/10 p-5 rounded-3xl shadow-lg relative overflow-hidden">
                <div className="flex items-start gap-4">
                  <div className="h-20 w-20 rounded-2xl overflow-hidden shadow-sm border border-white/10 flex-shrink-0 bg-white/[0.02] relative">
                    {img.startsWith('/') || img.includes('supabase.co') ? (
                      <NextImage 
                        className="h-full w-full object-cover" 
                        src={img} 
                        alt={producto.nombre} 
                        fill
                        sizes="80px"
                      />
                    ) : (
                      <img 
                        className="h-full w-full object-cover" 
                        src={img} 
                        alt={producto.nombre} 
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-start">
                      <h3 className="text-sm font-bold text-white truncate pr-2">{producto.nombre}</h3>
                      <div className="flex gap-2">
                        <button 
                          onClick={() => onEdit(producto)}
                          className="p-2 bg-white/[0.05] rounded-xl text-white/70 hover:text-white"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button 
                          onClick={() => onDelete(producto.id)}
                          className="p-2 bg-white/[0.05] rounded-xl text-white/70 hover:text-red-400"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.2em] mb-2">{producto.sku || 'SIN-REF'}</p>
                    
                    <div className="flex flex-wrap gap-2 mb-3">
                       <span className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg bg-white/[0.03] text-white/60 border border-white/10">
                        {categorias.find(c => c.id === producto.categoria_id)?.nombre || 'General'}
                       </span>
                       {producto.activo ? (
                          <span className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">En Venta</span>
                       ) : (
                          <span className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg bg-red-500/10 text-red-400 border border-red-500/20">Pausado</span>
                       )}
                       {Array.isArray((producto as any).drops) && (producto as any).drops.length > 0 && (
                         <span className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg bg-accent/10 text-accent border border-accent/40">
                           {(producto as any).drops[0].nombre}
                         </span>
                       )}
                    </div>

                    <div className="flex justify-between items-end">
                       <div>
                          <p className="text-[9px] font-black text-white/35 uppercase tracking-wider mb-0.5">Precio</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-lg font-black text-white">
                              ${ formatPrice(producto.precio) }
                            </span>
                            {producto.precio_original && (
                              <span className="text-xs text-white/35 line-through font-bold">
                                ${ formatPrice(producto.precio_original) }
                              </span>
                            )}
                          </div>
                       </div>
                       <div className="text-right">
                          <p className="text-[9px] font-black text-white/35 uppercase tracking-wider mb-0.5">Stock</p>
                          {producto.stock_actual <= 0 ? (
                            <span className="text-xs font-black text-red-500">Agotado</span>
                          ) : (
                            <span className={`text-xs font-black ${producto.stock_actual < 10 ? 'text-orange-500' : 'text-emerald-400'}`}>
                              {producto.stock_actual} un.
                            </span>
                          )}
                       </div>
                    </div>
                  </div>
                </div>
              </div>
            )
          })
        ) : (
          <div className="px-6 py-12 text-center bg-[#06070c]/70 rounded-3xl border border-dashed border-white/10">
            <Filter className="w-8 h-8 text-white/15 mx-auto mb-3" />
            <p className="text-sm font-bold text-white">No hay productos</p>
          </div>
        )}
      </div>

      {/* Tabla Desktop */}
      <div className="hidden md:block bg-[#06070c]/70 backdrop-blur-2xl rounded-[28px] border border-white/10 shadow-[0_30px_120px_-80px_rgba(0,0,0,0.9)] overflow-hidden w-full">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-white/[0.03]">
              <tr>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em]">Producto</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em]">Tipo</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em]">Drop</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em] whitespace-nowrap">Precio Venta</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em] whitespace-nowrap">Disponibilidad</th>
                <th className="px-4 py-3 text-left text-[10px] font-black text-white/45 uppercase tracking-[0.35em]">Estado</th>
                <th className="px-4 py-3 text-right text-[10px] font-black text-white/45 uppercase tracking-[0.35em] whitespace-nowrap w-[140px]">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {filteredProducts.length > 0 ? (
                filteredProducts.map((producto) => {
                  const getSafeImage = (p: Producto) => {
                    const url = p.imagen_url || (p.imagenes && p.imagenes.length > 0 ? p.imagenes[0] : null)
                    if (!url) return '/urban.png'
                    if (url.startsWith('http') && !url.includes('supabase.co')) return '/urban.png'
                    return url
                  }
                  const img = getSafeImage(producto)
                  
                  return (
                  <tr key={producto.id} className="group hover:bg-white/[0.03] transition-colors">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center gap-4">
                        <div className="h-12 w-12 rounded-xl overflow-hidden shadow-sm border border-white/10 flex-shrink-0 bg-white/[0.02] relative">
                          {img.startsWith('/') || img.includes('supabase.co') ? (
                            <NextImage 
                              className="h-full w-full object-cover transition group-hover:scale-110" 
                              src={img} 
                              alt={producto.nombre} 
                              fill
                              sizes="48px"
                            />
                          ) : (
                            <img 
                              className="h-full w-full object-cover transition group-hover:scale-110" 
                              src={img} 
                              alt={producto.nombre} 
                            />
                          )}
                        </div>
                        <div>
                          <div className="text-xs font-bold text-white transition">{producto.nombre}</div>
                          <div className="text-[9px] font-black text-white/45 uppercase tracking-[0.35em]">{producto.sku || 'SIN-REF'}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <span className="px-2 py-1 text-[8px] font-black uppercase tracking-[0.32em] rounded-full bg-white/[0.03] text-white/60 border border-white/10">
                        {categorias.find(c => c.id === producto.categoria_id)?.nombre || 'General'}
                      </span>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {Array.isArray((producto as any).drops) && (producto as any).drops.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {(producto as any).drops.map((d: any) => (
                            <span key={d.id} className="px-2 py-1 text-[8px] font-black uppercase tracking-wider rounded-lg bg-accent/10 text-accent border border-accent/40">
                              {d.nombre}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-[9px] font-bold text-white/20 uppercase tracking-wider">-</span>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col">
                        <span className="text-xs font-black text-white">
                          ${formatPrice(producto.precio)}
                        </span>
                        {producto.precio_original && (
                          <span className="text-[9px] text-white/35 line-through font-bold">
                            ${formatPrice(producto.precio_original)}
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      {producto.stock_actual <= 0 ? (
                        <div className="flex flex-col gap-1">
                          <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Agotado</span>
                          <div className="w-16 h-1 bg-white/10 rounded-full overflow-hidden">
                            <div className="w-0 h-full bg-red-500" />
                          </div>
                        </div>
                      ) : producto.stock_actual < 10 ? (
                        <div className="flex flex-col gap-1">
                          <div className="flex items-center gap-2">
                             <span className="text-xs font-black text-orange-500">{producto.stock_actual}</span>
                             <span className="text-[8px] font-black text-orange-400 uppercase">Bajo</span>
                          </div>
                          <div className="w-16 h-1 bg-orange-500/15 rounded-full overflow-hidden">
                            <div className="h-full bg-orange-500" style={{ width: `${(producto.stock_actual / 10) * 100}%` }} />
                          </div>
                        </div>
                      ) : (
                        <div className="flex flex-col gap-1">
                          <span className="text-xs font-black text-emerald-400">{producto.stock_actual} un.</span>
                          <div className="w-16 h-1 bg-emerald-500/15 rounded-full overflow-hidden">
                            <div className="w-full h-full bg-emerald-500" />
                          </div>
                        </div>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex flex-col gap-2">
                        {producto.activo ? (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                            <span className="text-[8px] font-black uppercase text-emerald-400 tracking-widest">En Venta</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1.5">
                            <div className="w-1.5 h-1.5 rounded-full bg-red-400" />
                            <span className="text-[8px] font-black uppercase text-white/45 tracking-widest">Pausado</span>
                          </div>
                        )}
                        {producto.destacado && (
                          <span className="w-fit px-1.5 py-0.5 text-[7px] font-black bg-accent text-ink rounded-full uppercase tracking-[0.3em]">Destacado</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end gap-2">
                        <button 
                          onClick={() => onEdit(producto)}
                          className="w-8 h-8 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-lg text-white/55 hover:text-white hover:border-white/20 transition-all"
                          title="Editar"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button 
                          onClick={() => onDelete(producto.id)}
                          className="w-8 h-8 flex items-center justify-center bg-white/[0.02] border border-white/10 rounded-lg text-white/55 hover:text-red-400 hover:border-red-500/30 transition-all"
                          title="Eliminar"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                  )
                })
              ) : (
                <tr>
                  <td colSpan={7} className="px-8 py-20 text-center">
                    <div className="flex flex-col items-center gap-4">
                      <div className="w-16 h-16 bg-white/[0.03] rounded-full flex items-center justify-center border border-white/10">
                        <Filter className="w-8 h-8 text-white/15" />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-white">No se encontraron productos</p>
                        <p className="text-[10px] font-black text-white/45 uppercase tracking-[0.35em] mt-1">Intenta ajustando los filtros de búsqueda</p>
                      </div>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
