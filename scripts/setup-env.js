import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const envLocalPath = path.resolve(__dirname, '../.env.local');

const envContent = `# Supabase Configuration
VITE_SUPABASE_URL=your-supabase-url-here
VITE_SUPABASE_ANON_KEY=your-supabase-anon-key-here

# Google Maps API Configuration
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-api-key-here

# Site Configuration
VITE_SITE_URL=http://localhost:5173

# IMPORTANT: Replace the placeholder values above with your actual keys
# You can find your Supabase keys in your Supabase project dashboard
# You can get a Google Maps API key from the Google Cloud Console
`;

if (!fs.existsSync(envLocalPath)) {
  fs.writeFileSync(envLocalPath, envContent.trim() + '\n');
  console.log('✅ .env.local created with default configuration.');
  console.log('⚠️  Please update the values with your actual API keys.');
} else {
  console.log('✅ .env.local already exists.');
  console.log('⚠️  Please verify your Supabase and Google Maps API keys are configured.');
}

console.log('\n🔧 To fix "Failed to create business" errors:');
console.log('1. Check that VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY are set');
console.log('2. Verify your Supabase project is running and accessible');
console.log('3. Check the browser console for detailed error messages');
console.log('4. Ensure you are logged in to the application');