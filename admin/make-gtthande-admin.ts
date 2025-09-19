import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function makeGtthandeAdmin() {
  try {
    console.log('Making gtthande@gmail.com an administrator...');
    
    // First, get the user ID for gtthande@gmail.com
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError);
      return;
    }
    
    const gtthandeUser = users.users.find(user => user.email === 'gtthande@gmail.com');
    
    if (!gtthandeUser) {
      console.log('User gtthande@gmail.com not found. Creating user...');
      
      // Create the user
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: 'gtthande@gmail.com',
        password: 'Seychelles2024!',
        email_confirm: true,
        user_metadata: {
          full_name: 'George Thande'
        }
      });
      
      if (createError) {
        console.error('Error creating user:', createError);
        return;
      }
      
      console.log('User created successfully:', newUser.user?.id);
      
      // Now create the profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .insert({
          user_id: newUser.user!.id,
          email: 'gtthande@gmail.com',
          full_name: 'George Thande',
          is_admin: true,
          role: 'admin'
        })
        .select();
      
      if (profileError) {
        console.error('Error creating profile:', profileError);
        return;
      }
      
      console.log('Profile created successfully:', profile);
    } else {
      console.log('User found:', gtthandeUser.id);
      
      // Update or create the profile
      const { data: existingProfile, error: profileCheckError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', gtthandeUser.id)
        .single();
      
      if (profileCheckError && profileCheckError.code !== 'PGRST116') {
        console.error('Error checking profile:', profileCheckError);
        return;
      }
      
      if (existingProfile) {
        // Update existing profile
        const { data: updatedProfile, error: updateError } = await supabase
          .from('profiles')
          .update({
            is_admin: true,
            role: 'admin'
          })
          .eq('user_id', gtthandeUser.id)
          .select();
        
        if (updateError) {
          console.error('Error updating profile:', updateError);
          return;
        }
        
        console.log('Profile updated successfully:', updatedProfile);
      } else {
        // Create new profile
        const { data: newProfile, error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            user_id: gtthandeUser.id,
            email: 'gtthande@gmail.com',
            full_name: 'George Thande',
            is_admin: true,
            role: 'admin'
          })
          .select();
        
        if (createProfileError) {
          console.error('Error creating profile:', createProfileError);
          return;
        }
        
        console.log('Profile created successfully:', newProfile);
      }
    }
    
    console.log('✅ gtthande@gmail.com is now an administrator!');
    console.log('Login credentials:');
    console.log('Email: gtthande@gmail.com');
    console.log('Password: Seychelles2024!');
    
  } catch (error: any) {
    console.error('Error making gtthande admin:', error.message || error);
  }
}

makeGtthandeAdmin();
