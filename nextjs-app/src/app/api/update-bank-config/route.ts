import { NextResponse } from 'next/server';
import db from '@/lib/db';

export async function GET() {
  try {
    // Fetch current config instead of hardcoding
    const configRows = await db.all("SELECT clave, valor FROM configuracion WHERE clave IN ('cvu', 'titular_cuenta', 'banco', 'alias', 'bank_config')") as any[];
    const currentConfig: Record<string, any> = {};
    configRows.forEach(row => {
        try { currentConfig[row.clave] = JSON.parse(row.valor); } catch { currentConfig[row.clave] = row.valor; }
    });

    const bankConfig = {
      cvu: currentConfig.cvu || '',
      alias: currentConfig.alias || '',
      accountHolder: currentConfig.titular_cuenta || '',
      bankName: currentConfig.banco || '',
      cbu: currentConfig.cvu || ''
    };

    return NextResponse.json({ success: true, config: bankConfig });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
