// Simple Admin User Creation Script
// This will help you create an admin user through the regular signup process

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

async function createAdminUser() {
  try {
    console.log('🔐 Creating admin user through signup...');
    
    // Try to sign up the user
    const { data, error } = await supabase.auth.signUp({
      email: 'testuser@example.com',
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
        console.log('ℹ️  User already exists. You can now sign in with:');
        console.log('📧 Email: testuser@example.com');
        console.log('🔑 Password: admin123');
        console.log('\n⚠️  Note: You may need to confirm your email or make yourself admin manually.');
        return;
      }
      return;
    }

    if (data.user) {
      console.log('✅ User created successfully!');
      console.log('📧 Email: testuser@example.com');
      console.log('🔑 Password: admin123');
      console.log('🆔 User ID:', data.user.id);
      
      if (data.user.email_confirmed_at) {
        console.log('✅ Email confirmed automatically');
      } else {
        console.log('⚠️  Email confirmation required');
        console.log('   Check your email or disable email confirmation in Supabase dashboard');
      }
      
      console.log('\n🌐 You can now sign in at http://localhost:5173/auth');
      console.log('⚙️  Then access admin settings at http://localhost:5173/admin/settings');
      console.log('\n📝 To make yourself admin, run this SQL in your Supabase dashboard:');
      console.log(`UPDATE profiles SET is_admin = true WHERE user_id = '${data.user.id}';`);
    }

  } catch (error) {
    console.error('💥 Error:', error.message);
  }
}

createAdminUser();
