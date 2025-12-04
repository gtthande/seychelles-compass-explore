/**
 * Supabase Error Handler Utility
 * 
 * Provides consistent error logging and user notifications for Supabase errors
 */

import { PostgrestError } from '@supabase/supabase-js';
import { toast } from '@/hooks/use-toast';

/**
 * Notify user of a Supabase error with consistent logging
 * 
 * @param context - Context description (e.g., "Failed to load categories")
 * @param error - Supabase PostgrestError
 */
export function notifySupabaseError(context: string, error: PostgrestError | Error) {
    console.error(`[${context}]`, {
        error,
        code: (error as PostgrestError).code,
        message: error.message,
        details: (error as PostgrestError).details,
        hint: (error as PostgrestError).hint,
    });

    toast({
        title: 'Error',
        description: `${context}: ${error.message || 'An unexpected error occurred'}`,
        variant: 'destructive',
    });
}
