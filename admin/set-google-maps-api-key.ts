import { createClient } from '@supabase/supabase-js';

// Initialize Supabase client
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://your-project.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (!supabaseServiceKey || supabaseServiceKey === 'your-service-role-key') {
  console.error('Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setGoogleMapsApiKey() {
  try {
    console.log('Setting Google Maps API key...');
    
    const { data, error } = await supabase
      .from('app_settings')
      .upsert(
        { 
          key: 'GOOGLE_MAPS_API_KEY', 
          value: 'AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY' 
        },
        { onConflict: 'key' }
      )
      .select();

    if (error) {
      console.error('Error setting API key:', error);
      return;
    }

    console.log('✅ Google Maps API key set successfully!');
    console.log('Updated record:', data);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Run the function
setGoogleMapsApiKey();
