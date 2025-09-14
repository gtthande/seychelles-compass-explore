// Create Admin User Script (Bypasses Email Confirmation)
// Run this with: node create-admin-bypass.js

import { createClient } from '@supabase/supabase-js';

// You need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('You can find this in your Supabase project settings > API > service_role key');
  console.log('Or run: export SUPABASE_SERVICE_ROLE_KEY=your_actual_key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUserBypass() {
  try {
    console.log('🔐 Creating admin user (bypassing email confirmation)...');
    
    // Create the user in Supabase Auth with email confirmation bypassed
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@icompass.sc',
      password: 'admin123',
      email_confirm: true, // This bypasses email confirmation
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
      
      // If user already exists, try to update their profile
      if (authError.message.includes('already registered')) {
        console.log('ℹ️  User already exists, updating profile...');
        await updateExistingUser();
        return;
      }
      return;
    }

    console.log('✅ Auth user created:', authData.user?.id);

    // Create the profile with admin privileges
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user.id,
        full_name: 'Admin User',
        is_admin: true,
        is_business_owner: false
      });

    if (profileError) {
      console.error('❌ Error creating profile:', profileError.message);
      return;
    }

    console.log('✅ Admin user created successfully!');
    console.log('📧 Email: admin@icompass.sc');
    console.log('🔑 Password: admin123');
    console.log('🆔 User ID:', authData.user.id);
    console.log('\n🌐 You can now sign in at http://localhost:5173/auth');
    console.log('⚙️  Then access admin settings at http://localhost:5173/admin/settings');
    
  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function updateExistingUser() {
  try {
    // Get the existing user
    const { data: users, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ Error listing users:', listError.message);
      return;
    }

    const adminUser = users.users.find(user => user.email === 'admin@icompass.sc');
    
    if (!adminUser) {
      console.error('❌ Admin user not found');
      return;
    }

    console.log('✅ Found existing user:', adminUser.id);

    // Update the profile to make them admin
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: adminUser.id,
        full_name: 'Admin User',
        is_admin: true,
        is_business_owner: false
      });

    if (profileError) {
      console.error('❌ Error updating profile:', profileError.message);
      return;
    }

    console.log('✅ Existing user updated to admin!');
    console.log('📧 Email: admin@icompass.sc');
    console.log('🔑 Password: admin123');
    console.log('\n🌐 You can now sign in at http://localhost:5173/auth');
    console.log('⚙️  Then access admin settings at http://localhost:5173/admin/settings');
    
  } catch (error) {
    console.error('💥 Error updating user:', error.message);
  }
}

createAdminUserBypass();
