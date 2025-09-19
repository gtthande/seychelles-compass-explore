import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function createTestBusinessUser() {
  try {
    console.log('Creating test business user...');
    
    // Create the business user
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: 'testbusiness@seychellescompass.com',
      password: 'TestBusiness123!',
      email_confirm: true,
      user_metadata: {
        full_name: 'Test Business Owner',
        role: 'business'
      }
    });
    
    if (createError) {
      console.error('Error creating business user:', createError);
      return;
    }
    
    console.log('Business user created successfully:', newUser.user?.id);
    
    // Create profile for business user
    const { data: newProfile, error: createProfileError } = await supabase
      .from('profiles')
      .insert({
        user_id: newUser.user!.id,
        full_name: 'Test Business Owner',
        role: 'business',
        is_business_owner: true
      })
      .select()
      .single();
    
    if (createProfileError) {
      console.error('Error creating business profile:', createProfileError);
      return;
    }
    
    console.log('Business profile created successfully:', newProfile);
    
    console.log('✅ Test business user setup completed successfully!');
    console.log('Email: testbusiness@seychellescompass.com');
    console.log('Password: TestBusiness123!');
    console.log('Role: business');
    
  } catch (error: any) {
    console.error('Error creating test business user:', error.message || error);
  }
}

createTestBusinessUser();
