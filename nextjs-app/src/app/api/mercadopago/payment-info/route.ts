import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    // Solo admins
    const cookieStore = cookies()
    const adminSession = cookieStore.get('admin-session')?.value
    if (!adminSession) {
      return NextResponse.json({ error: 'No autorizado' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const paymentId = searchParams.get('id')
    if (!paymentId) {
      return NextResponse.json({ error: 'Falta id' }, { status: 400 })
    }

    const token = process.env.MERCADOPAGO_ACCESS_TOKEN
    if (!token) {
      return NextResponse.json({ error: 'Servidor sin credenciales MP' }, { status: 500 })
    }

    const res = await fetch(`https://api.mercadopago.com/v1/payments/${paymentId}`, {
      headers: { Authorization: `Bearer ${token}` }
    })
    const data = await res.json()
    if (!res.ok) {
      return NextResponse.json({ error: data?.message || 'Error MercadoPago' }, { status: res.status })
    }

    // Sanitizar datos relevantes
    const info = {
      id: data.id,
      status: data.status,
      status_detail: data.status_detail,
      date_approved: data.date_approved,
      method: data.payment_method_id,
      type: data.payment_type_id,
      transaction_amount: data.transaction_amount,
      currency: data.currency_id,
      installments: data.installments,
      payer: {
        name: `${data.payer?.first_name || ''} ${data.payer?.last_name || ''}`.trim() || undefined,
        email: data.payer?.email,
        identification: data.payer?.identification?.number,
        identification_type: data.payer?.identification?.type,
      },
      card: data.card ? { last_four_digits: data.card.last_four_digits } : undefined,
      bank_transfer: data.transaction_details?.bank_transfer || undefined,
      financial_institution: data.transaction_details?.financial_institution,
      external_reference: data.external_reference
    }

    return NextResponse.json({ ok: true, info })
  } catch (err: any) {
    console.error('payment-info error:', err)
    return NextResponse.json({ error: 'Error interno' }, { status: 500 })
  }
}
