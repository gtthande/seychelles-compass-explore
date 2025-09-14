// Direct Admin User Creation (No Email Confirmation)
// This script creates an admin user directly in the database

import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

// Load environment variables
config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function createAdminUserDirect() {
  try {
    console.log('🔐 Creating admin user directly...');
    
    // First, let's try to sign up without email confirmation
    const { data, error } = await supabase.auth.signUp({
      email: 'admin@test.com',
      password: 'admin123',
      options: {
        data: {
          full_name: 'Admin User'
        }
      }
    });

    if (error) {
      console.error('❌ Error creating user:', error.message);
      
      if (error.message.includes('already registered')) {
        console.log('ℹ️  User already exists. Attempting to sign in...');
        
        // Try to sign in
        const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
          email: 'admin@test.com',
          password: 'admin123'
        });

        if (signInError) {
          console.error('❌ Sign in error:', signInError.message);
          return;
        }

        if (signInData.user) {
          console.log('✅ Successfully signed in existing user!');
          console.log('🆔 User ID:', signInData.user.id);
          
          // Create or update profile
          await createOrUpdateProfile(signInData.user.id);
          return;
        }
      }
      return;
    }

    if (data.user) {
      console.log('✅ User created successfully!');
      console.log('🆔 User ID:', data.user.id);
      
      // Create profile
      await createOrUpdateProfile(data.user.id);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

async function createOrUpdateProfile(userId) {
  try {
    console.log('👤 Creating/updating admin profile...');
    
    const { data, error } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        full_name: 'Admin User',
        is_admin: true,
        is_business_owner: false
      });

    if (error) {
      console.error('❌ Error creating profile:', error.message);
      return;
    }

    console.log('✅ Admin profile created/updated successfully!');
    console.log('\n🎉 Admin user is ready!');
    console.log('📧 Email: admin@test.com');
    console.log('🔑 Password: admin123');
    console.log('\n🌐 You can now sign in at http://localhost:5173/auth');
    console.log('⚙️  Then access admin settings at http://localhost:5173/admin/settings');
    
  } catch (error) {
    console.error('💥 Error creating profile:', error.message);
  }
}

createAdminUserDirect();
