import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envPath = path.resolve(__dirname, '../.env.local');
let supabaseUrl, supabaseAnonKey;

if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  
  supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
  supabaseAnonKey = keyMatch ? keyMatch[1].trim() : null;
}

console.log('🔍 Testing Supabase Connection...\n');

if (!supabaseUrl || supabaseUrl === 'your-supabase-url-here') {
  console.log('❌ VITE_SUPABASE_URL not configured');
  console.log('   Please set VITE_SUPABASE_URL in .env.local');
  process.exit(1);
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-supabase-anon-key-here') {
  console.log('❌ VITE_SUPABASE_ANON_KEY not configured');
  console.log('   Please set VITE_SUPABASE_ANON_KEY in .env.local');
  process.exit(1);
}

console.log('✅ Environment variables found');
console.log(`   URL: ${supabaseUrl}`);
console.log(`   Key: ${supabaseAnonKey.substring(0, 20)}...`);

// Test connection
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testConnection() {
  try {
    console.log('\n🔗 Testing Supabase connection...');
    
    // Test basic connection
    const { data, error } = await supabase
      .from('businesses')
      .select('count')
      .limit(1);
    
    if (error) {
      console.log('❌ Supabase connection failed:');
      console.log(`   Error: ${error.message}`);
      console.log(`   Code: ${error.code}`);
      console.log(`   Details: ${error.details}`);
      
      if (error.message.includes('JWT')) {
        console.log('\n💡 This looks like an authentication issue.');
        console.log('   Make sure your VITE_SUPABASE_ANON_KEY is correct.');
      } else if (error.message.includes('relation') || error.message.includes('table')) {
        console.log('\n💡 This looks like a database schema issue.');
        console.log('   Make sure the "businesses" table exists in your Supabase project.');
      }
      
      return false;
    }
    
    console.log('✅ Supabase connection successful!');
    console.log('✅ Database is accessible');
    
    // Test authentication
    console.log('\n🔐 Testing authentication...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.log('⚠️  Authentication test failed (this is normal if not logged in)');
      console.log(`   Error: ${authError.message}`);
    } else if (user) {
      console.log('✅ User is authenticated');
      console.log(`   User ID: ${user.id}`);
    } else {
      console.log('ℹ️  No user currently logged in');
    }
    
    return true;
    
  } catch (error) {
    console.log('❌ Connection test failed:');
    console.log(`   Error: ${error.message}`);
    return false;
  }
}

testConnection().then(success => {
  if (success) {
    console.log('\n🎉 Supabase is properly configured!');
    console.log('   If you\'re still getting "Failed to create business" errors:');
    console.log('   1. Make sure you are logged in to the application');
    console.log('   2. Check the browser console for detailed error messages');
    console.log('   3. Verify the businesses table has the correct schema');
  } else {
    console.log('\n❌ Supabase connection failed.');
    console.log('   Please check your configuration and try again.');
  }
});
