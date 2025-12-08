/**
 * Get the REAL products table schema from Supabase
 * Uses a sample query to infer structure, then validates against migrations
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
  console.error('❌ Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function getRealSchema() {
  console.log('🔍 Fetching REAL products table schema from Supabase...\n');
  
  try {
    // Try to get one row to see actual structure
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .limit(1);
    
    if (error) {
      console.error('❌ Error:', error.message);
      console.log('\n📋 Falling back to migration analysis...\n');
      
      // Analyze migrations
      const migrationsPath = path.resolve(__dirname, '../supabase/migrations');
      const schemaLockPath = path.resolve(__dirname, '../supabase/SCHEMA_LOCK.md');
      
      if (fs.existsSync(schemaLockPath)) {
        const content = fs.readFileSync(schemaLockPath, 'utf8');
        const productsMatch = content.match(/### `products`[^#]*/s);
        if (productsMatch) {
          console.log('📄 Products schema from SCHEMA_LOCK.md:');
          console.log(productsMatch[0]);
        }
      }
      
      process.exit(1);
    }
    
    if (data && data.length > 0) {
      const sample = data[0];
      console.log('✅ REAL products table columns (from live data):\n');
      
      const columns = [];
      Object.keys(sample).forEach(key => {
        const value = sample[key];
        let type = 'unknown';
        let nullable = value === null;
        
        if (value === null) {
          type = 'nullable';
        } else if (typeof value === 'string') {
          type = 'text';
        } else if (typeof value === 'number') {
          type = Number.isInteger(value) ? 'integer' : 'numeric';
        } else if (typeof value === 'boolean') {
          type = 'boolean';
        } else if (Array.isArray(value)) {
          type = 'array';
        } else if (value instanceof Date || (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}/.test(value))) {
          type = 'timestamptz';
        }
        
        columns.push({
          name: key,
          type: type,
          nullable: nullable,
          sampleValue: value
        });
      });
      
      console.log('Column Name | Type | Nullable | Sample Value');
      console.log('------------|------|----------|-------------');
      columns.forEach(col => {
        const sample = col.sampleValue !== null && col.sampleValue !== undefined 
          ? (typeof col.sampleValue === 'string' && col.sampleValue.length > 30 
              ? col.sampleValue.substring(0, 30) + '...' 
              : String(col.sampleValue))
          : 'NULL';
        console.log(`${col.name.padEnd(12)} | ${col.type.padEnd(8)} | ${col.nullable ? 'YES' : 'NO'.padEnd(8)} | ${sample}`);
      });
      
      console.log('\n📊 Full sample row:');
      console.log(JSON.stringify(sample, null, 2));
      
      // Save to file
      const outputPath = path.resolve(__dirname, '../REAL_PRODUCTS_SCHEMA.json');
      fs.writeFileSync(outputPath, JSON.stringify({
        columns: columns.map(c => ({
          column_name: c.name,
          data_type: c.type,
          is_nullable: c.nullable ? 'YES' : 'NO'
        })),
        sample_row: sample
      }, null, 2));
      
      console.log(`\n💾 Schema saved to: ${outputPath}`);
      
    } else {
      console.log('⚠️  No data in products table. Using SCHEMA_LOCK.md as reference...\n');
      const schemaLockPath = path.resolve(__dirname, '../supabase/SCHEMA_LOCK.md');
      if (fs.existsSync(schemaLockPath)) {
        const content = fs.readFileSync(schemaLockPath, 'utf8');
        const productsMatch = content.match(/### `products`[^#]*/s);
        if (productsMatch) {
          console.log(productsMatch[0]);
        }
      }
    }
    
  } catch (err) {
    console.error('❌ Unexpected error:', err);
    process.exit(1);
  }
}

getRealSchema();
