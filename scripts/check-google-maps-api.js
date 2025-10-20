#!/usr/bin/env node

/**
 * Google Maps API Health Check Script
 * Validates that the Google Maps API key is accessible and working
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

const GOOGLE_MAPS_API_KEY = process.env.VITE_GOOGLE_MAPS_API_KEY;

console.log('🔍 Google Maps API Health Check');
console.log('================================');

// Check if API key exists
if (!GOOGLE_MAPS_API_KEY) {
  console.error('❌ VITE_GOOGLE_MAPS_API_KEY not found in environment variables');
  console.log('💡 Make sure your .env file contains: VITE_GOOGLE_MAPS_API_KEY=your_key_here');
  process.exit(1);
}

console.log('✅ API Key found:', GOOGLE_MAPS_API_KEY.substring(0, 10) + '...');

// Test API key with a simple geocoding request
async function validateApiKey() {
  try {
    console.log('🌍 Testing API key with Seychelles geocoding request...');
    
    const testUrl = `https://maps.googleapis.com/maps/api/geocode/json?address=Seychelles&key=${GOOGLE_MAPS_API_KEY}`;
    
    const response = await fetch(testUrl);
    const data = await response.json();
    
    if (data.status === 'OK') {
      console.log('✅ Google Maps API key is valid and working');
      console.log(`📍 Found ${data.results.length} results for "Seychelles"`);
      
      if (data.results.length > 0) {
        const result = data.results[0];
        console.log(`📍 Location: ${result.formatted_address}`);
        console.log(`📍 Coordinates: ${result.geometry.location.lat}, ${result.geometry.location.lng}`);
      }
      
      return true;
    } else if (data.status === 'REQUEST_DENIED') {
      console.error('❌ API key validation failed: REQUEST_DENIED');
      console.log('💡 Possible causes:');
      console.log('   - API key restrictions (HTTP referrer, IP address)');
      console.log('   - Incorrect API key');
      console.log('   - Required APIs not enabled (Maps Embed API, Geocoding API)');
      console.log('   - Billing not set up');
      
      if (data.error_message) {
        console.log(`   - Error: ${data.error_message}`);
      }
      
      return false;
    } else {
      console.error(`❌ API key validation failed: ${data.status}`);
      if (data.error_message) {
        console.log(`   - Error: ${data.error_message}`);
      }
      return false;
    }
  } catch (error) {
    console.error('❌ Network error during API validation:', error.message);
    return false;
  }
}

// Test embed URL generation
function testEmbedUrl() {
  console.log('🗺️  Testing embed URL generation...');
  
  const testAddress = "Victoria, Seychelles";
  const embedUrl = `https://www.google.com/maps/embed/v1/place?key=${GOOGLE_MAPS_API_KEY}&q=${encodeURIComponent(testAddress)}&zoom=15&maptype=roadmap&language=en&region=SC`;
  
  console.log('✅ Embed URL generated successfully');
  console.log(`🔗 Test URL: ${embedUrl.substring(0, 100)}...`);
  
  return true;
}

// Main validation
async function main() {
  console.log('🚀 Starting Google Maps API validation...\n');
  
  const apiValid = await validateApiKey();
  const embedValid = testEmbedUrl();
  
  console.log('\n📊 Validation Summary');
  console.log('====================');
  console.log(`API Key Present: ${GOOGLE_MAPS_API_KEY ? '✅' : '❌'}`);
  console.log(`API Key Valid: ${apiValid ? '✅' : '❌'}`);
  console.log(`Embed URL Generation: ${embedValid ? '✅' : '❌'}`);
  
  if (apiValid && embedValid) {
    console.log('\n🎉 All checks passed! Google Maps integration should work correctly.');
    console.log('💡 Make sure to restart your development server after any .env changes.');
  } else {
    console.log('\n⚠️  Some checks failed. Please review the issues above.');
    process.exit(1);
  }
}

main().catch(console.error);
