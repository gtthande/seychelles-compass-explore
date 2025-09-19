import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addProfileColumns() {
  try {
    console.log('Adding role and is_active columns to profiles table...');
    
    // Use the REST API to execute raw SQL
    const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
        'apikey': SUPABASE_SERVICE_ROLE_KEY
      },
      body: JSON.stringify({
        sql: `
          ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user';
          ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
        `
      })
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log('Response status:', response.status);
      console.log('Response text:', errorText);
    } else {
      console.log('✅ Columns added successfully!');
    }
    
    // Now update gtthande's profile
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
    
    // Update the profile
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
      return;
    }
    
    console.log('✅ Admin profile updated successfully:', updatedProfile);
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

addProfileColumns();
