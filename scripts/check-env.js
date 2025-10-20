#!/usr/bin/env node

/**
 * Environment Variables Validation Script
 * Checks all VITE_* variables and warns if any are undefined
 */

import fs from 'fs';
import path from 'path';

// Simple .env file parser
function loadEnvFile() {
  const envPath = path.join(process.cwd(), '.env');
  if (!fs.existsSync(envPath)) {
    return {};
  }
  
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envVars = {};
  
  envContent.split('\n').forEach(line => {
    line = line.trim();
    if (line && !line.startsWith('#')) {
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        envVars[key] = valueParts.join('=');
      }
    }
  });
  
  return envVars;
}

// Load environment variables
const envVars = loadEnvFile();
Object.assign(process.env, envVars);

console.log('🔍 Environment Variables Health Check');
console.log('=====================================');

// Get all environment variables that start with VITE_
const viteEnvVariables = Object.keys(process.env).filter(key => key.startsWith('VITE_'));

console.log(`📊 Found ${viteEnvVariables.length} VITE_* environment variables\n`);

let hasUndefined = false;
let hasEmpty = false;

// Check each VITE_ variable
viteEnvVariables.forEach(key => {
  const value = process.env[key];
  
  if (value === undefined) {
    console.warn(`⚠️  ${key} is undefined`);
    hasUndefined = true;
  } else if (value === '') {
    console.warn(`⚠️  ${key} is empty`);
    hasEmpty = true;
  } else {
    // Mask sensitive values
    const displayValue = key.includes('KEY') || key.includes('SECRET') || key.includes('TOKEN')
      ? value.substring(0, 10) + '...'
      : value;
    console.log(`✅ ${key}: ${displayValue}`);
  }
});

// Check for required VITE_ variables
const requiredViteVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY'
];

console.log('\n🔑 Required VITE_ Variables Check');
console.log('=================================');

requiredViteVars.forEach(key => {
  const value = process.env[key];
  if (!value) {
    console.error(`❌ Missing required variable: ${key}`);
    hasUndefined = true;
  } else {
    console.log(`✅ ${key}: ${key.includes('KEY') ? value.substring(0, 10) + '...' : value}`);
  }
});

// Google Maps API key no longer required - using OpenStreetMap static maps
console.log('ℹ️  Using OpenStreetMap static maps (no API key required)');

// Check .env file exists
const envPath = path.join(process.cwd(), '.env');
if (fs.existsSync(envPath)) {
  console.log('\n📁 .env file found');
  
  // Read and check .env file content
  const envContent = fs.readFileSync(envPath, 'utf8');
  const envLines = envContent.split('\n').filter(line => line.trim() && !line.startsWith('#'));
  
  console.log(`📊 ${envLines.length} environment variables defined in .env file`);
  
  // Check for common issues
  const hasPlaceholderValues = envLines.some(line => 
    line.includes('your-') || 
    line.includes('placeholder') || 
    line.includes('example')
  );
  
  if (hasPlaceholderValues) {
    console.warn('⚠️  Found placeholder values in .env file');
    console.log('💡 Make sure to replace placeholder values with actual credentials');
  }
} else {
  console.warn('⚠️  .env file not found');
  console.log('💡 Create a .env file based on .env.example');
}

// Check NODE_ENV and VITE_DEV_MODE
console.log('\n🛠️  Development Environment Check');
console.log('==================================');

const nodeEnv = process.env.NODE_ENV;
const viteDevMode = process.env.VITE_DEV_MODE;

console.log(`NODE_ENV: ${nodeEnv || 'undefined'}`);
console.log(`VITE_DEV_MODE: ${viteDevMode || 'undefined'}`);

if (nodeEnv !== 'development') {
  console.warn('⚠️  NODE_ENV is not set to "development"');
}

if (viteDevMode !== 'true') {
  console.warn('⚠️  VITE_DEV_MODE is not set to "true"');
}

// Summary
console.log('\n📊 Summary');
console.log('==========');

if (hasUndefined || hasEmpty) {
  console.log('❌ Some environment variables are missing or empty');
  console.log('💡 Please check your .env file and ensure all required variables are set');
  process.exit(1);
} else {
  console.log('✅ All environment variables are properly configured');
  console.log('🚀 Ready for development!');
}

// Additional recommendations
console.log('\n💡 Recommendations');
console.log('==================');
console.log('1. Restart your development server after changing .env variables');
console.log('2. Never commit .env files to version control');
console.log('3. Use .env.example as a template for team members');
console.log('4. Consider using environment-specific .env files (.env.local, .env.development)');
