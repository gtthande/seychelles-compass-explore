import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function manualSchemaUpdate() {
  try {
    console.log('Manually updating profiles table schema...');
    
    // First, let's check the current schema
    const { data: currentProfiles, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (checkError) {
      console.error('Error checking profiles:', checkError);
      return;
    }
    
    console.log('Current profiles schema sample:', currentProfiles);
    
    // Try to update existing profiles with role and is_active
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const adminUser = authUsers.users.find(user => user.email === 'gtthande@gmail.com');
    
    if (!adminUser) {
      console.error('Admin user not found');
      return;
    }
    
    console.log('Found admin user:', adminUser.id);
    
    // Try to update the profile with the new fields
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_active: true
      })
      .eq('user_id', adminUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      console.log('This might be because the columns don\'t exist yet.');
      console.log('Please run the SQL migration manually in the Supabase dashboard:');
      console.log(`
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
        ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
      `);
      return;
    }
    
    console.log('✅ Profile updated successfully:', updatedProfile);
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

manualSchemaUpdate();
