#!/usr/bin/env tsx

/**
 * Create .env file with Google Maps API key
 * 
 * This script creates the .env file with the provided Google Maps API key
 * Run with: tsx admin/create-env.ts
 */

import { writeFileSync, existsSync } from 'fs';

const ENV_FILE = '.env';
const API_KEY = 'AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY';

const envContent = `# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=${API_KEY}

# Supabase Configuration (update these with your actual values)
# VITE_SUPABASE_URL=your-supabase-url
# VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (for server-side operations)
# SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Instructions:
# 1. This file contains your Google Maps API key
# 2. Update the Supabase configuration with your actual values
# 3. Never commit this file to version control
# 4. Restart your development server after making changes
`;

function createEnvFile() {
  console.log('🔧 Creating .env file with Google Maps API key...\n');

  if (existsSync(ENV_FILE)) {
    console.log('⚠️  .env file already exists');
    console.log('   The file will be updated with the Google Maps API key');
  }

  try {
    writeFileSync(ENV_FILE, envContent);
    console.log('✅ .env file created successfully!');
    console.log(`   Google Maps API Key: ${API_KEY.substring(0, 20)}...`);
    
    console.log('\n📋 Next steps:');
    console.log('1. Update the Supabase configuration in .env if needed');
    console.log('2. Restart your development server: npm run dev');
    console.log('3. Test the Google Maps integration in the Directory page');
    console.log('4. For Supabase Edge Functions, set:');
    console.log(`   supabase secrets set GOOGLE_MAPS_API_KEY=${API_KEY}`);
    
    console.log('\n✨ Setup complete! Your Google Maps API is ready to use.');
    
  } catch (error) {
    console.error('❌ Error creating .env file:', error);
    process.exit(1);
  }
}

// Run the script
createEnvFile();
