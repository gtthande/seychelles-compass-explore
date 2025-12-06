/**
 * Supabase Service Role Client
 * 
 * ⚠️ WARNING: This file should NOT be used in the frontend.
 * Service role keys must NEVER be exposed to the browser.
 * 
 * This file is kept for reference only. All frontend code should use
 * the regular client from @/integrations/supabase/client.ts
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';
import { supabase } from './client';

/**
 * Get Supabase client (uses anon key only - no service role in frontend)
 * This function now returns the regular client to prevent service role exposure
 */
export function getServiceClient(): SupabaseClient<Database> {
    // Frontend should NEVER use service role
    // Return the regular anon client instead
    console.warn('⚠️ getServiceClient() called in frontend - using anon client instead of service role');
    return supabase;
}

