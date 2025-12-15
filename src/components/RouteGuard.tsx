import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type RouteGuardProps = {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business' | 'user';
};

/**
 * Route guard with role-based access control.
 *
 * - Waits for auth session to resolve before rendering.
 * - Checks user role if requiredRole is specified.
 * - Shows loading state instead of 404 while checking.
 * - Cannot get stuck: when loading is false we always either
 *   (a) redirect to /auth or (b) render children.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children, requiredRole }) => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const checkAuthAndRole = async () => {
      try {
        // Get session directly from Supabase
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (!mounted) return;

        if (error) {
          console.error("[RouteGuard] Session error:", error);
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        if (!session?.user) {
          setUser(null);
          setProfile(null);
          setLoading(false);
          return;
        }

        setUser(session.user);

        // If role check is required, fetch profile
        if (requiredRole) {
          const { data: profileData, error: profileError } = await supabase
            .from('profiles')
            .select('id, role, is_admin, is_business_owner')
            .eq('user_id', session.user.id)
            .maybeSingle();

          if (!mounted) return;

          if (profileError && profileError.code !== 'PGRST116') {
            console.error("[RouteGuard] Profile fetch error:", profileError);
          }

          // Also try by id if user_id didn't work
          if (!profileData) {
            const { data: altProfile } = await supabase
              .from('profiles')
              .select('id, role, is_admin, is_business_owner')
              .eq('id', session.user.id)
              .maybeSingle();
            
            if (altProfile) {
              setProfile(altProfile);
            } else {
              setProfile(null);
            }
          } else {
            setProfile(profileData);
          }
        }

        setLoading(false);
      } catch (err) {
        console.error("[RouteGuard] Unexpected error:", err);
        if (mounted) {
          setUser(null);
          setProfile(null);
          setLoading(false);
        }
      }
    };

    checkAuthAndRole();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (_event, session) => {
      if (!mounted) return;
      
      setUser(session?.user ?? null);
      
      if (session?.user && requiredRole) {
        // Re-check profile on auth change
        const { data: profileData } = await supabase
          .from('profiles')
          .select('id, role, is_admin, is_business_owner')
          .eq('user_id', session.user.id)
          .maybeSingle();
        
        if (!profileData) {
          const { data: altProfile } = await supabase
            .from('profiles')
            .select('id, role, is_admin, is_business_owner')
            .eq('id', session.user.id)
            .maybeSingle();
          
          setProfile(altProfile || null);
        } else {
          setProfile(profileData);
        }
      } else {
        setProfile(null);
      }
      
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, [requiredRole]);

  // Debug tracing so we can see state changes in the console.
  console.debug("[RouteGuard] state", {
    path: location.pathname,
    loading,
    userPresent: !!user,
    requiredRole,
    profileRole: profile?.role,
    isAdmin: profile?.is_admin || profile?.role === 'admin',
  });

  // While Supabase auth is resolving the session, show a full-page spinner.
  // This prevents NotFound from rendering before auth check completes.
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-muted-foreground text-sm">Loading…</div>
      </div>
    );
  }

  // Not loading, but no user: redirect to auth/login.
  if (!user) {
    console.debug("[RouteGuard] No user → redirecting to /auth");
    return <Navigate to="/auth" replace state={{ from: location }} />;
  }

  // Check role if required
  if (requiredRole) {
    const isAdmin = profile?.is_admin || profile?.role === 'admin';
    const isBusiness = profile?.is_business_owner || profile?.role === 'business';
    
    let hasRequiredRole = false;
    
    if (requiredRole === 'admin') {
      hasRequiredRole = isAdmin;
    } else if (requiredRole === 'business') {
      hasRequiredRole = isBusiness;
    } else {
      // 'user' role - any authenticated user
      hasRequiredRole = true;
    }

    if (!hasRequiredRole) {
      console.debug("[RouteGuard] User lacks required role → redirecting to /auth");
      return <Navigate to="/auth" replace state={{ from: location }} />;
    }
  }

  // Auth ready and user present (with correct role if required) → allow route.
  console.debug("[RouteGuard] Auth OK → rendering children");
  return <>{children}</>;
};

export default RouteGuard;
