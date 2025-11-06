/**
 * Script to set admin status for a user
 * Usage: npx tsx scripts/set-admin.ts <user-email> [true|false]
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

async function setAdminStatus(email: string, isAdmin: boolean) {
  try {
    console.log(`\n🔍 Setting admin status for: ${email}\n`);
    
    // Get user from auth
    const { data: authUser, error: authError } = await supabase.auth.admin.getUserByEmail(email);
    
    if (authError || !authUser?.user) {
      console.error('❌ User not found:', authError?.message);
      process.exit(1);
    }
    
    const userId = authUser.user.id;
    console.log(`✅ User found: ${authUser.user.email} (ID: ${userId})`);
    
    // Get current profile
    const { data: currentProfile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .single();
    
    if (profileError || !currentProfile) {
      console.error('❌ Profile not found:', profileError?.message);
      console.log('💡 Creating profile...');
      
      // Create profile
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          user_id: userId,
          email: authUser.user.email || '',
          full_name: authUser.user.user_metadata?.full_name || '',
          is_admin: isAdmin,
          role: isAdmin ? 'admin' : 'user',
          is_business_owner: false,
          is_active: true
        })
        .select()
        .single();
      
      if (createError) {
        console.error('❌ Error creating profile:', createError.message);
        process.exit(1);
      }
      
      console.log('✅ Profile created successfully!');
      console.log('   is_admin:', newProfile.is_admin);
      console.log('   role:', newProfile.role);
      return;
    }
    
    console.log('📋 Current profile:');
    console.log('   is_admin:', currentProfile.is_admin);
    console.log('   role:', currentProfile.role);
    
    // Update profile
    const updates: any = {
      is_admin: isAdmin,
      updated_at: new Date().toISOString()
    };
    
    if (isAdmin) {
      updates.role = 'admin';
    } else if (currentProfile.role === 'admin') {
      // If removing admin, set role to 'user' or 'business' based on is_business_owner
      updates.role = currentProfile.is_business_owner ? 'business' : 'user';
    }
    
    const { data: updatedProfile, error: updateError } = await supabase
      .from('profiles')
      .update(updates)
      .eq('user_id', userId)
      .select()
      .single();
    
    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      process.exit(1);
    }
    
    console.log('\n✅ Profile updated successfully!');
    console.log('   is_admin:', updatedProfile.is_admin);
    console.log('   role:', updatedProfile.role);
    console.log('\n💡 User may need to refresh their session or log out/in for changes to take effect.');
  } catch (error: any) {
    console.error('❌ Error:', error.message);
    console.error(error);
    process.exit(1);
  }
}

// Get arguments from command line
const email = process.argv[2];
const adminFlag = process.argv[3]?.toLowerCase();

if (!email) {
  console.error('❌ Usage: npx tsx scripts/set-admin.ts <user-email> [true|false]');
  process.exit(1);
}

const isAdmin = adminFlag === 'false' ? false : true;

setAdminStatus(email, isAdmin).then(() => {
  console.log('\n✅ Done!');
  process.exit(0);
}).catch((error) => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});

