
import { sendEmail } from './email';
import db from './db';
import { Orden } from './supabase';
import { formatPrice } from './formatters';

export const generateTrackingCode = () => {
  const random = Math.floor(Math.random() * 1000000000).toString().padStart(9, '0');
  return `CP${random}AR`;
};

export const sendOrderConfirmationEmail = async (orderId: string) => {
  try {
    const order = await db.get<Orden>('SELECT * FROM ordenes WHERE id = ?', [orderId]);
    if (!order || !order.cliente_email) return;

    // Parse items
    let items: any[] = [];
    try {
      items = typeof order.items === 'string' ? JSON.parse(order.items) : order.items;
    } catch { items = []; }

    // Ensure tracking code exists and is valid (not the order number)
    let trackingCode = order.tracking_code;
    const isValidTracking = trackingCode && /^[A-Z]{2}\d{9}[A-Z]{2}$/.test(trackingCode);
    
    if (!isValidTracking) {
        trackingCode = generateTrackingCode();
        await db.run('UPDATE ordenes SET tracking_code = ? WHERE id = ?', [trackingCode, orderId]);
    }

    const trackingUrl = `https://www.correoargentino.com.ar/formularios/e-commerce?id=${trackingCode}`;

    const html = `
      <div style="font-family: sans-serif; color: #333; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #db2777; text-transform: uppercase;">¡Gracias por tu compra!</h1>
        <p>Hola <strong>${order.cliente_nombre}</strong>,</p>
        <p>Tu orden <strong>#${order.numero_orden}</strong> ha sido confirmada y estamos preparándola.</p>
        
        <div style="background: #f9fafb; padding: 20px; border-radius: 12px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Detalles del Pedido</h3>
          <ul style="list-style: none; padding: 0;">
            ${items.map((item: any) => `
              <li style="border-bottom: 1px solid #eee; padding: 10px 0; display: flex; justify-content: space-between;">
                <span>${item.nombre} (x${item.cantidad})</span>
                <strong>$${formatPrice(item.precio * item.cantidad)}</strong>
              </li>
            `).join('')}
          </ul>
          <div style="border-top: 2px solid #eee; margin-top: 10px; padding-top: 10px; display: flex; justify-content: space-between;">
            <strong>Total</strong>
            <strong style="font-size: 1.2em;">$${formatPrice(order.total)}</strong>
          </div>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${trackingUrl}" style="background: #db2777; color: white; padding: 12px 24px; text-decoration: none; border-radius: 50px; font-weight: bold; display: inline-block;">
            Seguir mi envío
          </a>
          <p style="font-size: 0.9em; color: #666; margin-top: 10px;">
            Código de seguimiento: <strong>${trackingCode}</strong>
          </p>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 30px 0;" />
        
        <p style="font-size: 0.9em; color: #666;">
          Si tienes alguna duda, contáctanos respondiendo a este correo o a través de nuestro soporte.
        </p>
      </div>
    `;

    const sent = await sendEmail(order.cliente_email, `Confirmación de Orden #${order.numero_orden}`, html);
    
    if (sent) {
        await db.run("INSERT INTO admin_logs (action, table_name, record_id, details) VALUES (?, ?, ?, ?)", [
            'EMAIL_SENT',
            'ordenes',
            orderId,
            `Confirmation email sent to ${order.cliente_email}`
        ]);
    }
  } catch (error) {
    console.error('[Notifications] Error sending confirmation:', error);
  }
};
