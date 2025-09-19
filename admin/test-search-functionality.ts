import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testSearchFunctionality() {
  try {
    console.log('Testing search functionality...');
    
    // Test 1: Search for "maritime" (should find Seychelles Maritime Academy)
    console.log('\n1. Testing search for "maritime"...');
    const { data: maritimeResults, error: maritimeError } = await supabase
      .from('businesses')
      .select('id, name, category, description, address, latitude, longitude')
      .eq('status', 'active')
      .or('name.ilike.%maritime%,description.ilike.%maritime%,category.ilike.%maritime%');
    
    if (maritimeError) {
      console.error('❌ Maritime search error:', maritimeError);
    } else {
      console.log('✅ Maritime search results:', maritimeResults?.length || 0);
      maritimeResults?.forEach(business => {
        console.log(`  - ${business.name} (${business.category})`);
        if (business.latitude && business.longitude) {
          console.log(`    Location: ${business.latitude}, ${business.longitude}`);
        }
      });
    }
    
    // Test 2: Search for "education" category
    console.log('\n2. Testing search for "education" category...');
    const { data: educationResults, error: educationError } = await supabase
      .from('businesses')
      .select('id, name, category, description, address, latitude, longitude')
      .eq('status', 'active')
      .eq('category', 'education');
    
    if (educationError) {
      console.error('❌ Education search error:', educationError);
    } else {
      console.log('✅ Education search results:', educationResults?.length || 0);
      educationResults?.forEach(business => {
        console.log(`  - ${business.name} (${business.category})`);
        if (business.latitude && business.longitude) {
          console.log(`    Location: ${business.latitude}, ${business.longitude}`);
        }
      });
    }
    
    // Test 3: Check if categories table has education
    console.log('\n3. Testing categories table...');
    const { data: categories, error: categoriesError } = await supabase
      .from('categories')
      .select('slug, name, is_active')
      .eq('slug', 'education');
    
    if (categoriesError) {
      console.error('❌ Categories error:', categoriesError);
    } else {
      console.log('✅ Education category found:', categories?.length > 0);
      if (categories && categories.length > 0) {
        console.log(`  - ${categories[0].name} (active: ${categories[0].is_active})`);
      }
    }
    
    // Test 4: Test geocoding function
    console.log('\n4. Testing geocoding function...');
    try {
      const { data: geocodeData, error: geocodeError } = await supabase.functions.invoke('geocode-address', {
        body: { address: 'PO Box 48, Providence Mahe, Seychelles' }
      });
      
      if (geocodeError) {
        console.error('❌ Geocoding error:', geocodeError);
      } else {
        console.log('✅ Geocoding result:', geocodeData);
      }
    } catch (error: any) {
      console.error('❌ Geocoding function error:', error.message);
    }
    
    console.log('\n🎉 Search functionality test completed!');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
  }
}

testSearchFunctionality();
