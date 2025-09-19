import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createVisitorUser() {
  try {
    console.log('Creating visitor user...');
    
    // Create the visitor user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'visitor@seychellescompass.com',
      password: 'Visitor123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Seychelles Visitor',
        role: 'visitor'
      }
    });
    
    if (createError) {
      console.error('Error creating visitor user:', createError);
      return;
    }
    
    console.log('Visitor user created successfully:', newUser.user?.id);
    
    // Create profile for visitor user
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.user!.id,
        full_name: 'Seychelles Visitor',
        is_admin: false,
        is_business_owner: false
      })
      .select()
      .single();
    
    if (createProfileError) {
      console.error('Error creating visitor profile:', createProfileError);
      return;
    }
    
    console.log('Visitor profile created successfully:', newProfile);
    
    console.log('✅ Visitor user setup completed successfully!');
    console.log('Email: visitor@seychellescompass.com');
    console.log('Password: Visitor123!');
    console.log('Role: visitor');
    
  } catch (error: any) {
    console.error('Error creating visitor user:', error.message || error);
  }
}

createVisitorUser();