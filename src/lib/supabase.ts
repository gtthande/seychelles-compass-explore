import { createClient } from '@supabase/supabase-js'
import type { Database } from '@/integrations/supabase/types'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

// Validate environment variables
if (!supabaseUrl) {
  console.error('⚠️ VITE_SUPABASE_URL is not defined')
  throw new Error('VITE_SUPABASE_URL is required')
}

if (!supabaseAnonKey) {
  console.error('⚠️ VITE_SUPABASE_ANON_KEY is not defined')
  throw new Error('VITE_SUPABASE_ANON_KEY is required')
}

console.log('🔗 Supabase client initialized:', {
  url: supabaseUrl,
  hasAnonKey: !!supabaseAnonKey
})

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: localStorage,
    persistSession: true,
    autoRefreshToken: true,
  }
})
