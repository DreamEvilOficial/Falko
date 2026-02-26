
import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'Supabase Admin not configured' }, { status: 500 })
    }

    const { searchParams } = new URL(request.url)
    const range = searchParams.get('range') || '30d'

    // 1. Calculate Date Ranges
    const now = new Date()
    let startDate = new Date()
    let prevStartDate = new Date()
    
    // Reset hours to start of day for cleaner comparisons
    now.setHours(23, 59, 59, 999)
    startDate.setHours(0, 0, 0, 0)
    prevStartDate.setHours(0, 0, 0, 0)

    if (range === '7d') {
      startDate.setDate(now.getDate() - 7)
      prevStartDate.setDate(startDate.getDate() - 7)
    } else if (range === '30d') {
      startDate.setDate(now.getDate() - 30)
      prevStartDate.setDate(startDate.getDate() - 30)
    } else if (range === 'month') {
      startDate = new Date(now.getFullYear(), now.getMonth(), 1)
      prevStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    } else if (range === 'year') {
      startDate = new Date(now.getFullYear(), 0, 1)
      prevStartDate = new Date(now.getFullYear() - 1, 0, 1)
    }

    // 2. Fetch Data
    // Current Period Orders
    const { data: orders, error: ordersError } = await supabaseAdmin
      .from('ordenes')
      .select('*')
      .gte('created_at', startDate.toISOString())
      .order('created_at', { ascending: false })

    if (ordersError) throw ordersError

    // Previous Period Orders (for comparison)
    const { data: prevOrders, error: prevError } = await supabaseAdmin
      .from('ordenes')
      .select('total, created_at, estado')
      .gte('created_at', prevStartDate.toISOString())
      .lt('created_at', startDate.toISOString())

    if (prevError) throw prevError

    // Fetch Products & Categories for enrichment
    const { data: products } = await supabaseAdmin
      .from('productos')
      .select('id, nombre, categoria_id')
    
    const { data: categories } = await supabaseAdmin
      .from('categorias')
      .select('id, nombre')

    // 3. Create Maps for fast lookup
    const categoryMap = new Map()
    categories?.forEach((c: any) => categoryMap.set(c.id, c.nombre))

    const productCategoryMap = new Map()
    const productNameMap = new Map() // Map ID to Name if needed
    products?.forEach((p: any) => {
      const catName = categoryMap.get(p.categoria_id) || 'Sin Categoría'
      productCategoryMap.set(p.id, catName)
      productCategoryMap.set(p.nombre, catName) // Fallback by name
      productNameMap.set(p.id, p.nombre)
    })

    // 4. Process Metrics
    
    // --- Financials ---
    const completedStatuses = ['completado', 'enviado', 'COMPLETADO', 'ENVIADO', 'Completado', 'Enviado']
    
    const currentRevenue = orders
      .filter((o: any) => completedStatuses.includes(o.estado))
      .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0)

    const prevRevenue = prevOrders
      ?.filter((o: any) => completedStatuses.includes(o.estado))
      .reduce((sum: number, o: any) => sum + (Number(o.total) || 0), 0) || 0

    const revenueGrowth = prevRevenue === 0 ? 100 : ((currentRevenue - prevRevenue) / prevRevenue) * 100

    // --- Order Stats ---
    const totalOrders = orders.length
    const completedOrders = orders.filter((o: any) => completedStatuses.includes(o.estado)).length
    const canceledOrders = orders.filter((o: any) => ['cancelado', 'rechazado', 'CANCELADO'].includes(o.estado)).length
    const averageTicket = completedOrders > 0 ? currentRevenue / completedOrders : 0

    // --- Top Products & Categories ---
    const productSales: Record<string, { name: string, quantity: number, revenue: number, category: string }> = {}
    const categorySales: Record<string, number> = {}

    orders
      .filter((o: any) => completedStatuses.includes(o.estado))
      .forEach((order: any) => {
        let items: any[] = []
        try {
            items = typeof order.items === 'string' ? JSON.parse(order.items) : (order.items || [])
        } catch (e) { items = [] }

        if (Array.isArray(items)) {
            items.forEach((item: any) => {
                const id = item.id || item.producto_id || item.nombre
                if (!id) return
                
                const name = item.nombre || productNameMap.get(id) || 'Producto Desconocido'
                const category = productCategoryMap.get(id) || productCategoryMap.get(name) || 'Otros'
                const qty = Number(item.cantidad) || 1
                const price = Number(item.precio) || 0
                const revenue = price * qty

                if (!productSales[id]) {
                    productSales[id] = { name, quantity: 0, revenue: 0, category }
                }
                productSales[id].quantity += qty
                productSales[id].revenue += revenue

                categorySales[category] = (categorySales[category] || 0) + revenue
            })
        }
    })

    const topProducts = Object.values(productSales)
        .sort((a, b) => b.quantity - a.quantity)
        .slice(0, 10)
        .map(p => ({
            ...p,
            percentage: currentRevenue > 0 ? (p.revenue / currentRevenue) * 100 : 0
        }))

    const categoryData = Object.entries(categorySales)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)

    // --- Chart Data (Evolution) ---
    const dailyRevenue: Record<string, number> = {}
    
    // Initialize dates based on range
    const days = range === '7d' ? 7 : range === '30d' ? 30 : range === 'month' ? 31 : 365
    
    // We only iterate explicitly for 30d/7d. For dynamic ranges, we map from data.
    // Better: use the actual date range we calculated.
    const dateLoop = new Date(startDate)
    while (dateLoop <= now) {
        const key = dateLoop.toISOString().split('T')[0]
        dailyRevenue[key] = 0
        dateLoop.setDate(dateLoop.getDate() + 1)
    }

    orders
      .filter((o: any) => completedStatuses.includes(o.estado))
      .forEach((order: any) => {
        if (!order.created_at) return
        const dateStr = typeof order.created_at === 'string' ? order.created_at : order.created_at.toISOString()
        const key = dateStr.split('T')[0]
        if (dailyRevenue[key] !== undefined) {
            dailyRevenue[key] += (Number(order.total) || 0)
        }
    })

    const revenueChart = Object.entries(dailyRevenue)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .map(([date, value]) => ({ date, value }))

    // --- Shipping Metrics (Geo Distribution) ---
    const provinceStats: Record<string, number> = {}
    orders.forEach((o: any) => {
        const prov = o.provincia || 'Desconocido'
        // Normalize province name (simple check)
        const normalizedProv = prov.trim().toLowerCase().replace(/\b\w/g, (l: string) => l.toUpperCase())
        provinceStats[normalizedProv] = (provinceStats[normalizedProv] || 0) + 1
    })

    const shippingData = Object.entries(provinceStats)
        .map(([name, count]) => ({ name, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5) // Top 5 provinces

    const shippedOrders = orders.filter((o: any) => ['enviado', 'ENVIADO', 'Enviado'].includes(o.estado)).length
    const shippingPercentage = totalOrders > 0 ? (shippedOrders / totalOrders) * 100 : 0

    const shippedWithDate = orders.filter((o: any) => ['enviado', 'ENVIADO', 'Enviado'].includes(o.estado))

    let totalProcessingHours = 0
    let processingCount = 0
    let onTimeCount = 0
    const SLA_HOURS = 72 // 3 days

    shippedWithDate.forEach((o: any) => {
        const start = new Date(o.created_at).getTime()
        // Use fecha_envio if available, otherwise fallback to updated_at as a proxy
        const endStr = o.fecha_envio || o.updated_at
        if (!endStr) return

        const end = new Date(endStr).getTime()
        const diffHours = (end - start) / (1000 * 60 * 60)
        
        // Filter out unrealistic values (e.g. negative or > 1 year)
        if (diffHours > 0 && diffHours < 8760) {
            totalProcessingHours += diffHours
            processingCount++
            
            if (diffHours <= SLA_HOURS) {
                onTimeCount++
            }
        }
    })

    const averageProcessingTime = processingCount > 0 ? totalProcessingHours / processingCount : 0
    const onTimePercentage = processingCount > 0 ? (onTimeCount / processingCount) * 100 : 0

    // --- Order Status Distribution ---
    const statusStats: Record<string, number> = {}
    orders.forEach((o: any) => {
        const status = o.estado || 'desconocido'
        statusStats[status] = (statusStats[status] || 0) + 1
    })
    
    const statusData = Object.entries(statusStats).map(([name, value]) => ({ name, value }))

    return NextResponse.json({
        financials: {
            revenue: currentRevenue,
            prevRevenue,
            growth: revenueGrowth,
            averageTicket,
            averageProcessingTime,
            categoryData
        },
        orders: {
            total: totalOrders,
            completed: completedOrders,
            canceled: canceledOrders,
            statusData
        },
        products: {
            top: topProducts
        },
        shipping: {
            totalShipped: shippedOrders,
            shippingPercentage,
            geoData: shippingData
        },
        charts: {
            revenue: revenueChart
        }
    })

  } catch (error: any) {
    console.error('Stats API Error:', error)
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
