import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testSearchFunctionality() {
  console.log('🔍 Testing search functionality...');
  
  try {
    // Test 1: Get all businesses
    console.log('\n1. Fetching all businesses...');
    const { data: allBusinesses, error: allError } = await supabase
      .from('businesses')
      .select('id, name, category, description, status')
      .eq('status', 'active');
    
    if (allError) {
      console.error('❌ Error fetching businesses:', allError);
      return;
    }
    
    console.log(`✅ Found ${allBusinesses?.length || 0} active businesses`);
    if (allBusinesses && allBusinesses.length > 0) {
      console.log('Business names:', allBusinesses.map(b => b.name));
    }
    
    // Test 2: Search for "maritime"
    console.log('\n2. Searching for "maritime"...');
    const { data: maritimeResults, error: maritimeError } = await supabase
      .from('businesses')
      .select('id, name, category_text, description')
      .eq('status', 'active')
      .or('name.ilike.%maritime%,description.ilike.%maritime%,category_text.ilike.%maritime%');
    
    if (maritimeError) {
      console.error('❌ Error searching for maritime:', maritimeError);
    } else {
      console.log(`✅ Found ${maritimeResults?.length || 0} businesses matching "maritime"`);
      if (maritimeResults && maritimeResults.length > 0) {
        maritimeResults.forEach(business => {
          console.log(`  - ${business.name} (${business.category_text || business.category})`);
        });
      }
    }
    
    // Test 3: Search for "academy"
    console.log('\n3. Searching for "academy"...');
    const { data: academyResults, error: academyError } = await supabase
      .from('businesses')
      .select('id, name, category, description')
      .eq('status', 'active')
      .or('name.ilike.%academy%,description.ilike.%academy%,category.ilike.%academy%');
    
    if (academyError) {
      console.error('❌ Error searching for academy:', academyError);
    } else {
      console.log(`✅ Found ${academyResults?.length || 0} businesses matching "academy"`);
      if (academyResults && academyResults.length > 0) {
        academyResults.forEach(business => {
          console.log(`  - ${business.name} (${business.category})`);
        });
      }
    }
    
    // Test 4: Search for "seychelles maritime academy" (exact phrase)
    console.log('\n4. Searching for "seychelles maritime academy"...');
    const { data: smaResults, error: smaError } = await supabase
      .from('businesses')
      .select('id, name, category, description')
      .eq('status', 'active')
      .or('name.ilike.%seychelles maritime academy%,description.ilike.%seychelles maritime academy%');
    
    if (smaError) {
      console.error('❌ Error searching for "seychelles maritime academy":', smaError);
    } else {
      console.log(`✅ Found ${smaResults?.length || 0} businesses matching "seychelles maritime academy"`);
      if (smaResults && smaResults.length > 0) {
        smaResults.forEach(business => {
          console.log(`  - ${business.name} (${business.category})`);
        });
      }
    }
    
    // Test 5: Check if there are any businesses with "education" category
    console.log('\n5. Checking education category businesses...');
    const { data: educationResults, error: educationError } = await supabase
      .from('businesses')
      .select('id, name, category, description')
      .eq('status', 'active')
      .eq('category', 'education');
    
    if (educationError) {
      console.error('❌ Error searching for education category:', educationError);
    } else {
      console.log(`✅ Found ${educationResults?.length || 0} businesses in education category`);
      if (educationResults && educationResults.length > 0) {
        educationResults.forEach(business => {
          console.log(`  - ${business.name} (${business.category})`);
        });
      }
    }
    
    console.log('\n🎯 Search functionality test completed!');
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

// Run the test
testSearchFunctionality();