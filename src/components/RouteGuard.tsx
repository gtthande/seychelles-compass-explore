import React, { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";

type RouteGuardProps = {
  children: React.ReactNode;
};

/**
 * Minimal, stable route guard.
 *
 * - Uses ONLY Supabase session (no profile fetching).
 * - Waits for getSession() to complete.
 * - Cannot get stuck: when loading is false we always either
 *   (a) redirect to /auth or (b) render children.
 */
const RouteGuard: React.FC<RouteGuardProps> = ({ children }) => {
  const location = useLocation();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    // Get session directly from Supabase
    supabase.auth.getSession().then(({ data: { session }, error }) => {
      if (!mounted) return;

      if (error) {
        console.error("[RouteGuard] Session error:", error);
        setUser(null);
        setLoading(false);
        return;
      }

      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => {
      mounted = false;
      subscription.unsubscribe();
    };
  }, []);

  // Debug tracing so we can see state changes in the console.
  console.debug("[RouteGuard] state", {
    path: location.pathname,
    loading,
    userPresent: !!user,
  });

  // While Supabase auth is resolving the session, show a full-page spinner.
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

  // Auth ready and user present → allow route.
  console.debug("[RouteGuard] Auth OK → rendering children");
  return <>{children}</>;
};

export default RouteGuard;
