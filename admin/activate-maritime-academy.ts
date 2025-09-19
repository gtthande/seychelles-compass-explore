import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bwlmlniotyrjttglbjrl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function activateMaritimeAcademy() {
  try {
    console.log('Activating Seychelles Maritime Academy...');
    
    const { data, error } = await supabase
      .from('businesses')
      .update({ 
        status: 'active',
        featured: true,
        verified: true
      })
      .eq('name', 'Seychelles Maritime Academy')
      .select();

    if (error) {
      console.error('Error updating business:', error);
    } else {
      console.log('Seychelles Maritime Academy activated successfully:', data);
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

activateMaritimeAcademy();
