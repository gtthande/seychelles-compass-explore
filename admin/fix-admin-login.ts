import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function fixAdminLogin() {
  try {
    console.log('Fixing admin login for gtthande@gmail.com...');
    
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
    console.log('User email confirmed:', adminUser.email_confirmed_at);
    console.log('User created at:', adminUser.created_at);
    
    // Update the profile with role (without is_active for now)
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'admin',
        is_admin: true,
        is_business_owner: false
      })
      .eq('user_id', adminUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating profile:', updateError);
      return;
    }
    
    console.log('✅ Admin profile updated successfully:', updatedProfile);
    
    // Also try to reset the password to ensure it's correct
    const { error: passwordError } = await supabase.auth.admin.updateUserById(adminUser.id, {
      password: 'Admin123!'
    });
    
    if (passwordError) {
      console.error('Error updating password:', passwordError);
    } else {
      console.log('✅ Password reset successfully');
    }
    
    console.log('');
    console.log('🔐 Login Credentials:');
    console.log('Email: gtthande@gmail.com');
    console.log('Password: Admin123!');
    console.log('Role: admin');
    console.log('');
    console.log('💡 If login still fails, try:');
    console.log('1. Clear browser cache and cookies');
    console.log('2. Try incognito/private browsing mode');
    console.log('3. Check browser console for any errors');
    
  } catch (error: any) {
    console.error('Error fixing admin login:', error.message || error);
  }
}

fixAdminLogin();
