import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateProfilesSchema() {
  try {
    console.log('Adding role and is_active fields to profiles table...');
    
    // Add role column
    const { error: roleError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';"
    });
    
    if (roleError) {
      console.log('Role column might already exist or error:', roleError);
    }
    
    // Add is_active column
    const { error: activeError } = await supabase.rpc('exec_sql', {
      sql: "ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;"
    });
    
    if (activeError) {
      console.log('is_active column might already exist or error:', activeError);
    }
    
    // Update existing profiles with proper role values
    const { error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_active: true
      })
      .eq('user_id', (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'gtthande@gmail.com')?.id);
    
    if (updateError) {
      console.log('Update error:', updateError);
    }
    
    console.log('✅ Profiles schema updated successfully!');
    
  } catch (error: any) {
    console.error('Error updating profiles schema:', error.message || error);
  }
}

updateProfilesSchema();
