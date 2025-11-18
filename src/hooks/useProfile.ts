import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface UserProfile {
  id: string;
  user_id?: string;
  email?: string;
  full_name?: string;
  phone?: string;
  avatar_url?: string | null;
  business_name?: string;
  is_business_owner?: boolean;
  is_admin?: boolean;
  role?: string;
  is_active?: boolean;
  created_at?: string;
  updated_at?: string;
}

interface UseProfileResult {
  profile: UserProfile | null | undefined;
  loading: boolean;
  error: any | null;
}

/**
 * useProfile hook - fetches a user profile by user ID
 * Returns a clean, stable shape that never returns error objects as profile
 * 
 * Return states:
 * - { profile: undefined, loading: true, error: null }   → initial load
 * - { profile: null,      loading: false, error: null }  → profile missing (should trigger auto-create)
 * - { profile: <object>,  loading: false, error: null }  → valid profile
 * - { profile: null,      loading: false, error: <err> } → real Supabase errors
 */
export const useProfile = (userId: string | null | undefined): UseProfileResult => {
  const [profile, setProfile] = useState<UserProfile | null | undefined>(undefined);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<any | null>(null);

  useEffect(() => {
    // Reset state when userId changes
    setProfile(undefined);
    setLoading(true);
    setError(null);

    // Don't fetch if no userId
    if (!userId) {
      setProfile(null);
      setLoading(false);
      setError(null);
      return;
    }

    const fetchProfile = async () => {
      console.debug('🔍 useProfile: Profile fetch starting', {
        userId
      });

      try {
        // Try fetching by id first (primary key)
        let { data, error: fetchError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();

        // If that fails or returns nothing, try by user_id
        if ((fetchError && fetchError.code !== 'PGRST116') || !data) {
          console.debug('🔍 useProfile: Trying user_id lookup...', {
            userId,
            previousError: fetchError?.code
          });
          
          const { data: altData, error: altError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', userId)
            .maybeSingle();

          if (altData) {
            data = altData;
            fetchError = null;
          } else if (altError && altError.code !== 'PGRST116') {
            fetchError = altError;
          }
        }

        // Handle Supabase response
        if (fetchError) {
          // Real Supabase error (not "not found")
          if (fetchError.code !== 'PGRST116') {
            console.error('❌ useProfile: Profile fetch error', {
              code: fetchError.code,
              message: fetchError.message,
              details: fetchError.details
            });
            setProfile(null);
            setError(fetchError);
            setLoading(false);
            return;
          }
          // PGRST116 = no rows returned (profile doesn't exist)
          // This is NOT an error - profile is simply missing
          console.debug('ℹ️ useProfile: Profile missing (no rows found)', {
            userId
          });
          setProfile(null);
          setError(null);
          setLoading(false);
          return;
        }

        // Check if data exists and is a valid profile object
        if (data && typeof data === 'object' && !Array.isArray(data)) {
          // Ensure it's not an error object masquerading as profile
          if ('code' in data || 'message' in data) {
            console.warn('⚠️ useProfile: Received error-like object, treating as missing profile', {
              userId,
              received: data
            });
            setProfile(null);
            setError(null);
            setLoading(false);
            return;
          }

          // Valid profile object
          console.debug('✅ useProfile: Profile fetch success', {
            userId,
            profileId: data.id,
            role: data.role,
            isAdmin: data.is_admin
          });
          setProfile(data as UserProfile);
          setError(null);
          setLoading(false);
        } else {
          // Data is null, undefined, or invalid
          console.debug('ℹ️ useProfile: Profile missing (null/undefined data)', {
            userId
          });
          setProfile(null);
          setError(null);
          setLoading(false);
        }
      } catch (err: any) {
        // Unexpected error
        console.error('❌ useProfile: Unexpected error', {
          userId,
          message: err.message,
          stack: err.stack
        });
        setProfile(null);
        setError(err);
        setLoading(false);
      }
    };

    fetchProfile();
  }, [userId]);

  // Return clean, stable shape
  return {
    profile,
    loading,
    error
  };
};

export default useProfile;


