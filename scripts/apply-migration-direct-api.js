/**
 * Apply Migration Directly via Supabase REST API
 * 
 * Attempts to apply the migration using the service role key
 * via Supabase's REST API endpoints.
 */

import { readFileSync, existsSync, writeFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Read .env file
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

if (!supabaseUrl || !serviceRoleKey) {
    console.error('❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_SERVICE_ROLE in .env');
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
    console.log('📝 Attempting to execute SQL via Supabase API...\n');

    // Try to execute via Supabase's SQL execution endpoint
    // Note: Supabase doesn't expose arbitrary SQL execution via REST API for security
    // We'll need to use the Management API or apply via dashboard

    // Extract project ID from URL
    const projectId = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/)?.[1];

    if (!projectId) {
        console.error('❌ Could not extract project ID from Supabase URL');
        process.exit(1);
    }

    console.log(`📋 Project ID: ${projectId}\n`);

    // Since direct SQL execution isn't available via REST API,
    // we'll provide the easiest path forward
    console.log('💡 DIRECT APPLICATION METHOD:\n');
    console.log('I\'ll create a script that opens the Supabase dashboard for you.\n');

    // Create a PowerShell script to open the dashboard
    const psScript = `# Open Supabase SQL Editor with migration ready to paste
$migrationFile = "${migrationFile.replace(/\\/g, '/')}"
$sqlContent = Get-Content $migrationFile -Raw
$sqlContent | Set-Clipboard
Write-Host "✅ Migration SQL copied to clipboard!" -ForegroundColor Green
Write-Host ""
Write-Host "Opening Supabase Dashboard..." -ForegroundColor Cyan
Start-Process "https://supabase.com/dashboard/project/${projectId}/sql/new"
Write-Host ""
Write-Host "📋 Next steps:" -ForegroundColor Yellow
Write-Host "1. SQL is already in your clipboard" -ForegroundColor White
Write-Host "2. Paste (Ctrl+V) in the SQL Editor" -ForegroundColor White
Write-Host "3. Click 'Run' button" -ForegroundColor White
`;

    const psFile = resolve(projectRoot, 'apply-migration.ps1');
    writeFileSync(psFile, psScript);

    console.log('✅ Created PowerShell script: apply-migration.ps1');
    console.log('   This will copy the SQL and open Supabase Dashboard\n');

    // Try to run it
    console.log('🔄 Running the script now...\n');

    const { execSync } = await import('child_process');

    try {
        execSync(`powershell -ExecutionPolicy Bypass -File "${psFile}"`, {
            stdio: 'inherit',
            cwd: projectRoot
        });

        console.log('\n✅ Migration helper executed!');
        console.log('   The SQL is in your clipboard and Supabase Dashboard should be open.');
        console.log('   Just paste (Ctrl+V) and click "Run"!\n');

    } catch (error) {
        console.log('⚠️  Could not auto-open dashboard, but SQL is ready to copy.\n');
        console.log('📋 MANUAL STEPS:\n');
        console.log('1. Open: https://supabase.com/dashboard/project/' + projectId + '/sql/new');
        console.log('2. Copy SQL from: ' + migrationFile);
        console.log('3. Paste and click "Run"\n');
        console.log('OR run: powershell -ExecutionPolicy Bypass -File apply-migration.ps1\n');
    }

} catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
}

