const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

async function checkFilters() {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    
    if (!supabaseUrl || !supabaseKey) {
        console.error('Missing Supabase environment variables');
        return;
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const { data: filters, error } = await supabase.from('filtros_especiales').select('*');
    
    if (error) {
        console.error('Error fetching filters:', error);
    } else {
        console.log('Filters:', JSON.stringify(filters, null, 2));
    }
}

checkFilters();
