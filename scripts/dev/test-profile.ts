/**
 * Test Profile Creation Logic
 * 
 * This script tests the profile creation logic to ensure it works correctly.
 * Run with: npx tsx scripts/dev/test-profile.ts
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import * as path from 'path';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
dotenv.config({ path: path.resolve(process.cwd(), '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase configuration in .env file');
  console.error('   Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testProfileLogic() {
  console.log('🧪 Testing Profile Creation Logic\n');
  console.log('=' .repeat(60));
  
  try {
    // Step 1: Get authenticated user
    console.log('\n📋 Step 1: Getting authenticated user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ Auth error:', {
        code: authError.code,
        message: authError.message,
        status: authError.status
      });
      console.log('\n💡 You need to be logged in. Please:');
      console.log('   1. Log in at http://localhost:5173/auth');
      console.log('   2. Copy your session token from browser localStorage');
      console.log('   3. Or run this script in a browser context');
      return;
    }
    
    if (!user) {
      console.error('❌ No user found');
      console.log('\n💡 Please log in first at http://localhost:5173/auth');
      return;
    }
    
    console.log('✅ User found:', {
      id: user.id,
      email: user.email
    });
    
    // Step 2: Check if profile exists
    console.log('\n📋 Step 2: Checking for existing profile...');
    
    // Try by id first
    const { data: profileById, error: errorById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    console.log('   Check by id:', {
      found: !!profileById,
      error: errorById ? {
        code: errorById.code,
        message: errorById.message
      } : null
    });
    
    if (profileById) {
      console.log('✅ Profile exists:', {
        id: profileById.id,
        user_id: profileById.user_id,
        role: profileById.role,
        is_admin: profileById.is_admin,
        email: profileById.email
      });
      return;
    }
    
    // Try by user_id if not found by id
    if (errorById?.code === 'PGRST116' || !profileById) {
      console.log('   Profile not found by id, trying user_id...');
      const { data: profileByUserId, error: errorByUserId } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('   Check by user_id:', {
        found: !!profileByUserId,
        error: errorByUserId ? {
          code: errorByUserId.code,
          message: errorByUserId.message
        } : null
      });
      
      if (profileByUserId) {
        console.log('✅ Profile exists:', {
          id: profileByUserId.id,
          user_id: profileByUserId.user_id,
          role: profileByUserId.role,
          is_admin: profileByUserId.is_admin,
          email: profileByUserId.email
        });
        return;
      }
    }
    
    // Step 3: Create profile
    console.log('\n📋 Step 3: Profile not found, creating new profile...');
    
    // Try creating with both id and user_id
    console.log('   Attempt 1: Creating with id and user_id...');
    let { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        role: 'user',
        is_admin: false,
        is_active: true,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: '',
        business_name: '',
        is_business_owner: false
      })
      .select()
      .single();
    
    console.log('   Result:', {
      success: !!newProfile,
      error: createError ? {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      } : null
    });
    
    // If that fails, try with just id
    if (createError && (createError.code === '42703' || createError.message?.includes('column') || createError.message?.includes('does not exist'))) {
      console.log('   Attempt 2: Retrying with id only...');
      const retryResult = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          role: 'user',
          is_admin: false,
          is_active: true
        })
        .select()
        .single();
      
      newProfile = retryResult.data;
      createError = retryResult.error;
      
      console.log('   Result:', {
        success: !!newProfile,
        error: createError ? {
          code: createError.code,
          message: createError.message
        } : null
      });
    }
    
    // If still fails, try with just user_id
    if (createError && (createError.code === '42703' || createError.message?.includes('column') || createError.message?.includes('does not exist'))) {
      console.log('   Attempt 3: Retrying with user_id only...');
      const retryResult = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          phone: '',
          business_name: '',
          is_business_owner: false,
          is_admin: false,
          role: 'user'
        })
        .select()
        .single();
      
      newProfile = retryResult.data;
      createError = retryResult.error;
      
      console.log('   Result:', {
        success: !!newProfile,
        error: createError ? {
          code: createError.code,
          message: createError.message
        } : null
      });
    }
    
    if (createError) {
      console.error('\n❌ Profile creation failed:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        status: createError.status
      });
      
      // Provide helpful error messages
      if (createError.code === '42501') {
        console.log('\n💡 Fix: RLS policy is blocking profile creation.');
        console.log('   Run this SQL in Supabase Dashboard → SQL Editor:');
        console.log('   CREATE POLICY "Users can insert their own profile" ON public.profiles');
        console.log('   FOR INSERT WITH CHECK (auth.uid() = id OR auth.uid() = user_id);');
      } else if (createError.code === '23505') {
        console.log('\n💡 Fix: Profile already exists (duplicate key).');
        console.log('   Try refreshing the page or checking the database.');
      } else if (createError.message?.includes('timeout') || createError.message?.includes('Failed to fetch')) {
        console.log('\n💡 Fix: Network timeout or CORS issue.');
        console.log('   1. Check your internet connection');
        console.log('   2. Add CORS settings in Supabase Dashboard → Settings → API');
        console.log('   3. Add: http://localhost:5173, http://127.0.0.1:5173');
      } else if (createError.code === 'PGRST301') {
        console.log('\n💡 Fix: CORS error.');
        console.log('   Add your URLs to Supabase CORS settings:');
        console.log('   Settings → API → CORS Configuration');
      }
      
      return;
    }
    
    if (newProfile) {
      console.log('\n✅ Profile created successfully:', {
        id: newProfile.id,
        user_id: newProfile.user_id,
        role: newProfile.role,
        is_admin: newProfile.is_admin,
        email: newProfile.email
      });
      console.log('\n🎉 Test completed successfully!');
    } else {
      console.error('\n❌ Profile creation returned no data and no error');
    }
    
  } catch (err: any) {
    console.error('\n❌ Unexpected error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
  }
  
  console.log('\n' + '='.repeat(60));
}

// Run the test
testProfileLogic()
  .then(() => {
    console.log('\n✅ Test script completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Test script failed:', error);
    process.exit(1);
  });

