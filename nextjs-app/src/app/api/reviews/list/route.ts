import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url)
  const productoId = searchParams.get('producto') || searchParams.get('productoId')
  
  if (!productoId) {
    return NextResponse.json({ reviews: [], average: 0 })
  }

  try {
    // 1. Fetch reviews
    const { data: reviews, error } = await supabase
      .from('resenas')
      .select('id, cliente_nombre, comentario, calificacion, created_at')
      .eq('producto_id', productoId)
      .eq('aprobado', true)
      .order('created_at', { ascending: false })
      .limit(20);
    
    if (error) throw error;
    
    // 2. Calculate average (fetching all ratings for this product)
    const { data: ratings, error: ratingError } = await supabase
        .from('resenas')
        .select('calificacion')
        .eq('producto_id', productoId)
        .eq('aprobado', true);

    let average = 0;
    if (!ratingError && ratings && ratings.length > 0) {
        const total = ratings.reduce((sum: number, r: any) => sum + r.calificacion, 0);
        average = total / ratings.length;
    }

    return NextResponse.json({ 
      reviews: reviews?.map((r: any) => ({
          id: r.id,
          usuario_nombre: r.cliente_nombre,
          comentario: r.comentario,
          rating: r.calificacion,
          created_at: r.created_at
      })) || [], 
      average: Number(average.toFixed(1))
    })
  } catch (e: any) {
    console.error('reviews/list error', e)
    return NextResponse.json({ reviews: [], average: 0, error: e.message })
  }
}
