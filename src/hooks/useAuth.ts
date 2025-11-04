import { useState, useEffect, useRef } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

interface UserProfile {
  id: string;
  user_id: string;
  email: string;
  full_name: string;
  phone: string;
  avatar_url: string | null;
  business_name: string;
  is_business_owner: boolean;
  is_admin: boolean;
  role: string;
  created_at: string;
  updated_at: string;
}

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchUserProfile = async (userId: string) => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      // Add timeout to prevent hanging
      const timeoutPromise = new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Profile fetch timeout')), 10000);
      });
      
      const profilePromise = supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      const { data: profile, error } = await Promise.race([profilePromise, timeoutPromise]) as any;

      if (error) {
        console.error('Error fetching profile:', error);
        // If profile doesn't exist, create one with default role
        const { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: user?.email || '',
            full_name: user?.user_metadata?.full_name || '',
            phone: '',
            business_name: '',
            is_business_owner: false,
            is_admin: false,
            role: 'user' // Default role for new users
          })
          .select()
          .single();

        if (createError) {
          console.error('Error creating profile:', createError);
          if (!signal.aborted) setProfile(null);
        } else {
          if (!signal.aborted) setProfile(newProfile);
        }
      } else {
        if (!signal.aborted) setProfile(profile);
      }
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      console.error('Unexpected error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    // Set a fallback timeout to prevent infinite loading
    const fallbackTimeout = setTimeout(() => {
      setLoading(false);
    }, 15000);
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        clearTimeout(fallbackTimeout);
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          try {
            await fetchUserProfile(session.user.id);
          } catch (error) {
            console.error('Profile fetch failed:', error);
            setProfile(null);
          }
        } else {
          setProfile(null);
        }
        
        setLoading(false);
      }
    );

    // Check for existing session
    const sessionTimeoutPromise = new Promise((_, reject) => {
      setTimeout(() => reject(new Error('Session check timeout')), 10000);
    });
    
    Promise.race([
      supabase.auth.getSession(),
      sessionTimeoutPromise
    ]).then(async (result: any) => {
      clearTimeout(fallbackTimeout);
      const { data: { session } } = result;
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        try {
          await fetchUserProfile(session.user.id);
        } catch (error) {
          console.error('Profile fetch failed:', error);
          setProfile(null);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    }).catch((error) => {
      console.error('Session check failed:', error);
      clearTimeout(fallbackTimeout);
      setLoading(false);
    });

    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
      clearTimeout(fallbackTimeout);
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("Error signing out:", error);
    }
  };

  return {
    user,
    session,
    profile,
    loading,
    signOut,
    isAuthenticated: !!user,
    isAdmin: profile?.is_admin || profile?.role === 'admin',
    isBusiness: profile?.is_business_owner || profile?.role === 'business',
    isActive: true, // Default to active
  };
};