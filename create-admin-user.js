// Create Admin User Script
// Run this with: node create-admin-user.js

const { createClient } = require('@supabase/supabase-js');

// You need to set these environment variables or replace with your actual values
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

if (supabaseServiceKey === 'your-service-role-key') {
  console.error('❌ Please set SUPABASE_SERVICE_ROLE_KEY environment variable');
  console.log('You can find this in your Supabase project settings > API > service_role key');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user...');
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: 'admin@icompass.sc',
      password: 'admin123',
      email_confirm: true,
      user_metadata: {
        full_name: 'Admin User'
      }
    });

    if (authError) {
      console.error('❌ Error creating auth user:', authError.message);
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

createAdminUser();
