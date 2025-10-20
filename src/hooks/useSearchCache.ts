import { useState, useCallback } from 'react';

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface SearchCache {
  [key: string]: CacheEntry;
}

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes
const MAX_CACHE_SIZE = 50; // Maximum number of cached entries

export const useSearchCache = () => {
  const [cache, setCache] = useState<SearchCache>({});

  const get = useCallback((key: string) => {
    const entry = cache[key];
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      // Entry expired, remove it
      setCache(prev => {
        const newCache = { ...prev };
        delete newCache[key];
        return newCache;
      });
      return null;
    }

    return entry.data;
  }, [cache]);

  const set = useCallback((key: string, data: any, ttl: number = CACHE_TTL) => {
    setCache(prev => {
      const newCache = { ...prev };
      
      // Remove oldest entries if cache is full
      const entries = Object.entries(newCache);
      if (entries.length >= MAX_CACHE_SIZE) {
        // Sort by timestamp and remove oldest
        entries.sort((a, b) => a[1].timestamp - b[1].timestamp);
        const toRemove = entries.slice(0, entries.length - MAX_CACHE_SIZE + 1);
        toRemove.forEach(([k]) => delete newCache[k]);
      }

      newCache[key] = {
        data,
        timestamp: Date.now(),
        ttl
      };

      return newCache;
    });
  }, []);

  const clear = useCallback(() => {
    setCache({});
  }, []);

  const clearExpired = useCallback(() => {
    const now = Date.now();
    setCache(prev => {
      const newCache = { ...prev };
      Object.entries(newCache).forEach(([key, entry]) => {
        if (now - entry.timestamp > entry.ttl) {
          delete newCache[key];
        }
      });
      return newCache;
    });
  }, []);

  const getStats = useCallback(() => {
    const now = Date.now();
    const entries = Object.values(cache);
    const active = entries.filter(entry => now - entry.timestamp <= entry.ttl);
    const expired = entries.filter(entry => now - entry.timestamp > entry.ttl);
    
    return {
      total: entries.length,
      active: active.length,
      expired: expired.length,
      maxSize: MAX_CACHE_SIZE
    };
  }, [cache]);

  return {
    get,
    set,
    clear,
    clearExpired,
    getStats
  };
};
