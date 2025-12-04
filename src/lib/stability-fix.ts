/**
 * Stability Patch for Supabase Queries
 * 
 * Provides retry logic, error normalization, reconnection handling,
 * and local caching fallback for improved stability.
 */

import { SupabaseClient } from '@supabase/supabase-js';

export interface RetryOptions {
    maxRetries?: number;
    retryDelay?: number;
    retryableErrors?: string[];
}

const DEFAULT_RETRY_OPTIONS: Required<RetryOptions> = {
    maxRetries: 3,
    retryDelay: 1000,
    retryableErrors: [
        'network',
        'timeout',
        'ECONNRESET',
        'ETIMEDOUT',
        'Failed to fetch',
        'NetworkError',
    ],
};

/**
 * Normalize error messages for consistent handling
 */
export function normalizeError(error: any): string {
    if (!error) return 'Unknown error';

    if (typeof error === 'string') return error;

    if (error.message) {
        // Check for common Supabase error patterns
        if (error.message.includes('relation') && error.message.includes('does not exist')) {
            return 'Database table not found. Please ensure migrations are applied.';
        }
        if (error.message.includes('permission denied') || error.message.includes('RLS')) {
            return 'Permission denied. Please check your access rights.';
        }
        if (error.message.includes('JWT')) {
            return 'Authentication error. Please log in again.';
        }
        return error.message;
    }

    if (error.error) {
        return normalizeError(error.error);
    }

    return 'Unknown error occurred';
}

/**
 * Check if an error is retryable
 */
function isRetryableError(error: any, retryableErrors: string[]): boolean {
    const errorMessage = normalizeError(error).toLowerCase();
    return retryableErrors.some(retryable =>
        errorMessage.includes(retryable.toLowerCase())
    );
}

/**
 * Retry wrapper for async functions
 */
export async function withRetry<T>(
    fn: () => Promise<T>,
    options: RetryOptions = {}
): Promise<T> {
    const opts = { ...DEFAULT_RETRY_OPTIONS, ...options };
    let lastError: any;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
        try {
            return await fn();
        } catch (error) {
            lastError = error;

            // Don't retry on last attempt
            if (attempt === opts.maxRetries) break;

            // Don't retry if error is not retryable
            if (!isRetryableError(error, opts.retryableErrors)) {
                break;
            }

            // Wait before retrying (exponential backoff)
            const delay = opts.retryDelay * Math.pow(2, attempt);
            await new Promise(resolve => setTimeout(resolve, delay));

            console.warn(`[Retry] Attempt ${attempt + 1}/${opts.maxRetries} failed, retrying...`, {
                error: normalizeError(error),
                delay,
            });
        }
    }

    throw lastError;
}

/**
 * Local cache for fallback data
 */
class LocalCache {
    private cache: Map<string, { data: any; timestamp: number; ttl: number }> = new Map();

    set(key: string, data: any, ttl: number = 300000) { // 5 minutes default
        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl,
        });
    }

    get(key: string): any | null {
        const entry = this.cache.get(key);
        if (!entry) return null;

        const age = Date.now() - entry.timestamp;
        if (age > entry.ttl) {
            this.cache.delete(key);
            return null;
        }

        return entry.data;
    }

    clear() {
        this.cache.clear();
    }

    has(key: string): boolean {
        return this.cache.has(key) && this.get(key) !== null;
    }
}

const localCache = new LocalCache();

/**
 * Cached query with fallback to cache on error
 */
export async function cachedQuery<T>(
    key: string,
    queryFn: () => Promise<T>,
    options: { ttl?: number; useCache?: boolean } = {}
): Promise<T> {
    const { ttl = 300000, useCache = true } = options;

    // Try cache first if enabled
    if (useCache) {
        const cached = localCache.get(key);
        if (cached !== null) {
            console.debug(`[Cache] Hit for key: ${key}`);
            return cached;
        }
    }

    try {
        // Execute query with retry
        const data = await withRetry(queryFn);

        // Cache the result
        if (useCache) {
            localCache.set(key, data, ttl);
        }

        return data;
    } catch (error) {
        console.error(`[CachedQuery] Error for key: ${key}`, error);

        // Try to return cached data as fallback
        if (useCache) {
            const cached = localCache.get(key);
            if (cached !== null) {
                console.warn(`[Cache] Using stale cache for key: ${key}`);
                return cached;
            }
        }

        throw error;
    }
}

/**
 * Supabase client reconnection logic
 */
export async function ensureConnection(
    client: SupabaseClient,
    testQuery: () => Promise<any>
): Promise<boolean> {
    try {
        await withRetry(testQuery, { maxRetries: 2, retryDelay: 500 });
        return true;
    } catch (error) {
        console.error('[Connection] Failed to establish connection', error);
        return false;
    }
}

/**
 * Safe query wrapper that handles errors gracefully
 */
export async function safeQuery<T>(
    queryFn: () => Promise<T>,
    fallback: T,
    options: RetryOptions = {}
): Promise<T> {
    try {
        return await withRetry(queryFn, options);
    } catch (error) {
        console.error('[SafeQuery] Error occurred, using fallback', {
            error: normalizeError(error),
            fallback,
        });
        return fallback;
    }
}

/**
 * Clear all caches
 */
export function clearCache() {
    localCache.clear();
}

/**
 * Get cache statistics
 */
export function getCacheStats() {
    return {
        size: localCache['cache'].size,
        keys: Array.from(localCache['cache'].keys()),
    };
}

