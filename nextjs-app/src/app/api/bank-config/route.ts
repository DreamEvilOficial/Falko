import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import db from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Verificar autenticación de admin
    const adminSession = cookieStore.get('admin-session')?.value
    
    if (!adminSession || adminSession !== 'authenticated') {
      return NextResponse.json(
        { error: 'No autorizado - Sesión requerida' },
        { status: 401 }
      )
    }

    const row = await db.get('SELECT valor FROM configuracion WHERE clave = ?', ['bank_config']);
    let config = {
      accountHolder: '',
      bankName: '',
      accountNumber: '',
      cbu: '',
      alias: '',
      accountType: 'corriente'
    };

    if (row && row.valor) {
        try {
            config = { ...config, ...JSON.parse(row.valor) };
        } catch (e) {
            console.error('Error parsing bank config:', e);
        }
    }

    return NextResponse.json({
      success: true,
      config
    })

  } catch (error) {
    console.error('Error getting bank config:', error)
    return NextResponse.json(
      { error: 'Error al obtener configuración bancaria' },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    
    // Verificar autenticación de admin
    const adminSession = cookieStore.get('admin-session')?.value
    
    if (!adminSession || adminSession !== 'authenticated') {
      return NextResponse.json(
        { error: 'No autorizado - Sesión requerida' },
        { status: 401 }
      )
    }

    const data = await request.json()
    
    // Validar campos requeridos
    if (!data.accountHolder || !data.bankName || !data.accountNumber) {
      return NextResponse.json(
        { error: 'Faltan campos requeridos: titular, banco y número de cuenta' },
        { status: 400 }
      )
    }

    const config = {
      accountHolder: data.accountHolder || '',
      bankName: data.bankName || '',
      accountNumber: data.accountNumber || '',
      cbu: data.cbu || '',
      alias: data.alias || '',
      accountType: data.accountType || 'corriente'
    }
    
    const valStr = JSON.stringify(config);
    
    // Check if exists
    const exists = await db.get('SELECT id FROM configuracion WHERE clave = ?', ['bank_config']);
    
    if (exists) {
        await db.run('UPDATE configuracion SET valor = ?, updated_at = CURRENT_TIMESTAMP WHERE clave = ?', [valStr, 'bank_config']);
    } else {
        const { v4: uuidv4 } = require('uuid');
        await db.run('INSERT INTO configuracion (id, clave, valor) VALUES (?, ?, ?)', [uuidv4(), 'bank_config', valStr]);
    }

    return NextResponse.json({
      success: true,
      message: 'Configuración bancaria guardada exitosamente',
      config
    })

  } catch (error) {
    console.error('Error saving bank config:', error)
    return NextResponse.json(
      { error: 'Error al guardar configuración bancaria' },
      { status: 500 }
    )
  }
}
