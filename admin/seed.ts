#!/usr/bin/env tsx

/**
 * iCompass Seychelles - Demo Data Seeding Script
 * 
 * This script safely populates the Supabase database with demo data for testing.
 * It's idempotent - safe to run multiple times without creating duplicates.
 * 
 * Usage: npm run seed
 */

import { createClient } from '@supabase/supabase-js';
import type { Database } from '../src/integrations/supabase/types';

// Environment variables
const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || '';

if (!SUPABASE_ANON_KEY) {
  console.error('❌ VITE_SUPABASE_ANON_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_ANON_KEY);

type Business = Database['public']['Tables']['businesses']['Insert'];
type Product = Database['public']['Tables']['products']['Insert'];
type Category = Database['public']['Tables']['categories']['Insert'];

// Demo data
const demoBusinesses: Business[] = [
  {
    name: "Paradise Dive Center",
    description: "Professional diving services in the beautiful waters of Seychelles. We offer PADI courses, equipment rental, and guided dives to the best spots around the islands.",
    category: "tourism",
    status: "active",
    phone: "+248 2 123 456",
    whatsapp: "+248 2 123 456",
    email: "info@paradisedive.sc",
    website: "https://paradisedive.sc",
    facebook_url: "https://facebook.com/paradisedive",
    instagram_url: "https://instagram.com/paradisedive",
    address: "Beau Vallon Beach, Mahé",
    island: "Mahé",
    latitude: -4.6167,
    longitude: 55.4500,
    services: ["Scuba Diving", "PADI Courses", "Equipment Rental", "Boat Trips"],
    opening_hours: {
      monday: "8:00 AM - 6:00 PM",
      tuesday: "8:00 AM - 6:00 PM",
      wednesday: "8:00 AM - 6:00 PM",
      thursday: "8:00 AM - 6:00 PM",
      friday: "8:00 AM - 6:00 PM",
      saturday: "8:00 AM - 4:00 PM",
      sunday: "Closed"
    },
    featured: true,
    verified: true,
    average_rating: 4.8,
    total_reviews: 24
  },
  {
    name: "Seychelles Spice Café",
    description: "Authentic Seychellois cuisine with a modern twist. We serve traditional dishes made with fresh local ingredients and spices.",
    category: "restaurants",
    status: "active",
    phone: "+248 2 234 567",
    whatsapp: "+248 2 234 567",
    email: "hello@spicecafe.sc",
    website: "https://spicecafe.sc",
    facebook_url: "https://facebook.com/spicecafe",
    instagram_url: "https://instagram.com/spicecafe",
    address: "Victoria Market, Mahé",
    island: "Mahé",
    latitude: -4.6200,
    longitude: 55.4500,
    services: ["Traditional Cuisine", "Catering", "Cooking Classes", "Spice Sales"],
    opening_hours: {
      monday: "7:00 AM - 10:00 PM",
      tuesday: "7:00 AM - 10:00 PM",
      wednesday: "7:00 AM - 10:00 PM",
      thursday: "7:00 AM - 10:00 PM",
      friday: "7:00 AM - 11:00 PM",
      saturday: "7:00 AM - 11:00 PM",
      sunday: "8:00 AM - 9:00 PM"
    },
    featured: true,
    verified: true,
    average_rating: 4.6,
    total_reviews: 18
  }
];

const demoProducts: Product[] = [
  {
    business_id: "", // Will be set after business creation
    name: "PADI Open Water Course",
    description: "Learn to dive with our certified PADI instructors. Complete course includes theory, confined water, and open water dives.",
    category: "Diving Courses",
    price: 450.00,
    currency: "USD",
    in_stock: true,
    stock_quantity: 10,
    featured: true,
    status: "active",
    tags: ["PADI", "Diving", "Course", "Certification"]
  },
  {
    business_id: "", // Will be set after business creation
    name: "Equipment Rental Package",
    description: "Complete diving equipment rental for certified divers. Includes BCD, regulator, wetsuit, mask, fins, and weights.",
    category: "Equipment Rental",
    price: 35.00,
    currency: "USD",
    in_stock: true,
    stock_quantity: 20,
    featured: false,
    status: "active",
    tags: ["Equipment", "Rental", "Diving"]
  },
  {
    business_id: "", // Will be set after business creation
    name: "Traditional Fish Curry",
    description: "Authentic Seychellois fish curry made with fresh local fish, coconut milk, and traditional spices. Served with rice and salad.",
    category: "Main Course",
    price: 25.00,
    currency: "SCR",
    in_stock: true,
    stock_quantity: 50,
    featured: true,
    status: "active",
    tags: ["Traditional", "Fish", "Curry", "Local"]
  },
  {
    business_id: "", // Will be set after business creation
    name: "Cooking Class - Seychellois Cuisine",
    description: "Learn to cook traditional Seychellois dishes with our experienced chefs. Includes ingredients and recipe cards.",
    category: "Experience",
    price: 80.00,
    currency: "USD",
    in_stock: true,
    stock_quantity: 8,
    featured: true,
    status: "active",
    tags: ["Cooking", "Class", "Traditional", "Experience"]
  },
  {
    business_id: "", // Will be set after business creation
    name: "Spice Mix Collection",
    description: "Authentic Seychellois spice blends for home cooking. Includes curry powder, masala, and traditional seasonings.",
    category: "Products",
    price: 15.00,
    currency: "USD",
    in_stock: true,
    stock_quantity: 30,
    featured: false,
    status: "active",
    tags: ["Spices", "Traditional", "Cooking", "Local"]
  },
  {
    business_id: "", // Will be set after business creation
    name: "Private Dining Experience",
    description: "Exclusive private dining with traditional Seychellois dishes prepared by our head chef. Perfect for special occasions.",
    category: "Experience",
    price: 120.00,
    currency: "USD",
    in_stock: true,
    stock_quantity: 4,
    featured: true,
    status: "active",
    tags: ["Private", "Dining", "Traditional", "Exclusive"]
  }
];

const demoCategories: Category[] = [
  {
    name: "Diving Courses",
    slug: "diving-courses",
    description: "Professional diving courses and certifications",
    is_active: true
  },
  {
    name: "Equipment Rental",
    slug: "equipment-rental",
    description: "Diving and water sports equipment rental",
    is_active: true
  },
  {
    name: "Traditional Cuisine",
    slug: "traditional-cuisine",
    description: "Authentic Seychellois dishes and cooking",
    is_active: true
  },
  {
    name: "Cooking Classes",
    slug: "cooking-classes",
    description: "Learn to cook traditional Seychellois dishes",
    is_active: true
  },
  {
    name: "Spice Products",
    slug: "spice-products",
    description: "Authentic Seychellois spices and seasonings",
    is_active: true
  }
];

async function checkExistingData(): Promise<boolean> {
  console.log('🔍 Checking for existing demo data...');
  
  const { data: businesses, error } = await supabase
    .from('businesses')
    .select('id, name')
    .in('name', demoBusinesses.map(b => b.name))
    .limit(1);
  
  if (error) {
    console.error('❌ Error checking existing data:', error.message);
    return false;
  }
  
  return businesses && businesses.length > 0;
}

async function seedCategories(): Promise<void> {
  console.log('📂 Seeding categories...');
  
  for (const category of demoCategories) {
    const { error } = await supabase
      .from('categories')
      .upsert(category, { onConflict: 'slug' });

    if (error) {
      console.warn(`⚠️  Warning: Could not upsert category ${category.name}:`, error.message);
    } else {
      console.log(`✅ Category: ${category.name}`);
    }
  }
}

async function seedBusinesses(): Promise<string[]> {
  console.log('🏢 Seeding businesses...');
  
  const businessIds: string[] = [];
  
  for (const business of demoBusinesses) {
    // Check if business already exists
    const { data: existing } = await supabase
      .from('businesses')
      .select('id')
      .eq('name', business.name)
      .single();

    if (existing) {
      console.log(`⏭️  Business already exists: ${business.name}`);
      businessIds.push(existing.id);
      continue;
    }

    const { data: newBusiness, error } = await supabase
      .from('businesses')
      .insert(business)
      .select('id')
      .single();

    if (error) {
      console.error(`❌ Error creating business ${business.name}:`, error.message);
      throw new Error(`Failed to create business: ${business.name}`);
    }

    if (newBusiness) {
      console.log(`✅ Business created: ${business.name}`);
      businessIds.push(newBusiness.id);
    }
  }
  
  return businessIds;
}

async function seedProducts(businessIds: string[]): Promise<void> {
  console.log('📦 Seeding products...');
  
  // Distribute products across businesses (3 products per business)
  const productsWithBusinessIds = demoProducts.map((product, index) => {
    const businessIndex = Math.floor(index / 3); // 3 products per business
    return {
      ...product,
      business_id: businessIds[businessIndex]
    };
  });

  for (const product of productsWithBusinessIds) {
    // Check if product already exists
    const { data: existing } = await supabase
      .from('products')
      .select('id')
      .eq('name', product.name)
      .eq('business_id', product.business_id)
      .single();

    if (existing) {
      console.log(`⏭️  Product already exists: ${product.name}`);
      continue;
    }

    const { error } = await supabase
      .from('products')
      .insert(product);

    if (error) {
      console.error(`❌ Error creating product ${product.name}:`, error.message);
      throw new Error(`Failed to create product: ${product.name}`);
    }

    console.log(`✅ Product created: ${product.name}`);
  }
}

async function main(): Promise<void> {
  console.log('🌱 Starting iCompass Seychelles Demo Data Seeding...\n');
  
  try {
    // Check if data already exists
    const hasExistingData = await checkExistingData();
    
    if (hasExistingData) {
      console.log('ℹ️  Demo data already exists. Skipping to avoid duplicates.');
      console.log('💡 To reseed, delete existing demo businesses first.\n');
      return;
    }

    // Seed categories first
    await seedCategories();
    console.log('');

    // Seed businesses
    const businessIds = await seedBusinesses();
    console.log('');

    // Seed products
    await seedProducts(businessIds);
    console.log('');

    console.log('🎉 Demo data seeding completed successfully!');
    console.log(`📊 Created:`);
    console.log(`   • ${demoBusinesses.length} businesses`);
    console.log(`   • ${demoProducts.length} products`);
    console.log(`   • ${demoCategories.length} categories`);
    console.log('\n🌐 You can now browse the directory to see the demo data!');

  } catch (error: unknown) {
    console.error('💥 Seeding failed:', error instanceof Error ? error.message : 'Unknown error');
    process.exit(1);
  }
}

// Run the seeding script
if (require.main === module) {
  main().catch((error) => {
    console.error('💥 Unhandled error:', error);
    process.exit(1);
  });
}

export { main as seedDemoData };
