/**
 * Presync Script - Runs before dev server starts
 * 
 * This script:
 * 1. Validates .env file contains required variables
 * 2. Regenerates Supabase types from the live database
 * 3. Cleans Vite cache to ensure fresh builds
 * 
 * Run with: node scripts/presync.js
 */

import { readFileSync, existsSync, rmSync, mkdirSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

// Required environment variables
const REQUIRED_VARS = [
    'VITE_SUPABASE_URL',
    'VITE_SUPABASE_ANON_KEY',
    'VITE_SITE_URL'
];

// Load and validate .env file
function validateEnv() {
    console.log('[presync] Validating .env file...');

    const envPath = resolve(projectRoot, '.env');
    if (!existsSync(envPath)) {
        console.error('❌ FATAL: .env file not found at project root');
        console.error('   Please create .env file with required variables.');
        process.exit(1);
    }

    const envContent = readFileSync(envPath, 'utf8');
    const envVars = {};

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
        }
    });

    // Verify required variables
    const missing = [];
    const invalid = [];

    for (const key of REQUIRED_VARS) {
        const value = envVars[key] || process.env[key];

        if (!value || value.trim() === '') {
            missing.push(key);
        } else {
            // Special validation for VITE_SITE_URL
            if (key === 'VITE_SITE_URL' && value !== 'http://localhost:5173') {
                invalid.push(`${key} must be exactly "http://localhost:5173" (found: "${value}")`);
            }

            // Validate Supabase URL format
            if (key === 'VITE_SUPABASE_URL' && !value.startsWith('https://')) {
                invalid.push(`${key} must start with "https://"`);
            }

            // Validate anon key format (JWT)
            if (key === 'VITE_SUPABASE_ANON_KEY' && !value.startsWith('eyJ')) {
                invalid.push(`${key} must be a valid JWT token (should start with "eyJ")`);
            }
        }
    }

    if (missing.length > 0) {
        console.error('❌ FATAL: Missing required environment variables:');
        missing.forEach(v => console.error(`   - ${v}`));
        console.error('\n   Please add these to your .env file.');
        process.exit(1);
    }

    if (invalid.length > 0) {
        console.error('❌ FATAL: Invalid environment variable values:');
        invalid.forEach(v => console.error(`   - ${v}`));
        process.exit(1);
    }

    console.log('✅ [presync] .env validation passed');
    return envVars;
}

// Extract project ID from Supabase URL
function extractProjectId(supabaseUrl) {
    const match = supabaseUrl.match(/https:\/\/([^.]+)\.supabase\.co/);
    if (!match) {
        console.error('❌ FATAL: Invalid VITE_SUPABASE_URL format');
        console.error('   Expected format: https://<project-id>.supabase.co');
        process.exit(1);
    }
    return match[1];
}

// Regenerate Supabase types
function regenerateTypes(projectId) {
    console.log('[presync] Regenerating Supabase types...');

    const supabaseTypesDir = resolve(projectRoot, 'supabase');
    const generatedTypesPath = resolve(supabaseTypesDir, 'types.gen.ts');
    const outputTypesPath = resolve(projectRoot, 'src/types/supabase.ts');
    const outputTypesDir = dirname(outputTypesPath);

    // Ensure directories exist
    try {
        if (!existsSync(supabaseTypesDir)) {
            mkdirSync(supabaseTypesDir, { recursive: true });
        }
        if (!existsSync(outputTypesDir)) {
            mkdirSync(outputTypesDir, { recursive: true });
        }
    } catch (err) {
        // Directory might already exist, ignore
    }

    try {
        // Generate types using supabase CLI to intermediate file
        const command = `npx supabase gen types typescript --project-id ${projectId} --schema public > "${generatedTypesPath}"`;
        execSync(command, {
            cwd: projectRoot,
            stdio: 'pipe',
            shell: true
        });

        console.log('✅ [presync] Types generated, processing...');

        // Process types with fix-types.js
        try {
            execSync('node ./scripts/fix-types.js', {
                cwd: projectRoot,
                stdio: 'inherit',
                shell: true
            });
        } catch (fixError) {
            // If fix-types fails, copy directly
            console.warn('⚠️  [presync] fix-types.js failed, copying directly...');
            const content = readFileSync(generatedTypesPath, 'utf8');
            writeFileSync(outputTypesPath, content, 'utf8');
        }

        console.log('✅ [presync] Types regenerated and processed');
    } catch (error) {
        const errorOutput = error.stdout?.toString() || error.stderr?.toString() || error.message || error.toString();
        if (errorOutput.includes('Access token not provided') || errorOutput.includes('not authenticated') || errorOutput.includes('not logged in')) {
            console.warn('⚠️  [presync] Supabase CLI authentication required for type regeneration');
            console.warn('   To enable automatic type regeneration:');
            console.warn('   1. Run: supabase login');
            console.warn('   2. Or set SUPABASE_ACCESS_TOKEN environment variable');
            console.warn('   Continuing with existing types...');
        } else {
            console.warn('⚠️  [presync] Type regeneration failed:', errorOutput.split('\n')[0]);
            console.warn('   Make sure @supabase/cli is installed: npm install -g supabase');
            console.warn('   Continuing with existing types...');
        }
    }
}

// Clean Vite cache
function cleanViteCache() {
    console.log('[presync] Cleaning Vite cache...');

    const viteCachePath = resolve(projectRoot, 'node_modules/.vite');

    if (existsSync(viteCachePath)) {
        try {
            rmSync(viteCachePath, { recursive: true, force: true });
            console.log('✅ [presync] Vite cache cleaned');
        } catch (error) {
            console.warn('⚠️  [presync] Failed to clean Vite cache:', error.message);
            // Don't exit, this is not critical
        }
    } else {
        console.log('✅ [presync] Vite cache already clean');
    }
}

// Main execution
async function main() {
    try {
        const envVars = validateEnv();
        const projectId = extractProjectId(envVars.VITE_SUPABASE_URL);
        regenerateTypes(projectId);
        cleanViteCache();
        console.log('✅ [presync] All presync tasks completed');
    } catch (error) {
        console.error('❌ [presync] Fatal error:', error.message);
        process.exit(1);
    }
}

main();

