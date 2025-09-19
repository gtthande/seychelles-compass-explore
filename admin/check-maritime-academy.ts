import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bwlmlniotyrjttglbjrl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function checkMaritimeAcademy() {
  try {
    console.log('Checking for Seychelles Maritime Academy...');
    
    // Check if the business exists
    const { data: business, error: businessError } = await supabase
      .from('businesses')
      .select('*')
      .ilike('name', '%maritime%')
      .or('name.ilike.%academy%');

    if (businessError) {
      console.error('Error checking business:', businessError);
      return;
    }

    console.log('Found businesses:', business);

    // If not found, create it
    if (!business || business.length === 0) {
      console.log('Creating Seychelles Maritime Academy...');
      
      const { data: newBusiness, error: createError } = await supabase
        .from('businesses')
        .insert({
          name: 'Seychelles Maritime Academy',
          description: 'Premier maritime training institution offering comprehensive courses in navigation, marine engineering, and maritime safety. Providing world-class education for the maritime industry.',
          category: 'education',
          status: 'active',
          phone: '+248 4 123 456',
          email: 'info@maritimeacademy.sc',
          website: 'https://maritimeacademy.sc',
          address: 'Victoria, Mahé, Seychelles',
          island: 'Mahé',
          latitude: -4.6200,
          longitude: 55.4500,
          featured: true,
          verified: true,
          logo_url: '',
          cover_image_url: '',
          average_rating: 4.8,
          total_reviews: 25,
          services: ['Maritime Training', 'Navigation Courses', 'Marine Engineering', 'Safety Training', 'Certification Programs']
        })
        .select();

      if (createError) {
        console.error('Error creating business:', createError);
      } else {
        console.log('Seychelles Maritime Academy created successfully:', newBusiness);
      }
    }
  } catch (error) {
    console.error('Error:', error);
  }
}

checkMaritimeAcademy();
