#!/usr/bin/env tsx

/**
 * Geocoding Test Helper
 * 
 * Manual test script for Google Maps geocoding functionality
 * Run with: tsx admin/test-geocoding.ts
 */

import { geocodeAddress, reverseGeocode } from '../src/lib/geocoding';

async function testGeocoding() {
  console.log('🧪 Testing Google Maps Geocoding API...\n');

  // Test addresses in Seychelles
  const testAddresses = [
    { address: 'Victoria, Mahé, Seychelles', island: 'Mahé' },
    { address: 'Baie Sainte Anne, Praslin, Seychelles', island: 'Praslin' },
    { address: 'La Passe, La Digue, Seychelles', island: 'La Digue' },
    { address: 'PO Box 48, Providence Mahe, Seychelles', island: 'Mahé' }
  ];

  console.log('📍 Testing Address Geocoding:');
  console.log('================================\n');

  for (const test of testAddresses) {
    try {
      console.log(`Testing: ${test.address}`);
      
      const result = await geocodeAddress(test.address, test.island);
      
      if ('error' in result) {
        console.log(`❌ Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      } else {
        console.log(`✅ Success: ${result.latitude}, ${result.longitude}`);
        console.log(`   Formatted: ${result.formatted_address}`);
      }
      
      console.log(''); // Empty line for readability
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error}`);
      console.log('');
    }
  }

  console.log('🔄 Testing Reverse Geocoding:');
  console.log('==============================\n');

  // Test coordinates for Victoria, Seychelles
  const testCoordinates = [
    { lat: -4.6201, lng: 55.4522, name: 'Victoria, Mahé' },
    { lat: -4.3197, lng: 55.7370, name: 'Praslin Island' },
    { lat: -4.3598, lng: 55.8275, name: 'La Digue Island' }
  ];

  for (const coord of testCoordinates) {
    try {
      console.log(`Testing: ${coord.name} (${coord.lat}, ${coord.lng})`);
      
      const result = await reverseGeocode(coord.lat, coord.lng);
      
      if ('error' in result) {
        console.log(`❌ Error: ${result.error}`);
        if (result.details) {
          console.log(`   Details: ${result.details}`);
        }
      } else {
        console.log(`✅ Success: ${result.formatted_address}`);
      }
      
      console.log(''); // Empty line for readability
      
      // Add delay to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 1000));
      
    } catch (error) {
      console.log(`❌ Unexpected error: ${error}`);
      console.log('');
    }
  }

  console.log('✨ Geocoding test completed!');
  console.log('\n📋 Next steps:');
  console.log('1. If tests failed, check your API key configuration');
  console.log('2. Ensure you have enabled Geocoding API in Google Cloud Console');
  console.log('3. Check your API key restrictions and quotas');
  console.log('4. Test the functionality in the Directory page');
}

// Run the test
testGeocoding().catch(console.error);
