const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('Checking deudas table schema...');
  // We can't query information_schema easily with js client, but we can try to insert a dummy row with just ID and see what fails, or select * limit 1
  
  const { data, error } = await supabase.from('deudas').select('*').limit(1);
  
  if (error) {
    console.error('Error selecting from deudas:', error);
  } else {
    console.log('Successfully selected from deudas. Sample row:', data[0]);
    if (data.length === 0) {
        console.log('Table exists but is empty. Trying to infer columns from error by inserting invalid column...');
    }
  }

  // Check columns via RPC if available, or just try to insert to see errors
}

checkSchema();
