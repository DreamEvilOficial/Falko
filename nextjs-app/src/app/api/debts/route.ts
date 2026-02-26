import { NextResponse } from 'next/server';
import db from '@/lib/db';
import { v4 as uuidv4 } from 'uuid';
import { toNumber } from '@/lib/formatters';

export const dynamic = 'force-dynamic';

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (id) {
        const debt: any = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
        if (debt) {
            const history = typeof debt.historial === 'string'
              ? JSON.parse(debt.historial)
              : (debt.historial || []);

            const recalculatedTotal = Array.isArray(history)
              ? history.reduce((acc: number, h: any) => {
                  const amount = toNumber(h.monto);
                  if (h.tipo === 'deuda') return acc + amount;
                  if (h.tipo === 'pago') return acc - amount;
                  return acc;
                }, 0)
              : toNumber(debt.total_deuda);

            debt.historial = history;
            debt.total_deuda = recalculatedTotal;
        }
        return NextResponse.json(debt);
    }

    const debts = await db.all('SELECT * FROM deudas ORDER BY created_at DESC');
    const parsed = debts.map((d: any) => {
        const history = typeof d.historial === 'string'
          ? JSON.parse(d.historial)
          : (d.historial || []);

        const recalculatedTotal = Array.isArray(history)
          ? history.reduce((acc: number, h: any) => {
              const amount = toNumber(h.monto);
              if (h.tipo === 'deuda') return acc + amount;
              if (h.tipo === 'pago') return acc - amount;
              return acc;
            }, 0)
          : toNumber(d.total_deuda);

        return {
          ...d,
          historial: history,
          total_deuda: recalculatedTotal,
        };
    });

    return NextResponse.json(parsed);
  } catch (error: any) {
    console.error('Error fetching debts:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { cliente_nombre, cliente_apellido, cliente_dni, cliente_celular, cliente_direccion, total_deuda } = body;

    const id = uuidv4();
    
    // Ensure total_deuda is parsed correctly if provided
    const initialDebt = total_deuda ? toNumber(total_deuda) : 0;
    
    await db.run(`
      INSERT INTO deudas (
        id, cliente_nombre, cliente_apellido, cliente_dni, cliente_celular, cliente_direccion, total_deuda, historial
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, cliente_nombre, cliente_apellido || '', cliente_dni || '', 
      cliente_celular || '', cliente_direccion || '', initialDebt, '[]'
    ]);

    const newDebt = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
    return NextResponse.json(newDebt);
  } catch (error: any) {
    console.error('Error creating debt:', error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function PUT(request: Request) {
    try {
        const body = await request.json();
        const { 
            id, 
            total_deuda, 
            historial, 
            estado, 
            monto, 
            descripcion, 
            tipo, 
            producto, 
            fecha,
            cuotas,
            frecuencia,
            frecuenciaDias,
            action,
            via,
            mensaje
        } = body;

        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        if (action === 'recordatorio') {
            const debt = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
            if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

            const currentHistory = typeof debt.historial === 'string' ? JSON.parse(debt.historial) : (debt.historial || []);
            const reminder = {
                id: uuidv4(),
                tipo: 'recordatorio',
                fecha: fecha || new Date().toISOString(),
                via: via || 'manual',
                mensaje: mensaje || 'Recordatorio de pago enviado'
            };

            const updatedHistory = [...currentHistory, reminder];

            await db.run(`
                UPDATE deudas 
                SET historial = ?, updated_at = NOW() 
                WHERE id = ?
            `, [JSON.stringify(updatedHistory), id]);

            const updatedDebt = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
            if (updatedDebt && typeof updatedDebt.historial === 'string') {
                updatedDebt.historial = JSON.parse(updatedDebt.historial);
            }

            return NextResponse.json(updatedDebt);
        }

        // Si se proporciona 'monto' y 'tipo', es un nuevo movimiento
        if (monto && tipo) {
            const debt = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
            if (!debt) return NextResponse.json({ error: 'Debt not found' }, { status: 404 });

            const currentHistory = typeof debt.historial === 'string' ? JSON.parse(debt.historial) : (debt.historial || []);
            
            // Use toNumber for safe parsing
            const amountSafe = toNumber(monto);
            
            const newMovement = {
                id: uuidv4(),
                fecha: fecha || new Date().toISOString(),
                monto: amountSafe,
                descripcion: descripcion || (tipo === 'pago' ? 'Pago recibido' : 'Aumento de deuda'),
                tipo,
                producto: producto || ''
            };

            const updatedHistory = [...currentHistory, newMovement];

            if (cuotas && frecuencia && frecuenciaDias && !currentHistory.some((h: any) => h.tipo === 'config')) {
                const configEntry = {
                    id: uuidv4(),
                    tipo: 'config',
                    cuotas: Number(cuotas),
                    frecuencia,
                    frecuenciaDias: Number(frecuenciaDias),
                    created_at: new Date().toISOString()
                };
                updatedHistory.push(configEntry);
            }
            
            // Ensure debt.total_deuda is treated as number, and perform calculation
            const currentTotal = toNumber(debt.total_deuda);
            const newTotal = tipo === 'pago' ? currentTotal - amountSafe : currentTotal + amountSafe;
            const newStatus = newTotal <= 0 ? 'pagado' : 'pendiente';

            await db.run(`
                UPDATE deudas 
                SET total_deuda = ?, historial = ?, estado = ?, updated_at = NOW() 
                WHERE id = ?
            `, [newTotal, JSON.stringify(updatedHistory), newStatus, id]);

            const updatedDebt = await db.get('SELECT * FROM deudas WHERE id = ?', [id]);
            if (updatedDebt && typeof updatedDebt.historial === 'string') {
                updatedDebt.historial = JSON.parse(updatedDebt.historial);
            }

            return NextResponse.json(updatedDebt);
        }

        // De lo contrario, es una actualización general
        await db.run(`
            UPDATE deudas 
            SET total_deuda = ?, historial = ?, estado = ?, updated_at = NOW() 
            WHERE id = ?
        `, [total_deuda !== undefined ? toNumber(total_deuda) : toNumber(monto), JSON.stringify(historial || []), estado || 'pendiente', id]);

        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error updating debt:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}

export async function DELETE(request: Request) {
    try {
        const { searchParams } = new URL(request.url);
        const id = searchParams.get('id');
        if (!id) return NextResponse.json({ error: 'ID required' }, { status: 400 });

        await db.run('DELETE FROM deudas WHERE id = ?', [id]);
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('Error deleting debt:', error);
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
