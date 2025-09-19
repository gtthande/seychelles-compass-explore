import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function checkCategories() {
  try {
    console.log('Checking categories table...');
    
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .limit(5);
    
    if (error) {
      console.error('Error fetching categories:', error);
      return;
    }
    
    console.log('Categories found:', data);
    
    // Also check businesses
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name, category, status')
      .limit(5);
    
    if (businessError) {
      console.error('Error fetching businesses:', businessError);
      return;
    }
    
    console.log('Businesses found:', businesses);
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

checkCategories();
