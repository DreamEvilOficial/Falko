import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  const { data, error } = await supabaseAdmin
    .from('shipping_senders')
    .select('*')
    .order('es_default', { ascending: false })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 })
  
  try {
    const body = await req.json()
    const { id, ...data } = body

    if (id) {
       // Update
       const { data: updated, error } = await supabaseAdmin
         .from('shipping_senders')
         .update(data)
         .eq('id', id)
         .select()
         .single()
       if (error) throw error
       return NextResponse.json(updated)
    } else {
       // Create
       // If default, unset others (simple approach)
       if (data.es_default) {
         await supabaseAdmin.from('shipping_senders').update({ es_default: false }).neq('id', '00000000-0000-0000-0000-000000000000')
       }
       const { data: created, error } = await supabaseAdmin
         .from('shipping_senders')
         .insert(data)
         .select()
         .single()
       if (error) throw error
       return NextResponse.json(created)
    }
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
