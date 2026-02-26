const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function createAdmin() {
  try {
    console.log('Creando usuario admin en Supabase...')
    
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'marcospeiti@bertamoda.com',
      password: 'Omega10',
      email_confirm: true
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✓ El usuario admin ya existe')
        return
      }
      throw error
    }

    console.log('✓ Usuario admin creado exitosamente:', data.user.email)
  } catch (error) {
    console.error('Error al crear admin:', error.message)
    process.exit(1)
  }
}

createAdmin()
