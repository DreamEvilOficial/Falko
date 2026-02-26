import { NextRequest, NextResponse } from 'next/server'
import { sanitizeFilename } from '@/lib/security'
import { supabaseAdmin } from '@/lib/supabase'

// Tamaño máximo de archivo: 5MB
const MAX_FILE_SIZE = 5 * 1024 * 1024

// Tipos MIME permitidos
const ALLOWED_TYPES = [
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif'
]

export async function POST(request: NextRequest) {
  try {
    // Rate limiting simple (mejorar con Redis en producción)
    const ip = request.headers.get('x-forwarded-for') || 'unknown'
    
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    // Validar tipo de archivo
    if (!ALLOWED_TYPES.includes(file.type)) {
      return NextResponse.json(
        { error: 'Invalid file type. Only images allowed.' },
        { status: 400 }
      )
    }

    // Validar tamaño de archivo
    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: 'File too large. Maximum size is 5MB.' },
        { status: 400 }
      )
    }

    // Generar nombre único y sanitizado
    const timestamp = Date.now()
    const sanitizedName = sanitizeFilename(file.name)
    const fileName = `${timestamp}-${sanitizedName}`

    // Convertir File a ArrayBuffer
    const arrayBuffer = await file.arrayBuffer()
    const buffer = Buffer.from(arrayBuffer)

    // Usar Service Role OBLIGATORIAMENTE para bypass policies
    if (!supabaseAdmin) {
        console.error('SUPABASE_SERVICE_ROLE_KEY missing in upload-image')
        return NextResponse.json(
            { error: 'Server configuration error: Admin client not available' },
            { status: 500 }
        )
    }

    const { data, error } = await supabaseAdmin.storage
      .from('productos')
      .upload(fileName, buffer, {
        contentType: file.type,
        upsert: false,
        cacheControl: '3600'
      })

    if (error) {
      console.error('Error uploading to Supabase:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    // Obtener URL pública
    const { data: publicUrlData } = supabaseAdmin.storage
      .from('productos')
      .getPublicUrl(fileName)

    return NextResponse.json({ 
      url: publicUrlData.publicUrl,
      fileName: fileName
    })
  } catch (error: any) {
    console.error('Error in upload:', error)
    return NextResponse.json(
      { error: 'Error uploading file', details: error.message || JSON.stringify(error) },
      { status: 500 }
    )
  }
}
