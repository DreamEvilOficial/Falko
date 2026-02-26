import { NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'

export async function GET() {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  // Fetch config values
  const { data, error } = await supabaseAdmin
    .from('configuracion')
    .select('clave, valor')
    .in('clave', ['paqar_api_key', 'paqar_secret', 'paqar_mode'])

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })

  // Transform to object and mask secret
  const config: any = {}
  data?.forEach((item: any) => {
      if (item.clave === 'paqar_secret') {
          config[item.clave] = item.valor ? '••••••••' : ''
      } else {
          config[item.clave] = item.valor
      }
  })

  return NextResponse.json(config)
}

export async function POST(req: Request) {
  if (!supabaseAdmin) return NextResponse.json({ error: 'Server config error' }, { status: 500 })

  try {
    const body = await req.json()
    const updates = []

    if (body.paqar_api_key !== undefined) {
        updates.push({ clave: 'paqar_api_key', valor: body.paqar_api_key, tipo: 'shipping' })
    }
    if (body.paqar_secret !== undefined && !body.paqar_secret.includes('•••')) {
        updates.push({ clave: 'paqar_secret', valor: body.paqar_secret, tipo: 'shipping' })
    }
    if (body.paqar_mode !== undefined) {
        updates.push({ clave: 'paqar_mode', valor: body.paqar_mode, tipo: 'shipping' })
    }

    // Upsert all
    for (const update of updates) {
        const { error } = await supabaseAdmin
            .from('configuracion')
            .upsert(update, { onConflict: 'clave' })
        if (error) throw error
    }

    return NextResponse.json({ success: true })
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
