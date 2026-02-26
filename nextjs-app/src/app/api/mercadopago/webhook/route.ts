import { NextRequest, NextResponse } from 'next/server'
import { supabaseAdmin } from '@/lib/supabase'
import { sendOrderConfirmationEmail } from '@/lib/notifications'

export async function POST(request: NextRequest) {
  try {
    const url = new URL(request.url)
    const topic = url.searchParams.get('topic') || url.searchParams.get('type')
    const id = url.searchParams.get('id') || url.searchParams.get('data.id')

    console.log(`Webhook received: topic=${topic}, id=${id}`)

    if (!id) {
      return NextResponse.json({ status: 'ok', message: 'No ID provided' })
    }

    if (topic === 'payment' || topic === 'charge') {
      const token = process.env.MERCADOPAGO_ACCESS_TOKEN
      if (!token) {
        console.error('MERCADOPAGO_ACCESS_TOKEN not configured')
        return NextResponse.json({ status: 'error', message: 'Server config error' }, { status: 500 })
      }

      // Fetch payment details from MercadoPago
      const res = await fetch(`https://api.mercadopago.com/v1/payments/${id}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (!res.ok) {
        console.error('Failed to fetch payment details from MP')
        return NextResponse.json({ status: 'error', message: 'Failed to fetch payment' }, { status: 500 })
      }

      const paymentData = await res.json()
      const { status, external_reference, status_detail } = paymentData
      const orderId = external_reference
      const paymentIdNum = Number(id);

      console.log(`Payment ${id} status: ${status}, detail: ${status_detail}, order: ${orderId}`)

      if (orderId && status === 'approved') {
        // Usar supabaseAdmin directamente para asegurar el update
        // db.run puede fallar si no hay conexión directa a PG
        if (!supabaseAdmin) {
           throw new Error('Supabase Admin client not enabled');
        }

        const { error } = await supabaseAdmin
            .from('ordenes')
            .update({
                estado: 'completado',
                mercadopago_payment_id: isNaN(paymentIdNum) ? id : paymentIdNum,
                updated_at: new Date().toISOString()
            })
            .eq('id', orderId) // orderId es UUID desde Checkout

        if (error) {
             console.error('Error updating order in Supabase:', error);
             throw error;
        }
        
        // Enviar notificación por email
        await sendOrderConfirmationEmail(orderId);
        
        console.log(`Order ${orderId} updated to completed successfully via Supabase Admin`)
      }
    }

    return NextResponse.json({ status: 'ok' })
  } catch (error: any) {
    console.error('Webhook handler error:', error)
    return NextResponse.json({ status: 'error', message: error.message }, { status: 500 })
  }
}
