import { useState, useEffect } from 'react'
import { Search, Filter, AlertTriangle, Package, CheckCircle } from 'lucide-react'

export default function InventoryReport() {
  const [data, setData] = useState<any[]>([])
  const [summary, setSummary] = useState({ total_items: 0, total_variants: 0, low_stock_variants: 0 })
  const [loading, setLoading] = useState(true)
  
  // Filters
  const [search, setSearch] = useState('')
  const [talle, setTalle] = useState('')
  const [color, setColor] = useState('')
  const [stockMin, setStockMin] = useState('')

  const fetchInventory = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (search) params.append('search', search)
      if (talle) params.append('talle', talle)
      if (color) params.append('color', color)
      if (stockMin) params.append('stock_min', stockMin)

      const res = await fetch(`/api/inventory?${params.toString()}`)
      const json = await res.json()
      
      if (json.data) {
        setData(json.data)
        setSummary(json.summary)
      }
    } catch (error) {
      console.error('Error fetching inventory:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    const timeout = setTimeout(fetchInventory, 500)
    return () => clearTimeout(timeout)
  }, [search, talle, color, stockMin])

  return (
    <div className="space-y-8">
      {/* Header & Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-500/10 rounded-2xl flex items-center justify-center text-blue-500">
            <Package className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Total Unidades</p>
            <p className="text-2xl font-black text-white">{summary.total_items}</p>
          </div>
        </div>
        
        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-purple-500/10 rounded-2xl flex items-center justify-center text-purple-500">
            <Filter className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Variantes Activas</p>
            <p className="text-2xl font-black text-white">{summary.total_variants}</p>
          </div>
        </div>

        <div className="bg-[#111] p-6 rounded-3xl border border-white/5 flex items-center gap-4">
          <div className="w-12 h-12 bg-orange-500/10 rounded-2xl flex items-center justify-center text-orange-500">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <p className="text-gray-400 text-xs font-bold uppercase tracking-widest">Stock Bajo</p>
            <p className="text-2xl font-black text-white">{summary.low_stock_variants}</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-[#06070c] p-6 rounded-3xl border border-white/10 space-y-4">
        <div className="flex items-center gap-2 mb-2">
          <Filter className="w-4 h-4 text-gray-400" />
          <h3 className="text-xs font-bold uppercase tracking-widest text-gray-400">Filtros Avanzados</h3>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" />
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar producto, SKU..."
              className="w-full bg-[#111] h-12 pl-10 pr-4 rounded-xl text-sm font-bold text-white border border-white/5 focus:border-white/20 outline-none transition-all"
            />
          </div>
          <input 
            value={talle}
            onChange={e => setTalle(e.target.value)}
            placeholder="Filtrar por Talle"
            className="w-full bg-[#111] h-12 px-4 rounded-xl text-sm font-bold text-white border border-white/5 focus:border-white/20 outline-none transition-all"
          />
          <input 
            value={color}
            onChange={e => setColor(e.target.value)}
            placeholder="Filtrar por Color"
            className="w-full bg-[#111] h-12 px-4 rounded-xl text-sm font-bold text-white border border-white/5 focus:border-white/20 outline-none transition-all"
          />
           <input 
            type="number"
            value={stockMin}
            onChange={e => setStockMin(e.target.value)}
            placeholder="Stock Mínimo"
            className="w-full bg-[#111] h-12 px-4 rounded-xl text-sm font-bold text-white border border-white/5 focus:border-white/20 outline-none transition-all"
          />
        </div>
      </div>

      {/* Table */}
      <div className="bg-[#06070c] rounded-3xl border border-white/10 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/5 bg-white/2">
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">Producto</th>
                <th className="px-6 py-4 text-left text-[10px] font-black uppercase tracking-widest text-gray-400">SKU</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Talle</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Color</th>
                <th className="px-6 py-4 text-center text-[10px] font-black uppercase tracking-widest text-gray-400">Stock</th>
                <th className="px-6 py-4 text-right text-[10px] font-black uppercase tracking-widest text-gray-400">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {loading ? (
                 <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-white mx-auto"></div>
                    </td>
                 </tr>
              ) : data.length === 0 ? (
                <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500 text-sm font-bold">
                        No se encontraron variantes con estos filtros.
                    </td>
                 </tr>
              ) : (
                data.map((item) => (
                  <tr key={item.id} className="hover:bg-white/2 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-[#111] rounded-lg overflow-hidden relative">
                           {item.imagen_url && (
                             <img src={item.imagen_url} alt="" className="w-full h-full object-cover" />
                           )}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{item.producto_nombre}</p>
                          <p className="text-[10px] text-gray-500 uppercase tracking-wider">{item.categoria_nombre || 'Sin categoría'}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-mono text-xs text-gray-400 group-hover:text-white transition-colors">{item.sku}</p>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <span className="px-2 py-1 bg-white/5 rounded text-xs font-bold text-white">{item.talle}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      <div className="flex items-center justify-center gap-2">
                        <div className="w-4 h-4 rounded-full border border-white/20" style={{ backgroundColor: item.color_hex }}></div>
                        <span className="text-xs font-bold text-gray-400">{item.color}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 text-center">
                       <span className={`text-sm font-black ${item.stock < 5 ? 'text-red-500' : 'text-white'}`}>
                         {item.stock}
                       </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                       {item.stock > 0 ? (
                         <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/10 text-green-500 text-[10px] font-black uppercase tracking-wide">
                            <CheckCircle className="w-3 h-3" /> En Stock
                         </span>
                       ) : (
                        <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 text-red-500 text-[10px] font-black uppercase tracking-wide">
                            <AlertTriangle className="w-3 h-3" /> Agotado
                         </span>
                       )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
