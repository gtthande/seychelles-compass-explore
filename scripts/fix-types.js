/**
 * Fix Types Script
 * Processes generated Supabase types to fix common issues
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const projectRoot = resolve(__dirname, '..');

const generatedTypesPath = resolve(projectRoot, 'supabase/types.gen.ts');
const outputTypesPath = resolve(projectRoot, 'src/types/supabase.ts');

if (!existsSync(generatedTypesPath)) {
    console.warn('[fix-types] Generated types file not found, skipping...');
    process.exit(0);
}

console.log('[fix-types] Processing types...');

let content = readFileSync(generatedTypesPath, 'utf8');

// Fix common Supabase → Vite type mismatches
content = content.replace(/:\s*json\b/g, ': any');
content = content.replace(/:\s*unknown\b/g, ': any');

// Ensure directory exists
const outputDir = dirname(outputTypesPath);
if (!existsSync(outputDir)) {
    const { mkdirSync } = await import('fs');
    mkdirSync(outputDir, { recursive: true });
}

writeFileSync(outputTypesPath, content, 'utf8');
console.log('✅ [fix-types] Local types fixed and saved to src/types/supabase.ts');




