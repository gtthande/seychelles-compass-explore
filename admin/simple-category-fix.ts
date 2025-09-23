import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function simpleCategoryFix() {
  console.log('🔧 Applying simple category search fix...');
  
  try {
    // Get all businesses
    console.log('1. Fetching all businesses...');
    const { data: businesses, error: fetchError } = await supabase
      .from('businesses')
      .select('id, name, category');
    
    if (fetchError) {
      console.error('❌ Error fetching businesses:', fetchError);
      return;
    }
    
    console.log(`✅ Found ${businesses?.length || 0} businesses`);
    
    // Update each business with a text-based category
    console.log('2. Updating businesses with text categories...');
    for (const business of businesses || []) {
      const categoryText = business.category === 'education' ? 'education' : 
                          business.category === 'tourism' ? 'tours' :
                          business.category === 'restaurants' ? 'food' :
                          business.category === 'hotels' ? 'accommodation' :
                          business.category === 'health' ? 'health' :
                          business.category === 'transport' ? 'transport' :
                          business.category === 'finance' ? 'services' :
                          business.category === 'real_estate' ? 'services' :
                          business.category === 'technology' ? 'services' :
                          'other';
      
      const { error: updateError } = await supabase
        .from('businesses')
        .update({ 
          category: categoryText,
          // Add services array if it doesn't exist
          services: business.services || []
        })
        .eq('id', business.id);
      
      if (updateError) {
        console.error(`❌ Error updating ${business.name}:`, updateError);
      } else {
        console.log(`✅ Updated ${business.name}: ${business.category} → ${categoryText}`);
      }
    }
    
    // Test the search
    console.log('3. Testing search functionality...');
    const { data: maritimeResults, error: searchError } = await supabase
      .from('businesses')
      .select('id, name, category, description')
      .eq('status', 'active')
      .or('name.ilike.%maritime%,description.ilike.%maritime%,category.ilike.%maritime%');
    
    if (searchError) {
      console.error('❌ Search error:', searchError);
    } else {
      console.log(`✅ Found ${maritimeResults?.length || 0} businesses matching "maritime"`);
      maritimeResults?.forEach(business => {
        console.log(`  - ${business.name} (${business.category})`);
      });
    }
    
    console.log('\n🎯 Simple category fix completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the fix
simpleCategoryFix();
