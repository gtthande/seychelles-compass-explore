/**
 * Seed Products Script
 * 
 * Seeds products from seed/dive-seychelles-products.json into Supabase
 * Links all products to Dive Seychelles business
 * 
 * Run with: npm run seed:products
 */

import { createClient } from '@supabase/supabase-js';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

// Load .env file
const envPath = resolve(process.cwd(), '.env');
if (!existsSync(envPath)) {
    console.error('❌ .env file not found');
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

const supabaseUrl = process.env.VITE_SUPABASE_URL || envVars.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl) {
    console.error('❌ Missing VITE_SUPABASE_URL in .env');
    process.exit(1);
}

if (!serviceRoleKey) {
    console.error('❌ Missing SUPABASE_SERVICE_ROLE_KEY in .env');
    console.error('   Admin seeding requires service role key.');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false }
});

interface ProductSeed {
    name: string;
    title: string;
    description: string;
    price: number;
    category: string;
    duration: string;
    status: string;
    searchable: boolean;
}

async function seedProducts() {
    console.log('🌊 Seeding Dive Seychelles products...\n');

    try {
        // Find Dive Seychelles business
        console.log('🔍 Finding Dive Seychelles business...');
        const { data: businesses, error: businessError } = await supabase
            .from('businesses')
            .select('id, name')
            .or('name.ilike.%Dive Seychelles%,name.ilike.%dive seychelles%')
            .limit(5);

        if (businessError) {
            console.error('❌ Error finding business:', businessError);
            process.exit(1);
        }

        if (!businesses || businesses.length === 0) {
            console.error('❌ Dive Seychelles business not found');
            console.error('   Please create the business first or update the search criteria');
            process.exit(1);
        }

        const diveSeychelles = businesses[0];
        console.log(`✅ Found business: ${diveSeychelles.name} (${diveSeychelles.id})\n`);

        // Load products from JSON
        const seedPath = resolve(process.cwd(), 'seed', 'dive-seychelles-products.json');
        if (!existsSync(seedPath)) {
            console.error(`❌ Seed file not found: ${seedPath}`);
            process.exit(1);
        }

        const seedContent = readFileSync(seedPath, 'utf8');
        const products: ProductSeed[] = JSON.parse(seedContent);

        console.log(`📦 Loading ${products.length} products...\n`);

        let successCount = 0;
        let errorCount = 0;

        for (const product of products) {
            try {
                // Check if product already exists
                const { data: existing } = await supabase
                    .from('products')
                    .select('id')
                    .eq('business_id', diveSeychelles.id)
                    .eq('name', product.name)
                    .single();

                if (existing) {
                    console.log(`⏭️  Skipping "${product.name}" (already exists)`);
                    continue;
                }

                // Insert product
                const { data, error } = await supabase
                    .from('products')
                    .insert({
                        business_id: diveSeychelles.id,
                        name: product.name,
                        title: product.title || product.name,
                        description: product.description,
                        price: product.price,
                        category: product.category,
                        duration: product.duration,
                        status: product.status || 'active',
                        searchable: product.searchable ?? true
                    })
                    .select()
                    .single();

                if (error) {
                    console.error(`❌ Error inserting "${product.name}":`, error.message);
                    errorCount++;
                } else {
                    console.log(`✅ Created: ${product.name} (${data.id})`);
                    successCount++;
                }
            } catch (err: any) {
                console.error(`❌ Error processing "${product.name}":`, err.message);
                errorCount++;
            }
        }

        console.log('\n' + '='.repeat(50));
        console.log(`✅ Successfully created: ${successCount} products`);
        if (errorCount > 0) {
            console.log(`❌ Errors: ${errorCount} products`);
        }
        console.log('='.repeat(50) + '\n');

        console.log('🎉 Product seeding complete!\n');
    } catch (error: any) {
        console.error('❌ Unexpected error:', error.message);
        process.exit(1);
    }
}

seedProducts();

