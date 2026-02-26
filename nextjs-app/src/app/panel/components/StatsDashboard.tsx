
'use client'

import { useState, useEffect } from 'react'
import { formatPrice } from '@/lib/formatters'
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, PieChart, Pie, Cell, Legend 
} from 'recharts'
import { 
  DollarSign, ShoppingBag, TrendingUp, Package, Calendar, 
  Truck, AlertCircle, CheckCircle, XCircle, Download, Filter 
} from 'lucide-react'

const COLORS = ['#b7ff2a', '#3b82f6', '#f43f5e', '#f59e0b', '#10b981', '#8b5cf6']

export default function StatsDashboard() {
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')

  useEffect(() => {
    fetchStats()
  }, [range])

  const fetchStats = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/stats?range=${range}`)
      const json = await res.json()
      setData(json)
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const exportToCSV = () => {
    if (!data) return
    
    // Flatten data for CSV
    const rows = [
      ['Reporte de Estadísticas', `Rango: ${range}`],
      [''],
      ['Finanzas'],
      ['Ingresos Totales', data.financials.revenue],
      ['Ingresos Periodo Anterior', data.financials.prevRevenue],
      ['Crecimiento', `${data.financials.growth.toFixed(2)}%`],
      ['Ticket Promedio', data.financials.averageTicket],
      [''],
      ['Top Productos'],
      ['Producto', 'Cantidad', 'Ingresos', 'Categoría'],
      ...data.products.top.map((p: any) => [p.name, p.quantity, p.revenue, p.category]),
      [''],
      ['Desglose por Categoría'],
      ['Categoría', 'Ingresos'],
      ...data.financials.categoryData.map((c: any) => [c.name, c.value])
    ]

    const csvContent = "data:text/csv;charset=utf-8," 
        + rows.map(e => e.join(",")).join("\n");
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `reporte_ventas_${range}_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  if (loading && !data) return <div className="p-10 text-center text-white/50 animate-pulse">Cargando estadísticas...</div>

  if (!data) return <div className="p-10 text-center text-white/50">No hay datos disponibles</div>

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-700 pb-10">
      {/* Header & Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-white uppercase tracking-tighter italic">
            Estadísticas <span className="text-accent">Nube</span>
          </h2>
          <p className="text-white/40 text-xs font-mono mt-1">Panel de control financiero y operativo</p>
        </div>
        
        <div className="flex items-center gap-3">
            <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
                {[
                    { id: '7d', label: '7 Días' },
                    { id: '30d', label: '30 Días' },
                    { id: 'month', label: 'Mes Actual' },
                    { id: 'year', label: 'Año' }
                ].map((opt) => (
                    <button
                        key={opt.id}
                        onClick={() => setRange(opt.id)}
                        className={`px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider rounded-lg transition-all ${
                            range === opt.id 
                            ? 'bg-accent text-black shadow-lg shadow-accent/20' 
                            : 'text-white/40 hover:text-white hover:bg-white/5'
                        }`}
                    >
                        {opt.label}
                    </button>
                ))}
            </div>

            <button 
                onClick={exportToCSV}
                className="p-2 bg-white/5 hover:bg-white/10 rounded-xl border border-white/10 text-white/60 hover:text-accent transition-all"
                title="Exportar CSV"
            >
                <Download className="w-5 h-5" />
            </button>
        </div>
      </div>

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Revenue */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <DollarSign className="w-10 h-10 text-accent" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Ingresos Totales</p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white tracking-tighter">
                    ${formatPrice(data.financials.revenue)}
                </p>
                <span className={`text-[10px] font-bold mb-1 ${data.financials.growth >= 0 ? 'text-green-400' : 'text-red-400'}`}>
                    {data.financials.growth > 0 ? '+' : ''}{data.financials.growth.toFixed(1)}%
                </span>
            </div>
            <p className="text-[9px] text-white/20 mt-2 font-mono">vs periodo anterior (${formatPrice(data.financials.prevRevenue)})</p>
        </div>

        {/* Orders */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <ShoppingBag className="w-10 h-10 text-blue-400" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Órdenes</p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white tracking-tighter">
                    {data.orders.total}
                </p>
                <span className="text-[10px] font-bold text-white/40 mb-1">totales</span>
            </div>
            <div className="flex gap-3 mt-2">
                <div className="flex items-center gap-1 text-[9px] text-green-400">
                    <CheckCircle className="w-3 h-3" /> {data.orders.completed} ok
                </div>
                <div className="flex items-center gap-1 text-[9px] text-red-400">
                    <XCircle className="w-3 h-3" /> {data.orders.canceled} cancel
                </div>
            </div>
        </div>

        {/* Ticket */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <TrendingUp className="w-10 h-10 text-purple-400" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Ticket Promedio</p>
            <p className="text-2xl font-black text-white tracking-tighter">
                ${formatPrice(data.financials.averageTicket)}
            </p>
            <p className="text-[9px] text-white/20 mt-2 font-mono">por orden completada</p>
        </div>

        {/* Processing Time */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Calendar className="w-10 h-10 text-pink-400" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Tiempo Proceso</p>
            <p className="text-2xl font-black text-white tracking-tighter">
                {data.financials.averageProcessingTime < 24 
                    ? `${data.financials.averageProcessingTime.toFixed(1)}h`
                    : `${(data.financials.averageProcessingTime / 24).toFixed(1)}d`
                }
            </p>
            <p className="text-[9px] text-white/20 mt-2 font-mono">promedio hasta envío</p>
        </div>

        {/* Shipping */}
        <div className="bg-white/[0.03] border border-white/10 p-5 rounded-[24px] relative overflow-hidden group">
            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
                <Truck className="w-10 h-10 text-orange-400" />
            </div>
            <p className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em] mb-1">Envíos Realizados</p>
            <div className="flex items-end gap-2">
                <p className="text-2xl font-black text-white tracking-tighter">
                    {data.shipping.totalShipped}
                </p>
                <span className="text-[10px] font-bold text-white/40 mb-1">
                    ({data.shipping.shippingPercentage.toFixed(0)}% del total)
                </span>
            </div>
            <p className="text-[9px] text-white/20 mt-2 font-mono flex items-center gap-2">
                <span className={`font-bold ${data.shipping.onTimePercentage >= 80 ? "text-green-400" : "text-yellow-400"}`}>
                    {data.shipping.onTimePercentage.toFixed(0)}% a tiempo
                </span>
                <span className="opacity-50">(&lt;72hs)</span>
            </p>
        </div>
      </div>

      {/* Main Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         {/* Revenue Evolution */}
         <div className="lg:col-span-2 bg-white/[0.03] border border-white/10 p-6 rounded-[30px]">
            <div className="flex items-center gap-2 mb-6">
                <Calendar className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Evolución de Ingresos</h3>
            </div>
            <div className="h-[300px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data.charts.revenue}>
                        <defs>
                            <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                                <stop offset="5%" stopColor="#b7ff2a" stopOpacity={0.3}/>
                                <stop offset="95%" stopColor="#b7ff2a" stopOpacity={0}/>
                            </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" vertical={false} />
                        <XAxis 
                            dataKey="date" 
                            stroke="#ffffff40" 
                            fontSize={10} 
                            tickFormatter={(str) => {
                                const d = new Date(str);
                                return `${d.getDate()}/${d.getMonth()+1}`;
                            }}
                            tickMargin={10}
                        />
                        <YAxis 
                            stroke="#ffffff40" 
                            fontSize={10} 
                            tickFormatter={(val) => `$${val/1000}k`}
                            tickMargin={10}
                        />
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#05060a', borderColor: '#ffffff20', borderRadius: '12px' }}
                            itemStyle={{ color: '#b7ff2a', fontSize: '12px', fontWeight: 'bold' }}
                            labelStyle={{ color: '#888', fontSize: '10px', marginBottom: '5px' }}
                            formatter={(value: any) => [`$${formatPrice(value)}`, 'Ventas']}
                        />
                        <Area 
                            type="monotone" 
                            dataKey="value" 
                            stroke="#b7ff2a" 
                            strokeWidth={3}
                            fillOpacity={1} 
                            fill="url(#colorRevenue)" 
                        />
                    </AreaChart>
                </ResponsiveContainer>
            </div>
         </div>

         {/* Category Breakdown */}
         <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[30px]">
            <div className="flex items-center gap-2 mb-6">
                <Package className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Ventas por Categoría</h3>
            </div>
            <div className="h-[300px] w-full relative">
                <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                        <Pie
                            data={data.financials.categoryData}
                            cx="50%"
                            cy="50%"
                            innerRadius={60}
                            outerRadius={80}
                            paddingAngle={5}
                            dataKey="value"
                        >
                            {data.financials.categoryData.map((entry: any, index: number) => (
                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="rgba(0,0,0,0)" />
                            ))}
                        </Pie>
                        <Tooltip 
                            contentStyle={{ backgroundColor: '#05060a', borderColor: '#ffffff20', borderRadius: '12px' }}
                            itemStyle={{ color: '#fff', fontSize: '12px' }}
                            formatter={(value: any) => [`$${formatPrice(value)}`, '']}
                        />
                        <Legend 
                            verticalAlign="bottom" 
                            height={36}
                            iconType="circle"
                            formatter={(value) => <span className="text-[10px] text-white/60 font-bold ml-1">{value}</span>}
                        />
                    </PieChart>
                </ResponsiveContainer>
                {data.financials.categoryData.length === 0 && (
                    <div className="absolute inset-0 flex items-center justify-center text-white/20 text-xs">Sin datos</div>
                )}
            </div>
         </div>
      </div>

      {/* Top Products & Shipping */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
         {/* Top Products List */}
         <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[30px]">
            <div className="flex items-center gap-2 mb-6">
                <Package className="w-4 h-4 text-white/40" />
                <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Top 10 Productos Más Vendidos</h3>
            </div>
            <div className="space-y-3">
                {data.products.top.map((product: any, i: number) => (
                    <div key={i} className="flex items-center gap-4 group hover:bg-white/5 p-2 rounded-xl transition-colors">
                        <div className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center font-black text-xs text-white/30 group-hover:bg-accent group-hover:text-black transition-colors shrink-0">
                            {i + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                            <div className="flex justify-between mb-1">
                                <p className="text-xs font-bold text-white truncate max-w-[70%]">{product.name}</p>
                                <p className="text-xs font-black text-accent">${formatPrice(product.revenue)}</p>
                            </div>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                                    <div 
                                        className="h-full bg-accent transition-all duration-500" 
                                        style={{ width: `${product.percentage}%` }}
                                    />
                                </div>
                                <span className="text-[9px] text-white/40 font-mono shrink-0">
                                    {product.quantity} u.
                                </span>
                            </div>
                        </div>
                    </div>
                ))}
                {data.products.top.length === 0 && (
                    <p className="text-center text-xs text-white/20 py-10">Sin datos aún</p>
                )}
            </div>
         </div>

         {/* Shipping & Order Status */}
         <div className="space-y-6">
             {/* Order Status */}
             <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[30px]">
                <div className="flex items-center gap-2 mb-6">
                    <AlertCircle className="w-4 h-4 text-white/40" />
                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Estado de Órdenes</h3>
                </div>
                <div className="h-[200px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={data.orders.statusData} layout="vertical" margin={{ left: 20 }}>
                            <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" horizontal={false} />
                            <XAxis type="number" stroke="#ffffff40" fontSize={10} />
                            <YAxis 
                                dataKey="name" 
                                type="category" 
                                stroke="#ffffff40" 
                                fontSize={10} 
                                width={80}
                                tickFormatter={(val) => val.charAt(0).toUpperCase() + val.slice(1)}
                            />
                            <Tooltip 
                                cursor={{fill: 'transparent'}}
                                contentStyle={{ backgroundColor: '#05060a', borderColor: '#ffffff20', borderRadius: '12px' }}
                                itemStyle={{ color: '#fff', fontSize: '12px' }}
                            />
                            <Bar dataKey="value" fill="#3b82f6" radius={[0, 4, 4, 0]} barSize={20} />
                        </BarChart>
                    </ResponsiveContainer>
                </div>
             </div>

             {/* Geographic Distribution */}
             <div className="bg-white/[0.03] border border-white/10 p-6 rounded-[30px]">
                <div className="flex items-center gap-2 mb-6">
                    <Truck className="w-4 h-4 text-white/40" />
                    <h3 className="text-xs font-black text-white/60 uppercase tracking-[0.2em]">Distribución Geográfica (Top 5)</h3>
                </div>
                <div className="space-y-3">
                    {data.shipping.geoData.map((geo: any, i: number) => (
                        <div key={i} className="flex items-center justify-between text-xs">
                            <span className="text-white/60 font-medium flex items-center gap-2">
                                <span className="w-1.5 h-1.5 rounded-full bg-orange-400"></span>
                                {geo.name || 'Desconocido'}
                            </span>
                            <span className="font-bold text-white">{geo.count} envíos</span>
                        </div>
                    ))}
                    {data.shipping.geoData.length === 0 && (
                        <p className="text-center text-xs text-white/20">Sin datos de envío</p>
                    )}
                </div>
             </div>
         </div>
      </div>
    </div>
  )
}
