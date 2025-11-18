import { useState, useEffect } from "react";
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

  const fetchUserProfile = async (userId: string) => {
    try {
      // Try fetching by user_id first
      let { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      // If not found by user_id, try by id
      if ((error && error.code === 'PGRST116') || !profile) {
        const { data: altProfile, error: altError } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', userId)
          .maybeSingle();
        
        if (altProfile) {
          profile = altProfile;
          error = null;
        } else if (altError && altError.code !== 'PGRST116') {
          error = altError;
        }
      }

      if (error && error.code !== 'PGRST116') {
        // Real error (not "not found")
        console.error('Error fetching profile:', error);
        setProfile(null);
        return;
      }

      if (profile) {
        setProfile(profile);
      } else {
        // Profile doesn't exist - don't auto-create here, let RouteGuard handle it
        // This ensures proper role assignment based on route requirements
        setProfile(null);
      }
    } catch (error) {
      console.error('Unexpected error fetching profile:', error);
      setProfile(null);
    }
  };

  useEffect(() => {
    let mounted = true;
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (!mounted) return;
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          await fetchUserProfile(session.user.id);
        } else {
          setProfile(null);
        }
        
        // Always set loading to false after auth state change
        setLoading(false);
      }
    );

    // Check for existing session - ensure loading always resolves
    supabase.auth.getSession().then(async ({ data: { session }, error }) => {
      if (!mounted) return;
      
      // Always set loading to false, even if there's an error
      if (error) {
        console.error('Error getting session:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
        return;
      }
      
      setSession(session);
      setUser(session?.user ?? null);
      
      if (session?.user) {
        await fetchUserProfile(session.user.id);
      } else {
        setProfile(null);
      }
      
      // Always set loading to false
      setLoading(false);
    }).catch((error) => {
      // Catch any unexpected errors and ensure loading resolves
      console.error('Unexpected error in getSession:', error);
      if (mounted) {
        setSession(null);
        setUser(null);
        setProfile(null);
        setLoading(false);
      }
    });

    return () => {
      mounted = false;
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