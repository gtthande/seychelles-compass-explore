#!/usr/bin/env node

/**
 * Fallback Mode Diagnostic Script
 * Comprehensive check to confirm the system has exited fallback mode
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
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

console.log('🔍 FALLBACK MODE DIAGNOSTIC');
console.log('==========================');
console.log('Checking if system has exited fallback mode...\n');

async function runDiagnostic() {
  let allChecksPassed = true;

  // 1. Environment Variables Check
  console.log('1️⃣ Environment Variables:');
  console.log('----------------------------');
  
  const requiredEnvVars = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_GOOGLE_MAPS_API_KEY',
    'VITE_SITE_URL'
  ];

  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${envVar.includes('KEY') ? value.substring(0, 10) + '...' : value}`);
    } else {
      console.log(`❌ ${envVar}: Missing`);
      allChecksPassed = false;
    }
  }

  // 2. Supabase Connection Check
  console.log('\n2️⃣ Supabase Connection:');
  console.log('-------------------------');
  
  if (!supabaseUrl || !supabaseAnonKey) {
    console.log('❌ Missing Supabase credentials');
    allChecksPassed = false;
  } else {
    try {
      const supabase = createClient(supabaseUrl, supabaseAnonKey);
      
      // Test connection with a simple query
      const { data, error } = await supabase
        .from('profiles')
        .select('count')
        .limit(1);
      
      if (error) {
        console.log('❌ Supabase connection failed:', error.message);
        allChecksPassed = false;
      } else {
        console.log('✅ Supabase connection successful');
      }
    } catch (error) {
      console.log('❌ Supabase connection error:', error.message);
      allChecksPassed = false;
    }
  }

  // 3. Database Schema Check
  console.log('\n3️⃣ Database Schema:');
  console.log('--------------------');
  
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      // Check required tables
      const requiredTables = ['profiles', 'businesses', 'products', 'categories', 'reviews'];
      
      for (const table of requiredTables) {
        try {
          const { data, error } = await supabaseAdmin
            .from(table)
            .select('count')
            .limit(1);
          
          if (error) {
            console.log(`❌ Table ${table}: ${error.message}`);
            allChecksPassed = false;
          } else {
            console.log(`✅ Table ${table}: Accessible`);
          }
        } catch (error) {
          console.log(`❌ Table ${table}: ${error.message}`);
          allChecksPassed = false;
        }
      }
    } catch (error) {
      console.log('❌ Database schema check failed:', error.message);
      allChecksPassed = false;
    }
  } else {
    console.log('❌ Missing Supabase service key for schema check');
    allChecksPassed = false;
  }

  // 4. Admin User Check
  console.log('\n4️⃣ Admin User Verification:');
  console.log('------------------------------');
  
  if (supabaseUrl && supabaseServiceKey) {
    try {
      const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
      
      const { data: adminProfile, error } = await supabaseAdmin
        .from('profiles')
        .select('*')
        .eq('email', 'gtthande@gmail.com')
        .single();
      
      if (error) {
        console.log('❌ Admin user not found:', error.message);
        allChecksPassed = false;
      } else {
        console.log('✅ Admin user exists');
        console.log(`   - Email: ${adminProfile.email}`);
        console.log(`   - Name: ${adminProfile.full_name}`);
        console.log(`   - Is Admin: ${adminProfile.is_admin}`);
        console.log(`   - Role: ${adminProfile.role}`);
        
        if (adminProfile.is_admin || adminProfile.role === 'admin') {
          console.log('✅ Admin permissions correctly configured');
        } else {
          console.log('❌ Admin permissions not configured');
          allChecksPassed = false;
        }
      }
    } catch (error) {
      console.log('❌ Admin user check failed:', error.message);
      allChecksPassed = false;
    }
  }

  // 5. Frontend Configuration Check
  console.log('\n5️⃣ Frontend Configuration:');
  console.log('-----------------------------');
  
  // Check if AdminPanelFallback is being used
  const appTsxPath = path.join(process.cwd(), 'src/App.tsx');
  if (fs.existsSync(appTsxPath)) {
    const appContent = fs.readFileSync(appTsxPath, 'utf8');
    
    if (appContent.includes('AdminPanelFallback')) {
      console.log('❌ App.tsx is still using AdminPanelFallback');
      console.log('   This indicates the system is still in fallback mode');
      allChecksPassed = false;
    } else if (appContent.includes('<AdminPanel />')) {
      console.log('✅ App.tsx is using AdminPanel (not fallback)');
    } else {
      console.log('⚠️  Could not determine which admin panel is being used');
      console.log('   App.tsx content preview:', appContent.substring(0, 200) + '...');
    }
  } else {
    console.log('❌ App.tsx not found');
    allChecksPassed = false;
  }

  // 6. Summary
  console.log('\n📊 FALLBACK MODE DIAGNOSTIC SUMMARY');
  console.log('====================================');
  
  if (allChecksPassed) {
    console.log('🎉 SUCCESS: System has exited fallback mode!');
    console.log('✅ All components are properly configured');
    console.log('✅ Environment variables are loaded');
    console.log('✅ Supabase connection is working');
    console.log('✅ Database schema is intact');
    console.log('✅ Admin user is properly configured');
    console.log('✅ Frontend is using full AdminPanel (not fallback)');
    console.log('\n🚀 The system is ready for full operation!');
  } else {
    console.log('❌ FAILURE: System is still in fallback mode');
    console.log('⚠️  Some components are not properly configured');
    console.log('🔧 Please review the failed checks above');
  }

  return allChecksPassed;
}

// Run the diagnostic
runDiagnostic().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ Diagnostic failed:', error);
  process.exit(1);
});
