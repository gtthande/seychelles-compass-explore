import { createClient } from '@supabase/supabase-js';

// You'll need to replace these with your actual Supabase credentials
const supabaseUrl = process.env.VITE_SUPABASE_URL || 'your-supabase-url';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || 'your-service-role-key';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createAdminUser(email: string, password: string, fullName: string) {
  try {
    console.log('Creating admin user...');
    
    // Create the user in Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: {
        full_name: fullName,
        is_admin: true
      }
    });

    if (authError) {
      console.error('Error creating auth user:', authError);
      return;
    }

    console.log('Auth user created:', authData.user?.id);

    // Create the profile with admin privileges
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .insert({
        user_id: authData.user!.id,
        full_name: fullName,
        is_admin: true,
        is_business_owner: false
      });

    if (profileError) {
      console.error('Error creating profile:', profileError);
      return;
    }

    console.log('Admin user created successfully!');
    console.log('Email:', email);
    console.log('Password:', password);
    console.log('User ID:', authData.user?.id);
    
  } catch (error) {
    console.error('Error:', error);
  }
}

// Usage: node admin/create-admin.js
// You can call this function with your desired credentials
createAdminUser('admin@icompass.sc', 'admin123', 'Admin User');
