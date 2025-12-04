import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

const defaultCategories = [
    { name: 'Food & Beverages', slug: 'food', description: 'Restaurants, cafes, bars, and food services', is_active: true },
    { name: 'Accommodation', slug: 'accommodation', description: 'Hotels, resorts, guest houses, and lodging', is_active: true },
    { name: 'Tours & Activities', slug: 'tours', description: 'Guided tours, excursions, and recreational activities', is_active: true },
    { name: 'Transportation', slug: 'transport', description: 'Car rentals, transfers, and transport services', is_active: true },
    { name: 'Retail Products', slug: 'retail', description: 'Shopping, souvenirs, and retail goods', is_active: true },
    { name: 'Services', slug: 'services', description: 'Professional and personal services', is_active: true },
    { name: 'Entertainment', slug: 'entertainment', description: 'Shows, events, and entertainment venues', is_active: true },
    { name: 'Health & Wellness', slug: 'wellness', description: 'Spas, fitness, and wellness services', is_active: true },
    { name: 'Education', slug: 'education', description: 'Schools, training centers, and educational services', is_active: true },
];

async function ensureCategories() {
    try {
        console.log('🔍 Checking categories...\n');

        // Check existing categories
        const { data: existingCategories, error: checkError } = await supabase
            .from('categories')
            .select('slug, name, is_active');

        if (checkError) {
            console.error('❌ Error checking categories:', checkError.message);
            console.error('   This might indicate an RLS policy issue.');
            console.error('   Please ensure the RLS migration has been applied.');
            return;
        }

        console.log(`📊 Found ${existingCategories?.length || 0} existing categories`);

        // Check which categories are missing
        const existingSlugs = new Set(existingCategories?.map(c => c.slug) || []);
        const missingCategories = defaultCategories.filter(c => !existingSlugs.has(c.slug));

        if (missingCategories.length === 0) {
            console.log('✅ All default categories exist');

            // Check if any are inactive
            const inactiveCategories = existingCategories?.filter(c => c.is_active === false);
            if (inactiveCategories && inactiveCategories.length > 0) {
                console.log(`\n⚠️  Found ${inactiveCategories.length} inactive categories:`);
                inactiveCategories.forEach(c => {
                    console.log(`   - ${c.name} (${c.slug})`);
                });
                console.log('\n   These will not appear on the homepage.');
            }

            return;
        }

        console.log(`\n📝 Inserting ${missingCategories.length} missing categories...\n`);

        // Insert missing categories
        for (const category of missingCategories) {
            const { data, error } = await supabase
                .from('categories')
                .insert(category)
                .select();

            if (error) {
                if (error.code === '23505') {
                    console.log(`⚠️  Category "${category.name}" already exists (slug conflict)`);
                } else {
                    console.error(`❌ Failed to insert "${category.name}":`, error.message);
                }
            } else {
                console.log(`✅ Added category: ${category.name} (${category.slug})`);
            }
        }

        console.log('\n✅ Category check complete!');
        console.log('\n📋 Next steps:');
        console.log('   1. Refresh your browser');
        console.log('   2. Check http://localhost:5173/');
        console.log('   3. Categories should now appear in the "Explore by Category" section');

    } catch (error) {
        console.error('❌ Unexpected error:', error);
    }
}

ensureCategories().catch(console.error);

