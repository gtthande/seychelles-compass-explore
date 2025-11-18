#!/usr/bin/env node
/**
 * Verify Supabase Environment Variables
 * Checks if .env.local or .env file has correct Supabase configuration
 */

import { readFileSync, existsSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';
import { createClient } from '@supabase/supabase-js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const rootDir = resolve(__dirname, '..');

// Check for .env.local first, then .env
const envLocalPath = resolve(rootDir, '.env.local');
const envPath = resolve(rootDir, '.env');

let envContent = '';
let envFile = '';

if (existsSync(envLocalPath)) {
  envContent = readFileSync(envLocalPath, 'utf8');
  envFile = '.env.local';
} else if (existsSync(envPath)) {
  envContent = readFileSync(envPath, 'utf8');
  envFile = '.env';
} else {
  console.error('❌ No .env.local or .env file found!');
  console.error('\n📝 Create a .env.local file with:');
  console.error('   VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  console.error('   VITE_SUPABASE_ANON_KEY=your-anon-key-here');
  process.exit(1);
}

console.log(`📄 Reading from: ${envFile}\n`);

// Extract environment variables
const urlMatch = envContent.match(/^VITE_SUPABASE_URL=(.+)$/m);
const keyMatch = envContent.match(/^VITE_SUPABASE_ANON_KEY=(.+)$/m);

const supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
const supabaseAnonKey = keyMatch ? keyMatch[1].trim() : null;

// Validate configuration
console.log('🔍 Checking Supabase Configuration...\n');

let hasErrors = false;

if (!supabaseUrl) {
  console.error('❌ VITE_SUPABASE_URL is not set');
  hasErrors = true;
} else if (supabaseUrl === 'https://your-project.supabase.co' || supabaseUrl.includes('placeholder')) {
  console.error('❌ VITE_SUPABASE_URL is set to placeholder value');
  console.error(`   Current: ${supabaseUrl}`);
  hasErrors = true;
} else if (!supabaseUrl.startsWith('https://')) {
  console.error('❌ VITE_SUPABASE_URL must start with https://');
  console.error(`   Current: ${supabaseUrl}`);
  hasErrors = true;
} else {
  console.log(`✅ VITE_SUPABASE_URL: ${supabaseUrl}`);
}

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY is not set');
  hasErrors = true;
} else if (supabaseAnonKey === 'your-anon-key-here' || supabaseAnonKey === 'placeholder-key') {
  console.error('❌ VITE_SUPABASE_ANON_KEY is set to placeholder value');
  hasErrors = true;
} else if (!supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️  VITE_SUPABASE_ANON_KEY should start with "eyJ" (JWT format)');
  console.warn(`   Current key length: ${supabaseAnonKey.length}`);
} else {
  console.log(`✅ VITE_SUPABASE_ANON_KEY: ${supabaseAnonKey.substring(0, 20)}... (${supabaseAnonKey.length} chars)`);
}

if (hasErrors) {
  console.error('\n❌ Configuration errors found!');
  console.error('\n📝 To fix:');
  console.error('   1. Open .env.local (or .env)');
  console.error('   2. Set VITE_SUPABASE_URL to your Supabase project URL');
  console.error('   3. Set VITE_SUPABASE_ANON_KEY to your Supabase anon key');
  console.error('   4. Get your keys from: https://app.supabase.com/project/_/settings/api');
  console.error('   5. Restart your dev server after saving');
  process.exit(1);
}

// Test connection
console.log('\n🔌 Testing Supabase connection...\n');

try {
  const supabase = createClient(supabaseUrl, supabaseAnonKey);
  
  // Test with a simple query
  const { data, error, status } = await supabase
    .from('businesses')
    .select('id')
    .limit(1);
  
  if (error) {
    console.error('❌ Connection test failed!');
    console.error(`   Status: ${status}`);
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    console.error(`   Details: ${error.details || 'N/A'}`);
    console.error(`   Hint: ${error.hint || 'N/A'}`);
    
    if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301') {
      console.error('\n💡 This might be a network/CORS issue:');
      console.error('   1. Check if your Supabase project is active');
      console.error('   2. Verify the URL is correct');
      console.error('   3. Check CORS settings in Supabase dashboard');
      console.error('   4. Try: curl ' + supabaseUrl + '/rest/v1/');
    }
    
    process.exit(1);
  } else {
    console.log('✅ Connection test successful!');
    console.log(`   Status: ${status}`);
    console.log(`   Test query returned: ${data?.length || 0} row(s)`);
    console.log('\n🎉 Supabase is configured correctly!');
  }
} catch (err) {
  console.error('❌ Connection test error:', err.message);
  console.error('\n💡 Possible issues:');
  console.error('   1. Network connectivity problem');
  console.error('   2. Supabase project might be paused');
  console.error('   3. Firewall blocking the connection');
  process.exit(1);
}

