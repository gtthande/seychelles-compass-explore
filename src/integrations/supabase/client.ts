import { createClient } from '@supabase/supabase-js';

// Get environment variables directly from Vite
const url = import.meta.env.VITE_SUPABASE_URL;
const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Runtime guards - fail fast with clear errors
if (!url) {
  console.error('❌ FATAL: Missing VITE_SUPABASE_URL');
  console.error('   Please check your .env file at project root.');
  throw new Error('Missing VITE_SUPABASE_URL');
}

if (!anon) {
  console.error('❌ FATAL: Missing VITE_SUPABASE_ANON_KEY');
  console.error('   Please check your .env file at project root.');
  throw new Error('Missing VITE_SUPABASE_ANON_KEY');
}

// Validate URL format
if (!url.startsWith('https://')) {
  console.error('❌ FATAL: Invalid VITE_SUPABASE_URL format');
  console.error(`   URL must start with "https://" (found: "${url.substring(0, 20)}...")`);
  throw new Error('Invalid VITE_SUPABASE_URL format');
}

// Validate anon key format (JWT)
if (!anon.startsWith('eyJ')) {
  console.warn('⚠️  VITE_SUPABASE_ANON_KEY may be invalid (should start with "eyJ")');
}

// Create stable v2 client with proper auth configuration
export const supabase = createClient(url, anon, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Log successful initialization
console.log('✔ Supabase client initialized');
console.log(`   URL: ${url.substring(0, 30)}...`);

// Verify session on startup
supabase.auth.getSession().then(({ data: { session }, error }) => {
  if (error) {
    console.warn('⚠️  Session check error:', error.message);
  } else if (session) {
    console.log(`   Active session: ${session.user.email}`);
  } else {
    console.log('   No active session');
  }
});
