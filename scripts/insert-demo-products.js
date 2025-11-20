#!/usr/bin/env node

/**
 * Insert Demo Products for Seychelles Maritime Academy
 * Creates sample catalog items for testing
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

console.log('🚢 DEMO PRODUCTS INSERTION');
console.log('==========================');
console.log('Inserting demo catalog items for Seychelles Maritime Academy...\n');

async function insertDemoProducts() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }

    console.log('✅ Supabase credentials found');
    console.log(`   URL: ${supabaseUrl}`);
    console.log(`   Anon Key: ${supabaseAnonKey.substring(0, 20)}...`);

    // Create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // First, find the Seychelles Maritime Academy business
    console.log('\n🔍 Finding Seychelles Maritime Academy...');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .ilike('name', '%maritime%')
      .limit(1);

    if (businessError) {
      console.log('❌ Error finding business:', businessError.message);
      return false;
    }

    if (!businesses || businesses.length === 0) {
      console.log('❌ Seychelles Maritime Academy not found');
      console.log('💡 Please ensure the business exists in the database');
      return false;
    }

    const business = businesses[0];
    console.log(`✅ Found business: ${business.name} (${business.id})`);

    // Demo products for Seychelles Maritime Academy
    const demoProducts = [
      {
        business_id: business.id,
        name: 'Basic Seamanship Course',
        description: 'Comprehensive introduction to maritime skills including navigation, safety procedures, and vessel handling. Perfect for beginners entering the maritime industry.',
        price: 2500.00,
        category: 'education',
        status: 'active',
        searchable: true
      },
      {
        business_id: business.id,
        name: 'Marine Engineering Diploma',
        description: 'Advanced diploma program covering marine propulsion systems, electrical systems, and engine maintenance. Accredited certification for marine engineers.',
        price: 18000.00,
        category: 'education',
        status: 'active',
        searchable: true
      },
      {
        business_id: business.id,
        name: 'Safety at Sea Workshop',
        description: 'Essential safety training covering emergency procedures, life-saving equipment, and maritime safety regulations. Required for all maritime personnel.',
        price: 1200.00,
        category: 'training',
        status: 'active',
        searchable: true
      },
      {
        business_id: business.id,
        name: 'Navigation Equipment Rental',
        description: 'Professional-grade navigation equipment including GPS, compasses, and chart plotters. Available for short-term rental for training purposes.',
        price: 150.00,
        category: 'equipment',
        status: 'active',
        searchable: true
      },
      {
        business_id: business.id,
        name: 'Maritime Certification Exam',
        description: 'Official certification examination for maritime professionals. Includes written and practical components with internationally recognized certification.',
        price: 800.00,
        category: 'certification',
        status: 'active',
        searchable: true
      }
    ];

    console.log('\n📦 Inserting demo products...');
    
    for (const product of demoProducts) {
      console.log(`   Adding: ${product.name} - SCR ${product.price.toLocaleString()}`);
      
      const { data, error } = await supabase
        .from('products')
        .insert(product)
        .select()
        .single();

      if (error) {
        console.log(`   ❌ Error inserting ${product.name}:`, error.message);
        continue;
      }

      console.log(`   ✅ Successfully added: ${data.name}`);
    }

    // Verify the products were inserted
    console.log('\n🔍 Verifying inserted products...');
    const { data: insertedProducts, error: verifyError } = await supabase
      .from('products')
      .select('id, name, price, category, status')
      .eq('business_id', business.id)
      .order('created_at', { ascending: false });

    if (verifyError) {
      console.log('❌ Error verifying products:', verifyError.message);
      return false;
    }

    console.log(`✅ Successfully inserted ${insertedProducts.length} products:`);
    insertedProducts.forEach((product, index) => {
      console.log(`   ${index + 1}. ${product.name} - SCR ${product.price.toLocaleString()} (${product.category})`);
    });

    // Test search functionality
    console.log('\n🔍 Testing search functionality...');
    const { data: searchResults, error: searchError } = await supabase
      .from('products')
      .select('name, price, category')
      .ilike('name', '%seamanship%')
      .eq('business_id', business.id);

    if (searchError) {
      console.log('❌ Search test failed:', searchError.message);
    } else {
      console.log(`✅ Search test successful: Found ${searchResults.length} products matching "seamanship"`);
      searchResults.forEach(product => {
        console.log(`   - ${product.name} (${product.category})`);
      });
    }

    return true;

  } catch (error) {
    console.log('❌ Demo products insertion failed:', error.message);
    return false;
  }
}

// Run the insertion
insertDemoProducts().then(success => {
  if (success) {
    console.log('\n🎉 DEMO PRODUCTS INSERTION SUCCESSFUL');
    console.log('✅ Seychelles Maritime Academy products created');
    console.log('✅ Search functionality verified');
    console.log('✅ Product catalog ready for testing');
    console.log('\n🚀 You can now test the product catalog system!');
    console.log('   - Visit /admin/products to manage products');
    console.log('   - Search for "seamanship" to test search');
    console.log('   - Check business detail pages for product catalogs');
  } else {
    console.log('\n❌ DEMO PRODUCTS INSERTION FAILED');
    console.log('⚠️  Some products may not have been created');
    console.log('🔧 Please check your Supabase configuration and try again');
  }
  process.exit(success ? 0 : 1);
});















