import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables with detailed error messages
if (!supabaseUrl || supabaseUrl === 'https://your-project.supabase.co' || supabaseUrl === 'https://placeholder.supabase.co') {
  const errorMsg = '❌ VITE_SUPABASE_URL is not configured! Please set it in .env.local or .env file.';
  console.error(errorMsg);
  console.error('   Example: VITE_SUPABASE_URL=https://your-project-id.supabase.co');
  
  // Show user-friendly error in browser console
  if (typeof window !== 'undefined') {
    console.error('%c' + errorMsg, 'color: red; font-weight: bold; font-size: 14px;');
  }
}

if (!supabaseAnonKey || supabaseAnonKey === 'your-anon-key-here' || supabaseAnonKey === 'placeholder-key') {
  const errorMsg = '❌ VITE_SUPABASE_ANON_KEY is not configured! Please set it in .env.local or .env file.';
  console.error(errorMsg);
  console.error('   Get your anon key from: https://app.supabase.com/project/_/settings/api');
  
  // Show user-friendly error in browser console
  if (typeof window !== 'undefined') {
    console.error('%c' + errorMsg, 'color: red; font-weight: bold; font-size: 14px;');
  }
}

// Validate URL format
if (supabaseUrl && !supabaseUrl.startsWith('https://') && !supabaseUrl.startsWith('http://')) {
  console.error('❌ VITE_SUPABASE_URL must start with https:// or http://');
  console.error('   Current value:', supabaseUrl);
}

// Validate anon key format (should be a JWT)
if (supabaseAnonKey && !supabaseAnonKey.startsWith('eyJ')) {
  console.warn('⚠️ VITE_SUPABASE_ANON_KEY should start with "eyJ" (JWT format)');
  console.warn('   Current key length:', supabaseAnonKey.length);
}

// Use fallback values only if we have valid-looking values
const finalUrl = supabaseUrl && supabaseUrl !== 'https://your-project.supabase.co' && supabaseUrl !== 'https://placeholder.supabase.co'
  ? supabaseUrl
  : 'https://placeholder.supabase.co';

const finalKey = supabaseAnonKey && supabaseAnonKey !== 'your-anon-key-here' && supabaseAnonKey !== 'placeholder-key'
  ? supabaseAnonKey
  : 'placeholder-key';

console.log('🔗 Supabase client initialized:', {
  url: finalUrl,
  urlConfigured: finalUrl !== 'https://placeholder.supabase.co',
  hasAnonKey: !!finalKey && finalKey !== 'placeholder-key',
  keyLength: finalKey?.length || 0,
  isPlaceholder: finalUrl === 'https://placeholder.supabase.co' || finalKey === 'placeholder-key'
});

// Create client with error handling and better network configuration
export const supabase = createClient<Database>(finalUrl, finalKey, {
  auth: {
    storage: typeof window !== 'undefined' ? localStorage : undefined,
    persistSession: typeof window !== 'undefined',
    autoRefreshToken: true,
  },
  global: {
    headers: {
      'x-client-info': 'seychelles-compass-explore@1.0.0'
    },
    // Add fetch options for better error handling
    fetch: (url, options = {}) => {
      // Only add timeout if not already provided
      if (options.signal) {
        return fetch(url, options);
      }
      
      // Create abort controller for timeout (30 seconds for slow networks)
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout
      
      return fetch(url, {
        ...options,
        signal: controller.signal,
      }).catch((error) => {
        clearTimeout(timeoutId);
        // Provide better error messages
        if (error.name === 'AbortError') {
          throw new Error('Request timeout: Supabase connection took too long (30s). This might be a network or CORS issue.');
        }
        if (error.message?.includes('Failed to fetch')) {
          throw new Error('Network error: Unable to reach Supabase. Check your internet connection and CORS settings.');
        }
        throw error;
      }).finally(() => {
        clearTimeout(timeoutId);
      });
    }
  }
});

// Test connection on client side
if (typeof window !== 'undefined' && finalUrl !== 'https://placeholder.supabase.co' && finalKey !== 'placeholder-key') {
  // Test connection asynchronously
  supabase.from('businesses').select('id').limit(1).then(({ error }) => {
    if (error) {
      console.error('❌ Supabase connection test failed:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
      
      if (error.message?.includes('Failed to fetch') || error.code === 'PGRST301') {
        console.error('💡 This might be a network/CORS issue. Check:');
        console.error('   1. Is your Supabase project URL correct?');
        console.error('   2. Is your Supabase project active?');
        console.error('   3. Are CORS settings configured in Supabase dashboard?');
        console.error('   4. Is your network blocking the connection?');
      }
    } else {
      console.log('✅ Supabase connection test successful');
    }
  }).catch((err) => {
    console.error('❌ Supabase connection test error:', err);
  });
}