/**
 * Script to check and verify admin status for a user
 * Usage: npx tsx scripts/check-admin-status.ts <user-email>
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing required environment variables:');
  console.error('   VITE_SUPABASE_URL:', !!supabaseUrl);
  console.error('   SUPABASE_SERVICE_ROLE_KEY:', !!supabaseServiceKey);
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminStatus(email?: string) {
  try {
    if (email) {
      // Check specific user by email
      console.log(`\n🔍 Checking admin status for: ${email}\n`);
      
      // Get user from auth
      const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
      
      if (authError || !authUser?.user) {
        console.error('❌ User not found:', authError?.message);
        return;
      }
      
      const userId = authUser.user.id;
      console.log(`✅ User found: ${authUser.user.email} (ID: ${userId})`);
      
      // Get profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profileError || !profile) {
        console.error('❌ Profile not found:', profileError?.message);
        return;
      }
      
      console.log('\n📋 Profile Details:');
      console.log('   ID:', profile.id);
      console.log('   Full Name:', profile.full_name || 'N/A');
      console.log('   Email:', profile.email || 'N/A');
      console.log('   is_admin:', profile.is_admin);
      console.log('   role:', profile.role);
      console.log('   is_business_owner:', profile.is_business_owner);
      console.log('   is_active:', profile.is_active !== false);
      
      const isAdmin = profile.is_admin === true || profile.role === 'admin';
      console.log('\n🔐 Admin Status:', isAdmin ? '✅ YES' : '❌ NO');
      
      if (!isAdmin) {
        console.log('\n💡 To make this user an admin, run:');
        console.log(`   UPDATE public.profiles SET is_admin = true WHERE user_id = '${userId}';`);
        console.log(`   -- OR --`);
        console.log(`   UPDATE public.profiles SET role = 'admin' WHERE user_id = '${userId}';`);
      }
    } else {
      // List all admins
      console.log('\n🔍 Listing all admin users...\n');
      
      const { data: profiles, error } = await supabase
        .from('profiles')
        .select('id, user_id, email, full_name, is_admin, role, is_business_owner')
        .or('is_admin.eq.true,role.eq.admin')
        .order('created_at', { ascending: false });
      
      if (error) {
        console.error('❌ Error fetching profiles:', error.message);
        return;
      }
      
      if (!profiles || profiles.length === 0) {
        console.log('⚠️  No admin users found.');
        return;
      }
      
      console.log(`✅ Found ${profiles.length} admin user(s):\n`);
      profiles.forEach((profile, index) => {
        console.log(`${index + 1}. ${profile.full_name || profile.email || 'N/A'}`);
        console.log(`   Email: ${profile.email || 'N/A'}`);
        console.log(`   User ID: ${profile.user_id}`);
        console.log(`   is_admin: ${profile.is_admin}`);
        console.log(`   role: ${profile.role}`);
        console.log('');
      });
    }
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
  }
}

// Get email from command line arguments
const email = process.argv[2];

checkAdminStatus(email).then(() => {
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

