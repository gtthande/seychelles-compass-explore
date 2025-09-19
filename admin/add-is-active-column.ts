import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

async function addIsActiveColumn() {
  try {
    console.log('Adding is_active column to profiles table...');
    
    // Since we can't run DDL directly, let's try to update existing profiles
    // First, let's get all profiles and update them
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('Error fetching profiles:', profilesError);
      return;
    }
    
    console.log('Found profiles:', profiles?.length);
    
    // Update each profile to set role and is_active
    for (const profile of profiles || []) {
      const updateData: any = {};
      
      // Set role based on existing fields
      if (!profile.role) {
        if (profile.is_admin) {
          updateData.role = 'admin';
        } else if (profile.is_business_owner) {
          updateData.role = 'business';
        } else {
          updateData.role = 'user';
        }
      }
      
      // Try to set is_active (this will fail if column doesn't exist)
      try {
        updateData.is_active = true;
        
        const { error: updateError } = await supabase
          .from('profiles')
          .update(updateData)
          .eq('id', profile.id);
        
        if (updateError) {
          console.log('Update error for profile', profile.id, ':', updateError.message);
          // If is_active column doesn't exist, just update role
          delete updateData.is_active;
          const { error: roleUpdateError } = await supabase
            .from('profiles')
            .update(updateData)
            .eq('id', profile.id);
          
          if (roleUpdateError) {
            console.error('Role update error:', roleUpdateError);
          } else {
            console.log('Updated role for profile:', profile.id);
          }
        } else {
          console.log('Updated profile:', profile.id);
        }
      } catch (error) {
        console.log('Error updating profile', profile.id, ':', error);
      }
    }
    
    console.log('✅ Profile updates completed!');
    console.log('Note: If is_active column doesn\'t exist, please add it manually in Supabase dashboard:');
    console.log('ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;');
    
  } catch (error: any) {
    console.error('Error:', error.message || error);
  }
}

addIsActiveColumn();
