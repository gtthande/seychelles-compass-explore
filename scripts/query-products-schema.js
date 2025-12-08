/**
 * Query the real products table schema from Supabase
 */

import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
const envLocalPath = path.resolve(__dirname, '../.env.local');
const envPath = path.resolve(__dirname, '../.env');
let supabaseUrl, supabaseAnonKey;

let envContent = '';
if (fs.existsSync(envLocalPath)) {
  envContent = fs.readFileSync(envLocalPath, 'utf8');
} else if (fs.existsSync(envPath)) {
  envContent = fs.readFileSync(envPath, 'utf8');
}

if (envContent) {
  const urlMatch = envContent.match(/VITE_SUPABASE_URL=(.+)/);
  const keyMatch = envContent.match(/VITE_SUPABASE_ANON_KEY=(.+)/);
  
  supabaseUrl = urlMatch ? urlMatch[1].trim() : null;
  supabaseAnonKey = keyMatch ? keyMatch[1].trim() : null;
}

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ Missing Supabase credentials in .env or .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function queryProductsSchema() {
  console.log('🔍 Querying products table schema from Supabase...\n');
  
  try {
    // Query information_schema using RPC or direct query
    // Since we can't directly query information_schema with anon key, 
    // let's try to query the products table with a limit 0 to get the structure
    // Or we can use a migration file to check
    
    // Alternative: Query with SELECT * LIMIT 0 to infer structure
    // But better: Check if there's a way to query information_schema
    
    // Let's try a direct SQL query via RPC if available, otherwise fetch one row
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error querying products:', error);
      
      // Try to get schema from migrations
      console.log('\n📋 Checking migration files for schema definition...');
      const migrationsPath = path.resolve(__dirname, '../supabase/migrations');
      if (fs.existsSync(migrationsPath)) {
        const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
        console.log(`Found ${files.length} migration files`);
        // Look for CREATE TABLE products
        for (const file of files) {
          const content = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
          if (content.includes('CREATE TABLE') && content.includes('products')) {
            console.log(`\n📄 Found products table definition in: ${file}`);
            // Extract CREATE TABLE statement
            const match = content.match(/CREATE TABLE[^;]*products[^;]*;/is);
            if (match) {
              console.log('\n' + match[0]);
            }
          }
        }
      }
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      console.log('✅ Products table structure (from sample row):\n');
      console.log(JSON.stringify(data[0], null, 2));
      console.log('\n📊 Column types inferred from data:');
      const sample = data[0];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        const type = value === null ? 'null' : typeof value;
        const isArray = Array.isArray(value);
        console.log(`  - ${key}: ${isArray ? 'array' : type}${value === null ? ' (nullable)' : ''}`);
      });
    } else {
      console.log('⚠️  No data in products table. Checking migrations...');
      // Check migrations
      const migrationsPath = path.resolve(__dirname, '../supabase/migrations');
      if (fs.existsSync(migrationsPath)) {
        const files = fs.readdirSync(migrationsPath).filter(f => f.endsWith('.sql')).sort();
        for (const file of files) {
          const content = fs.readFileSync(path.join(migrationsPath, file), 'utf8');
          if (content.includes('CREATE TABLE') && content.includes('products')) {
            console.log(`\n📄 Found in: ${file}`);
            const match = content.match(/CREATE TABLE[^;]*products[^;]*;/is);
            if (match) {
              console.log('\n' + match[0]);
            }
          }
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

queryProductsSchema();
