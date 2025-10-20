#!/usr/bin/env node

/**
 * Test Basic Database Connection with Anon Key
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';

// Load environment variables
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      process.env[key] = valueParts.join('=');
    }
  });
}

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🔍 BASIC CONNECTION TEST');
console.log('========================');

async function testBasicConnection() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }

    console.log('✅ Supabase credentials found');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

    // Create client with anon key
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Test connection with a simple query (public data)
    console.log('\n🔍 Testing basic connection...');
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, category')
      .limit(3);

    if (error) {
      console.log('❌ Basic connection failed:', error.message);
      return false;
    }

    console.log('✅ Basic connection successful');
    console.log(`📊 Found ${businesses?.length || 0} businesses`);

    if (businesses && businesses.length > 0) {
      console.log('📋 Sample businesses:');
      businesses.forEach((business, index) => {
        console.log(`   ${index + 1}. ${business.name} (${business.category})`);
      });
    } else {
      console.log('⚠️  No businesses found');
    }

    // Test profiles table (should work with anon key for public data)
    console.log('\n🔍 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role')
      .limit(3);

    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
      return false;
    }

    console.log('✅ Profiles table accessible');
    console.log(`📊 Found ${profiles?.length || 0} profiles`);

    return true;

  } catch (error) {
    console.log('❌ Basic connection test failed:', error.message);
    return false;
  }
}

// Run the test
testBasicConnection().then(success => {
  if (success) {
    console.log('\n🎉 BASIC CONNECTION TEST SUCCESSFUL');
    console.log('✅ Frontend can connect to Supabase');
    console.log('✅ Data is accessible');
    console.log('✅ System ready for frontend operation');
  } else {
    console.log('\n❌ BASIC CONNECTION TEST FAILED');
    console.log('⚠️  Please check your Supabase configuration');
  }
  process.exit(success ? 0 : 1);
});
