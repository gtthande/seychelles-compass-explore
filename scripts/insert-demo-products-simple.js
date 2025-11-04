#!/usr/bin/env node

/**
 * Insert Demo Products (Simple Version)
 * Creates sample catalog items without searchable column
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

console.log('🚢 DEMO PRODUCTS INSERTION (SIMPLE)');
console.log('===================================');
console.log('Inserting demo catalog items...\n');

async function insertDemoProducts() {
  try {
    if (!supabaseUrl || !supabaseAnonKey) {
      console.log('❌ Missing Supabase credentials');
      return false;
    }

    console.log('✅ Supabase credentials found');

    // Create client
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // First, find any business
    console.log('\n🔍 Finding available business...');
    const { data: businesses, error: businessError } = await supabase
      .from('businesses')
      .select('id, name')
      .eq('status', 'active')
      .limit(1);

    if (businessError) {
      console.log('❌ Error finding business:', businessError.message);
      return false;
    }

    if (!businesses || businesses.length === 0) {
      console.log('❌ No active businesses found');
      return false;
    }

    const business = businesses[0];
    console.log(`✅ Found business: ${business.name} (${business.id})`);

    // Demo products
    const demoProducts = [
      {
        business_id: business.id,
        name: 'Basic Seamanship Course',
        description: 'Comprehensive introduction to maritime skills including navigation, safety procedures, and vessel handling.',
        price: 2500.00,
        category: 'education',
        status: 'active'
      },
      {
        business_id: business.id,
        name: 'Marine Engineering Diploma',
        description: 'Advanced diploma program covering marine propulsion systems, electrical systems, and engine maintenance.',
        price: 18000.00,
        category: 'education',
        status: 'active'
      },
      {
        business_id: business.id,
        name: 'Safety at Sea Workshop',
        description: 'Essential safety training covering emergency procedures, life-saving equipment, and maritime safety regulations.',
        price: 1200.00,
        category: 'training',
        status: 'active'
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
    console.log('✅ Demo products created');
    console.log('✅ Product catalog ready for testing');
    console.log('\n🚀 You can now test the product catalog system!');
  } else {
    console.log('\n❌ DEMO PRODUCTS INSERTION FAILED');
    console.log('⚠️  Some products may not have been created');
  }
  process.exit(success ? 0 : 1);
});








