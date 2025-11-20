/**
 * Environment Verification Script
 * 
 * Verifies all required environment variables exist before startup.
 * Halts with readable error if any are missing.
 * 
 * Run with: tsx scripts/verify-env.ts
 */

import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

const REQUIRED_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_SITE_URL'
];

// Load .env file
const envPath = resolve(process.cwd(), '.env');
if (!existsSync(envPath)) {
  console.error('❌ FATAL: .env file not found at project root');
  console.error('   Please create .env file with required variables.');
  process.exit(1);
}

const envContent = readFileSync(envPath, 'utf8');
const envVars: Record<string, string> = {};

envContent.split(/\r?\n/).forEach((line) => {
  line = line.trim();
  if (!line || line.startsWith('#')) return;
  const match = line.match(/^([^=]+)=(.*)$/);
  if (match) {
    const key = match[1].trim();
    let value = match[2].trim();
    if ((value.startsWith('"') && value.endsWith('"')) || 
        (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1);
    }
    envVars[key] = value;
    if (!process.env[key]) {
      process.env[key] = value;
    }
  }
});

// Verify required variables
const missing: string[] = [];
const invalid: string[] = [];

for (const key of REQUIRED_VARS) {
  const value = envVars[key] || process.env[key];
  
  if (!value || value.trim() === '') {
    missing.push(key);
  } else {
    // Special validation for VITE_SITE_URL
    if (key === 'VITE_SITE_URL' && value !== 'http://localhost:5173') {
      invalid.push(`${key} must be exactly "http://localhost:5173" (found: "${value}")`);
    }
    
    // Validate Supabase URL format
    if (key === 'VITE_SUPABASE_URL' && !value.startsWith('https://')) {
      invalid.push(`${key} must start with "https://"`);
    }
    
    // Validate anon key format (JWT)
    if (key === 'VITE_SUPABASE_ANON_KEY' && !value.startsWith('eyJ')) {
      invalid.push(`${key} must be a valid JWT token (should start with "eyJ")`);
    }
  }
}

if (missing.length > 0) {
  console.error('❌ FATAL: Missing required environment variables:');
  missing.forEach(v => console.error(`   - ${v}`));
  console.error('\n   Please add these to your .env file.');
  process.exit(1);
}

if (invalid.length > 0) {
  console.error('❌ FATAL: Invalid environment variable values:');
  invalid.forEach(v => console.error(`   - ${v}`));
  process.exit(1);
}

console.log('✅ All required environment variables verified');
console.log(`   VITE_SITE_URL: ${envVars.VITE_SITE_URL}`);
console.log(`   VITE_SUPABASE_URL: ${envVars.VITE_SUPABASE_URL.substring(0, 30)}...`);
console.log(`   VITE_SUPABASE_ANON_KEY: ${envVars.VITE_SUPABASE_ANON_KEY.substring(0, 20)}...`);
console.log(`   VITE_GOOGLE_MAPS_API_KEY: ${envVars.VITE_GOOGLE_MAPS_API_KEY.substring(0, 20)}...\n`);

