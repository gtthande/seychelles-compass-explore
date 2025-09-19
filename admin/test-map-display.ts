import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testMapDisplay() {
  try {
    console.log('🗺️ Testing map display for businesses...');
    
    // Get businesses with coordinates
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, address, latitude, longitude, island')
      .eq('status', 'active')
      .not('latitude', 'is', null)
      .not('longitude', 'is', null);
    
    if (error) {
      console.error('❌ Error fetching businesses:', error);
      return;
    }
    
    console.log(`✅ Found ${businesses?.length || 0} businesses with coordinates:`);
    
    businesses?.forEach((business, index) => {
      console.log(`\n${index + 1}. ${business.name}`);
      console.log(`   Address: ${business.address}`);
      console.log(`   Coordinates: ${business.latitude}, ${business.longitude}`);
      console.log(`   Island: ${business.island}`);
      
      // Test OpenStreetMap URL
      const osmUrl = `https://www.openstreetmap.org/export/embed.html?bbox=${business.longitude-0.01},${business.latitude-0.01},${business.longitude+0.01},${business.latitude+0.01}&layer=mapnik&marker=${business.latitude},${business.longitude}`;
      console.log(`   OSM URL: ${osmUrl}`);
      
      // Test Google Maps URL
      const googleMapsUrl = `https://maps.google.com/?q=${business.latitude},${business.longitude}(${encodeURIComponent(business.name + ', ' + business.address)})`;
      console.log(`   Google Maps URL: ${googleMapsUrl}`);
    });
    
    // Test if the map should be visible
    const maritimeAcademy = businesses?.find(b => b.name === 'Seychelles Maritime Academy');
    if (maritimeAcademy) {
      console.log('\n🎯 Seychelles Maritime Academy Map Test:');
      console.log('✅ Has latitude:', !!maritimeAcademy.latitude);
      console.log('✅ Has longitude:', !!maritimeAcademy.longitude);
      console.log('✅ Has address:', !!maritimeAcademy.address);
      console.log('✅ Should show map:', !!(maritimeAcademy.latitude && maritimeAcademy.longitude && maritimeAcademy.address));
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
  }
}

testMapDisplay();
