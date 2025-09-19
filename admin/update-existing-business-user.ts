import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function updateExistingBusinessUser() {
  try {
    console.log('Updating existing business user...');
    
    // Get the business user
    const { data: authUsers, error: authError } = await supabase.auth.admin.listUsers();
    
    if (authError) {
      console.error('Error fetching auth users:', authError);
      return;
    }
    
    const businessUser = authUsers.users.find(user => user.email === 'testbusiness@seychellescompass.com');
    
    if (!businessUser) {
      console.error('Business user not found');
      return;
    }
    
    console.log('Found business user:', businessUser.id);
    
    // Update the profile
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update({
        role: 'business',
        is_business_owner: true,
        full_name: 'Test Business Owner'
      })
      .eq('user_id', businessUser.id)
      .select()
      .single();
    
    if (updateError) {
      console.error('Error updating business profile:', updateError);
      return;
    }
    
    console.log('✅ Business profile updated successfully:', updatedProfile);
    console.log('Email: testbusiness@seychellescompass.com');
    console.log('Password: TestBusiness123!');
    console.log('Role: business');
    
  } catch (error: any) {
    console.error('Error updating business user:', error.message || error);
  }
}

updateExistingBusinessUser();
