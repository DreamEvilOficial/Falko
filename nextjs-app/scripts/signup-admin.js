const { createClient } = require('@supabase/supabase-js')
require('dotenv').config()

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseAnonKey)

async function signupAdmin() {
  try {
    console.log('Registrando usuario admin en Supabase...')
    
    const { data, error } = await supabase.auth.signUp({
      email: 'marcospeiti@bertamoda.com',
      password: 'Omega10',
    })

    if (error) {
      if (error.message.includes('already registered')) {
        console.log('✓ El usuario admin ya existe')
        return
      }
      throw error
    }

    console.log('✓ Usuario admin registrado exitosamente')
    console.log('Email:', data.user?.email)
    console.log('ID:', data.user?.id)
    console.log('\n⚠️ IMPORTANTE: Verifica tu correo para confirmar la cuenta')
  } catch (error) {
    console.error('Error al registrar admin:', error.message)
    process.exit(1)
  }
}

signupAdmin()
