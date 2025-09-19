import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function setupAdminUser() {
  try {
    console.log('Setting up admin user for gtthande@gmail.com...');
    
    // First, check if the user exists in auth.users
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const adminUser = authUsers.users.find(user => user.email === 'gtthande@gmail.com');
    
    if (!adminUser) {
      console.log('Admin user not found in auth. Creating new admin user...');
      
      // Create the admin user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'gtthande@gmail.com',
        password: 'Admin123!',
        email_confirm: true,
        user_metadata: {
          full_name: 'George Thande',
          role: 'admin'
        }
      });
      
      if (createError) {
        console.error('Error creating admin user:', createError);
        return;
      }
      
      console.log('Admin user created successfully:', newUser.user?.id);
    } else {
      console.log('Admin user found:', adminUser.id);
    }
    
    // Now ensure the user has admin role in the profiles table
    const userId = adminUser?.id || (await supabase.auth.admin.listUsers()).data.users.find(u => u.email === 'gtthande@gmail.com')?.id;
    
    if (!userId) {
      console.error('Could not find user ID');
      return;
    }
    
    // Check if profile exists
    const { data: existingProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError && profileError.code !== 'PGRST116') {
      console.error('Error checking profile:', profileError);
      return;
    }
    
    if (!existingProfile) {
      // Create profile
      const { data: newProfile, error: createProfileError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          full_name: 'George Thande',
          is_admin: true,
          is_business_owner: false
        })
        .select()
        .single();
      
      if (createProfileError) {
        console.error('Error creating profile:', createProfileError);
        return;
      }
      
      console.log('Admin profile created successfully:', newProfile);
    } else {
      // Update existing profile to admin
      const { data: updatedProfile, error: updateError } = await supabase
        .from('profiles')
        .update({
          is_admin: true,
          is_business_owner: false
        })
        .eq('user_id', userId)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating profile:', updateError);
        return;
      }
      
      console.log('Admin profile updated successfully:', updatedProfile);
    }
    
    console.log('✅ Admin user setup completed successfully!');
    console.log('Email: gtthande@gmail.com');
    console.log('Password: Admin123!');
    console.log('Role: admin');
    
  } catch (error: any) {
    console.error('Error setting up admin user:', error.message || error);
  }
}

setupAdminUser();
