/**
 * Supabase Service Role Client
 * 
 * Use this client ONLY for server-side operations that require elevated privileges.
 * NEVER expose this client to the browser or use it in public pages.
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js';
import type { Database } from '@/types/supabase';

let serviceClientInstance: SupabaseClient<Database> | null = null;

/**
 * Get or create the Supabase service role client instance
 * This client bypasses RLS and should ONLY be used for admin operations
 */
export function getServiceClient(): SupabaseClient<Database> {
    if (serviceClientInstance) {
        return serviceClientInstance;
    }

    const url = import.meta.env.VITE_SUPABASE_URL;
    const serviceRoleKey = import.meta.env.VITE_SUPABASE_SERVICE_ROLE;

    if (!url) {
        throw new Error('Missing VITE_SUPABASE_URL');
    }

    if (!serviceRoleKey) {
        console.warn('⚠️  VITE_SUPABASE_SERVICE_ROLE not set. Admin writes may fail.');
        // Fallback to anon key (will respect RLS)
        const anon = import.meta.env.VITE_SUPABASE_ANON_KEY;
        if (!anon) {
            throw new Error('Missing both VITE_SUPABASE_SERVICE_ROLE and VITE_SUPABASE_ANON_KEY');
        }
        serviceClientInstance = createClient<Database>(url, anon);
        return serviceClientInstance;
    }

    serviceClientInstance = createClient<Database>(url, serviceRoleKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    });

    return serviceClientInstance;
}

