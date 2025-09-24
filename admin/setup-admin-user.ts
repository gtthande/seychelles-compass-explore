import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function setupAdminUser() {
  console.log('🔐 Setting up admin user...');
  
  try {
    // First, let's see what users exist
    const { data: existingProfiles, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .limit(10);
    
    if (fetchError) {
      console.error('❌ Error fetching profiles:', fetchError);
      return;
    }
    
    console.log('📊 Existing profiles:');
    existingProfiles?.forEach((profile, index) => {
      console.log(`${index + 1}. ${profile.full_name || 'No name'} (${profile.email || 'No email'}) - Role: ${profile.role}, Admin: ${profile.is_admin}, Business: ${profile.is_business_owner}`);
    });
    
    // Look for gtthande@gmail.com or create admin profile
    const adminEmail = 'gtthande@gmail.com';
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (adminError && adminError.code !== 'PGRST116') {
      console.error('❌ Error checking for admin profile:', adminError);
      return;
    }
    
    if (adminProfile) {
      // Update existing profile to admin
      console.log('✅ Found existing profile for gtthande@gmail.com');
      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          is_admin: true,
          is_business_owner: true,
          role: 'admin',
          updated_at: new Date().toISOString()
        })
        .eq('id', adminProfile.id);
      
      if (updateError) {
        console.error('❌ Error updating admin profile:', updateError);
      } else {
        console.log('✅ Updated profile to admin role');
      }
    } else {
      // Create new admin profile
      console.log('🔧 Creating new admin profile...');
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: '550e8400-e29b-41d4-a716-446655440001', // Fixed UUID for admin
          email: adminEmail,
          full_name: 'Admin User',
          phone: '',
          business_name: 'Seychelles Compass Admin',
          is_business_owner: true,
          is_admin: true,
          role: 'admin'
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating admin profile:', createError);
      } else {
        console.log('✅ Created admin profile:', newProfile);
      }
    }
    
    // Verify admin setup
    const { data: finalProfile, error: verifyError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', adminEmail)
      .single();
    
    if (verifyError) {
      console.error('❌ Error verifying admin profile:', verifyError);
    } else {
      console.log('\n🎯 Admin User Setup Complete:');
      console.log('============================');
      console.log(`Email: ${finalProfile.email}`);
      console.log(`Name: ${finalProfile.full_name}`);
      console.log(`Role: ${finalProfile.role}`);
      console.log(`Is Admin: ${finalProfile.is_admin}`);
      console.log(`Is Business Owner: ${finalProfile.is_business_owner}`);
      console.log(`User ID: ${finalProfile.user_id}`);
      console.log('\n📝 IMPORTANT: You need to create this user in Supabase Auth:');
      console.log('1. Go to your Supabase dashboard');
      console.log('2. Navigate to Authentication > Users');
      console.log('3. Click "Add user"');
      console.log('4. Use these details:');
      console.log(`   - Email: ${adminEmail}`);
      console.log('   - Password: Admin123!');
      console.log(`   - User ID: ${finalProfile.user_id}`);
      console.log('5. Make sure to use the exact User ID above');
    }
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

setupAdminUser();