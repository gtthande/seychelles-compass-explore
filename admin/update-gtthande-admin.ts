import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateGtthandeAdmin() {
  try {
    console.log('Updating gtthande@gmail.com to admin role...');
    
    // First, get the user ID
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
    
    // Update the profile with role and is_active
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_active: true,
        is_admin: true
      })
      .eq('user_id', adminUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Admin profile updated successfully:', updatedProfile);
    
  } catch (error: any) {
    console.error('Error updating admin profile:', error.message || error);
  }
}

updateGtthandeAdmin();
