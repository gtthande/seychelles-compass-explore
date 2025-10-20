#!/usr/bin/env node

/**
 * Test Database Connection and Check for Data
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 DATABASE CONNECTION TEST');
console.log('===========================');

async function testDatabaseConnection() {
  try {
    if (!supabaseUrl || !supabaseServiceKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }

    console.log('✅ Supabase credentials found');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Service Key: ${supabaseServiceKey.substring(0, 20)}...`);

    // Create admin client
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Test connection with a simple query
    console.log('\n🔍 Testing database connection...');
    const { data: businesses, error } = await supabase
      .from('businesses')
      .select('id, name, category')
      .limit(5);

    if (error) {
      console.log('❌ Database connection failed:', error.message);
      return false;
    }

    console.log('✅ Database connection successful');
    console.log(`📊 Found ${businesses?.length || 0} businesses`);

    if (businesses && businesses.length > 0) {
      console.log('📋 Sample businesses:');
      businesses.forEach((business, index) => {
        console.log(`   ${index + 1}. ${business.name} (${business.category})`);
      });
    } else {
      console.log('⚠️  No businesses found - seeding demo data...');
      
      // Insert demo business
      const { data: newBusiness, error: insertError } = await supabase
        .from('businesses')
        .insert({
          id: 'demo1',
          name: 'Seychelles Maritime Academy',
          category: 'education',
          address: 'Providence, Mahé',
          owner_id: '6e9d39ce-9185-49f8-86b5-3a4167ca55d9', // Admin user ID
          status: 'active'
        })
        .select();

      if (insertError) {
        console.log('❌ Failed to insert demo business:', insertError.message);
        return false;
      }

      console.log('✅ Demo business inserted successfully');
      console.log(`   Name: ${newBusiness[0].name}`);
    }

    // Test profiles table
    console.log('\n🔍 Testing profiles table...');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('id, email, role, is_admin')
      .limit(3);

    if (profilesError) {
      console.log('❌ Profiles query failed:', profilesError.message);
      return false;
    }

    console.log('✅ Profiles table accessible');
    console.log(`📊 Found ${profiles?.length || 0} profiles`);

    if (profiles && profiles.length > 0) {
      console.log('📋 Sample profiles:');
      profiles.forEach((profile, index) => {
        console.log(`   ${index + 1}. ${profile.email} (${profile.role}) - Admin: ${profile.is_admin}`);
      });
    }

    return true;

  } catch (error) {
    console.log('❌ Database test failed:', error.message);
    return false;
  }
}

// Run the test
testDatabaseConnection().then(success => {
  if (success) {
    console.log('\n🎉 DATABASE TEST SUCCESSFUL');
    console.log('✅ Connection established');
    console.log('✅ Data accessible');
    console.log('✅ System ready for operation');
  } else {
    console.log('\n❌ DATABASE TEST FAILED');
    console.log('⚠️  Please check your Supabase configuration');
  }
  process.exit(success ? 0 : 1);
});
