/**
 * Apply RLS Migration Script
 * 
 * This script helps apply the RLS migration to Supabase.
 * It reads the migration file and provides instructions.
 */

import { readFileSync } from 'fs';
import { resolve } from 'path';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const migrationFile = resolve(projectRoot, 'supabase/migrations/20250125000001_ensure_public_read_access.sql');

console.log('📋 RLS Migration Helper');
console.log('========================\n');

try {
    const migrationSQL = readFileSync(migrationFile, 'utf8');

    console.log('✅ Migration file found: 20250125000001_ensure_public_read_access.sql\n');
    console.log('📝 To apply this migration, choose one of the following methods:\n');

    console.log('METHOD 1: Supabase Dashboard (Recommended)');
    console.log('-------------------------------------------');
    console.log('1. Go to: https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl');
    console.log('2. Navigate to: SQL Editor');
    console.log('3. Copy the SQL from: supabase/migrations/20250125000001_ensure_public_read_access.sql');
    console.log('4. Paste into SQL Editor');
    console.log('5. Click "Run"\n');

    console.log('METHOD 2: Supabase CLI');
    console.log('----------------------');
    console.log('1. Ensure you are logged in: supabase login');
    console.log('2. Link your project: supabase link --project-ref bwlmlniotyrjttglbjrl');
    console.log('3. Apply migration: supabase db push\n');

    console.log('METHOD 3: Direct SQL Execution');
    console.log('-------------------------------');
    console.log('The migration SQL is ready in:');
    console.log(migrationFile);
    console.log('\nYou can copy it and run it directly in Supabase SQL Editor.\n');

    console.log('📊 Migration Summary:');
    console.log('- Enables public read access for active businesses');
    console.log('- Enables public read access for active products');
    console.log('- Enables public read access for active categories');
    console.log('- Restricts write access to admins only');
    console.log('- Idempotent (safe to run multiple times)\n');

} catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    console.error('   Please ensure the migration file exists at:');
    console.error('   supabase/migrations/20250125000001_ensure_public_read_access.sql');
    process.exit(1);
}







