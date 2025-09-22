#!/usr/bin/env tsx

/**
 * Environment Setup Script for Seychelles Compass Explore
 * 
 * This script helps set up the required environment variables for the project.
 * Run with: tsx admin/setup-env.ts
 */

import { writeFileSync, existsSync, readFileSync } from 'fs';
import { join } from 'path';

const ENV_FILE = '.env';
const ENV_EXAMPLE_FILE = '.env.example';

const requiredEnvVars = {
  'VITE_GOOGLE_MAPS_API_KEY': 'AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY',
  'VITE_SUPABASE_URL': 'your-supabase-url',
  'VITE_SUPABASE_ANON_KEY': 'your-supabase-anon-key',
  'SUPABASE_SERVICE_ROLE_KEY': 'your-service-role-key'
};

const envExampleContent = `# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key

# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key

# Supabase Service Role Key (for server-side operations)
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# Instructions:
# 1. Copy this file to .env
# 2. Replace the placeholder values with your actual API keys
# 3. Never commit the .env file to version control
# 4. Restart your development server after making changes
`;

function setupEnvironment() {
  console.log('🚀 Setting up environment variables for Seychelles Compass Explore...\n');

  // Create .env.example file
  if (!existsSync(ENV_EXAMPLE_FILE)) {
    writeFileSync(ENV_EXAMPLE_FILE, envExampleContent);
    console.log('✅ Created .env.example file');
  } else {
    console.log('📄 .env.example already exists');
  }

  // Check if .env exists
  if (existsSync(ENV_FILE)) {
    console.log('📄 .env file already exists');
    
    // Read existing .env content
    const existingContent = readFileSync(ENV_FILE, 'utf-8');
    
    // Check if Google Maps API key is already set
    if (existingContent.includes('VITE_GOOGLE_MAPS_API_KEY=')) {
      console.log('✅ Google Maps API key is already configured in .env');
    } else {
      console.log('⚠️  Google Maps API key not found in .env');
      console.log('   Please add: VITE_GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY');
    }
  } else {
    console.log('⚠️  .env file not found');
    console.log('   Please create a .env file with your configuration');
    console.log('   You can copy .env.example and update the values');
  }

  console.log('\n📋 Next steps:');
  console.log('1. Ensure your .env file contains:');
  console.log('   VITE_GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY');
  console.log('2. Restart your development server: npm run dev');
  console.log('3. Test the Google Maps integration in the Directory page');
  
  console.log('\n🔧 For Supabase Edge Functions:');
  console.log('1. Set the environment variable in your Supabase dashboard:');
  console.log('   GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY');
  console.log('2. Or use the Supabase CLI:');
  console.log('   supabase secrets set GOOGLE_MAPS_API_KEY=AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY');
  
  console.log('\n✨ Environment setup complete!');
}

// Run the setup
setupEnvironment();
