import { NextResponse } from 'next/server';
import { supabaseAdmin } from '@/lib/supabase';

export async function POST(req: Request) {
  try {
    if (!supabaseAdmin) {
      throw new Error('Supabase Admin client not configured');
    }

    const formData = await req.formData();
    const file = formData.get('file') as File;
    const folder = (formData.get('folder') as string) || 'uploads';

    if (!file) {
      return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    // Convertir el archivo a un Buffer para subirlo a Supabase
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const fileName = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.]/g, '-')}`;

    const normalizedFolder = folder.toLowerCase();
    const bucketName =
      normalizedFolder === 'uploads'
        ? 'public'
        : normalizedFolder === 'logos'
        ? 'tiendas'
        : normalizedFolder;
    const filePath = fileName;

    // Subir el archivo al bucket correspondiente
    const { data, error } = await supabaseAdmin.storage
      .from(bucketName)
      .upload(filePath, buffer, {
        contentType: file.type,
        upsert: true
      });

    if (error) {
      console.error(`Supabase upload error (bucket: ${bucketName}):`, error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // Obtener la URL pública del archivo
    const { data: { publicUrl } } = supabaseAdmin.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    return NextResponse.json({ publicUrl });
    
  } catch (e: any) {
    console.error('Upload error:', e);
    return NextResponse.json({ error: e.message || 'Upload failed' }, { status: 500 });
  }
}
