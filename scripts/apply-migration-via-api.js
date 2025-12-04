/**
 * Apply Migration via Supabase Management API
 * 
 * This script attempts to apply the migration using the Supabase Management API
 * with the service role key.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Read .env file manually
function loadEnv() {
    const envPath = resolve(projectRoot, '.env');
    if (!existsSync(envPath)) return {};

    const envContent = readFileSync(envPath, 'utf8');
    const env = {};

    envContent.split(/\r?\n/).forEach(line => {
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
            env[key] = value;
        }
    });

    return env;
}

const env = loadEnv();
const supabaseUrl = env.VITE_SUPABASE_URL;
const serviceRoleKey = env.VITE_SUPABASE_SERVICE_ROLE;
const projectId = 'bwlmlniotyrjttglbjrl';

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing required environment variables');
    process.exit(1);
}

const migrationFile = resolve(projectRoot, 'supabase/migrations/20250125000001_ensure_public_read_access.sql');

console.log('🚀 Applying RLS Migration via API');
console.log('==================================\n');

if (!existsSync(migrationFile)) {
    console.error(`❌ Migration file not found: ${migrationFile}`);
    process.exit(1);
}

try {
    const migrationSQL = readFileSync(migrationFile, 'utf8');

    console.log('✅ Migration file loaded\n');
    console.log('📝 Attempting to apply via Supabase Management API...\n');

    // Use Supabase Management API to execute SQL
    // Note: This requires the Management API which may not be directly accessible
    // We'll try the PostgREST approach first

    const dbUrl = supabaseUrl.replace('https://', 'https://').replace('.supabase.co', '');

    // Try to execute via PostgREST SQL endpoint (if available)
    try {
        // Split into manageable chunks
        const statements = migrationSQL
            .split(';')
            .map(s => s.trim())
            .filter(s => s.length > 0 && !s.startsWith('--'))
            .filter(s => !s.match(/^\s*$/));

        console.log(`📊 Found ${statements.length} SQL statements\n`);

        // Since direct SQL execution via JS client is limited,
        // we'll create a simple web-based solution
        console.log('💡 SOLUTION: Creating web-based migration applier...\n');

        // Create an HTML file that can be opened to apply the migration
        const htmlContent = `<!DOCTYPE html>
<html>
<head>
    <title>Apply RLS Migration</title>
    <style>
        body { font-family: Arial, sans-serif; max-width: 1200px; margin: 50px auto; padding: 20px; }
        .container { background: #f5f5f5; padding: 20px; border-radius: 8px; }
        textarea { width: 100%; height: 400px; font-family: monospace; font-size: 12px; }
        button { background: #10b981; color: white; padding: 10px 20px; border: none; border-radius: 4px; cursor: pointer; margin-top: 10px; }
        button:hover { background: #059669; }
        .success { color: #10b981; margin-top: 10px; }
        .error { color: #ef4444; margin-top: 10px; }
        .info { background: #dbeafe; padding: 15px; border-radius: 4px; margin-bottom: 20px; }
    </style>
</head>
<body>
    <div class="container">
        <h1>Apply RLS Migration</h1>
        <div class="info">
            <strong>Instructions:</strong><br>
            1. Copy the SQL below<br>
            2. Go to <a href="https://supabase.com/dashboard/project/${projectId}/sql/new" target="_blank">Supabase SQL Editor</a><br>
            3. Paste the SQL<br>
            4. Click "Run"
        </div>
        <textarea id="sqlContent" readonly>${migrationSQL.replace(/`/g, '\\`')}</textarea>
        <button onclick="copyToClipboard()">Copy SQL to Clipboard</button>
        <button onclick="window.open('https://supabase.com/dashboard/project/${projectId}/sql/new', '_blank')">Open SQL Editor</button>
        <div id="status"></div>
    </div>
    <script>
        function copyToClipboard() {
            const textarea = document.getElementById('sqlContent');
            textarea.select();
            document.execCommand('copy');
            const status = document.getElementById('status');
            status.innerHTML = '<div class="success">✅ SQL copied to clipboard! Now paste it in Supabase SQL Editor.</div>';
        }
    </script>
</body>
</html>`;

        const htmlFile = resolve(projectRoot, 'apply-migration.html');
        writeFileSync(htmlFile, htmlContent);
        console.log('✅ Created helper HTML file: apply-migration.html');
        console.log('   Open this file in your browser for easy migration application\n');

        console.log('📋 ALTERNATIVE: Manual Application\n');
        console.log('Since direct API execution is limited, please apply manually:\n');
        console.log('1. Go to: https://supabase.com/dashboard/project/bwlmlniotyrjttglbjrl/sql/new');
        console.log('2. Copy SQL from: supabase/migrations/20250125000001_ensure_public_read_access.sql');
        console.log('3. Paste and click "Run"\n');

        console.log('OR open: apply-migration.html in your browser for a helper tool\n');

    } catch (error) {
        console.error('❌ Error:', error.message);
        console.log('\n📋 Please apply the migration manually via Supabase Dashboard\n');
    }

} catch (error) {
    console.error('❌ Error reading migration file:', error.message);
    process.exit(1);
}

