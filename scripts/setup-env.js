#!/usr/bin/env node

/**
 * Environment Setup Script
 * Creates .env.local with proper Vite configuration
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envContent = `# Vite Development Configuration
VITE_SITE_URL=http://localhost:5173

# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your_key_here

# Supabase Configuration (if using)
# VITE_SUPABASE_URL=your_supabase_url
# VITE_SUPABASE_ANON_KEY=your_supabase_anon_key

# Development Settings
VITE_DEV_MODE=true
VITE_DEBUG_MODE=false
`;

const envPath = path.join(process.cwd(), '.env.local');

try {
  if (!fs.existsSync(envPath)) {
    fs.writeFileSync(envPath, envContent);
    console.log('✅ Created .env.local with Vite configuration');
  } else {
    console.log('✅ .env.local already exists');
  }
} catch (error) {
  console.error('❌ Failed to create .env.local:', error.message);
  process.exit(1);
}
