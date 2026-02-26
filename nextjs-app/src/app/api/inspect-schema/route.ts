
import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json({ error: 'No supabase admin client' }, { status: 500 });
    }

    // Consultamos una fila para ver sus columnas
    const { data, error } = await supabaseAdmin.from('productos').select('*').limit(1);
    
    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    const columns = data.length > 0 ? Object.keys(data[0]) : 'No data to inspect columns';

    return NextResponse.json({ 
      tableName: 'productos',
      columns: columns,
      sampleData: data[0] || null
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}
