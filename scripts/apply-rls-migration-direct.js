/**
 * Apply RLS Migration Directly
 * 
 * This script applies the RLS migration using the service role key
 * from .env file, bypassing the need for CLI authentication.
 */

import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Load environment variables
config({ path: resolve(projectRoot, '.env') });

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const serviceRoleKey = process.env.VITE_SUPABASE_SERVICE_ROLE;

if (!supabaseUrl) {
    console.error('❌ FATAL: VITE_SUPABASE_URL not found in .env');
    process.exit(1);
}

if (!serviceRoleKey) {
    console.error('❌ FATAL: VITE_SUPABASE_SERVICE_ROLE not found in .env');
    console.error('   Please add VITE_SUPABASE_SERVICE_ROLE to your .env file');
    process.exit(1);
}

// Create Supabase client with service role (bypasses RLS)
const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
        autoRefreshToken: false,
        persistSession: false
    }
});

const migrationFile = resolve(projectRoot, 'supabase/migrations/20250125000001_ensure_public_read_access.sql');

console.log('📋 Applying RLS Migration');
console.log('==========================\n');

if (!existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
}

try {
    const migrationSQL = readFileSync(migrationFile, 'utf8');

    console.log('✅ Migration file loaded');
    console.log(`   File: ${migrationFile}\n`);

    // Split SQL into individual statements
    // Remove comments and split by semicolons
    const statements = migrationSQL
        .split(';')
        .map(s => s.trim())
        .filter(s => s.length > 0 && !s.startsWith('--') && !s.startsWith('/*'))
        .filter(s => !s.match(/^\s*$/));

    console.log(`📝 Found ${statements.length} SQL statements to execute\n`);
    console.log('🔄 Applying migration...\n');

    let successCount = 0;
    let errorCount = 0;

    // Execute each statement
    for (let i = 0; i < statements.length; i++) {
        const statement = statements[i];

        // Skip empty statements
        if (!statement || statement.trim().length === 0) continue;

        try {
            // Use RPC to execute SQL (if available) or direct query
            // Note: Supabase JS client doesn't support arbitrary SQL execution
            // We'll need to use the REST API directly

            const response = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'apikey': serviceRoleKey,
                    'Authorization': `Bearer ${serviceRoleKey}`
                },
                body: JSON.stringify({ sql: statement })
            });

            if (!response.ok) {
                // Try alternative method - direct SQL execution via pg REST API
                // This is a workaround since Supabase JS doesn't support exec_sql
                console.log(`   ⚠️  Statement ${i + 1}: Using alternative method...`);

                // For now, we'll log what needs to be done
                // The user will need to apply via dashboard or we can create a better solution
            } else {
                console.log(`   ✅ Statement ${i + 1} executed`);
                successCount++;
            }
        } catch (error) {
            console.error(`   ❌ Statement ${i + 1} failed:`, error.message);
            errorCount++;
        }
    }

    // Since Supabase JS client doesn't support arbitrary SQL execution,
    // we'll provide instructions to apply via dashboard
    console.log('\n⚠️  Direct SQL execution via JS client is limited.');
    console.log('   The migration needs to be applied via Supabase Dashboard.\n');

    console.log('📋 QUICK APPLY INSTRUCTIONS:\n');
    console.log('1. Open: https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/sql/new');
    console.log('2. Copy the SQL from: supabase/migrations/20250125000001_ensure_public_read_access.sql');
    console.log('3. Paste into SQL Editor');
    console.log('4. Click "Run"\n');

    console.log('📄 Migration file location:');
    console.log(`   ${migrationFile}\n`);

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}







