import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bwlmlniotyrjttglbjrl.supabase.co";
const SUPABASE_SERVICE_ROLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addEducationCategory() {
  try {
    console.log('Adding Education category...');
    
    const { data, error } = await supabase
      .from('categories')
      .insert({
        name: 'Education',
        slug: 'education',
        description: 'Schools, universities, training centers, and educational services',
        is_active: true
      })
      .select();

    if (error) {
      if (error.code === '23505') {
        console.log('Education category already exists');
        return;
      }
      throw error;
    }

    console.log('Education category added successfully:', data);
  } catch (error) {
    console.error('Error adding Education category:', error);
  }
}

addEducationCategory();
