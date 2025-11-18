import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business' | 'user';
  requireActive?: boolean;
}

// Static loading component - no hooks
const FullPageSpinner = () => (
  <div className="min-h-screen flex items-center justify-center">
    <div className="text-center space-y-4">
      <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
      <p className="text-sm text-muted-foreground">Loading...</p>
    </div>
  </div>
);

// ProfileGate component - handles profile-dependent logic after auth is ready
interface ProfileGateProps {
  user: any;
  profile: any;
  isAdmin: boolean;
  isBusiness: boolean;
  requiredRole?: 'admin' | 'business' | 'user';
  requireActive?: boolean;
  children: React.ReactNode;
  navigate: (path: string, state?: any) => void;
  location: any;
}

const ProfileGate: React.FC<ProfileGateProps> = ({
  user,
  profile,
  isAdmin,
  isBusiness,
  requiredRole,
  requireActive = true,
  children,
  navigate,
  location
}) => {
  // All hooks are consistently called here - no conditional hooks
  // Hook order: useState → useEffect (stable, always called)
  const [isCreatingProfile, setIsCreatingProfile] = React.useState(false);
  const [isFetchingProfile, setIsFetchingProfile] = React.useState(false);
  const [profileCreationAttempted, setProfileCreationAttempted] = React.useState(false);
  const [fetchedProfile, setFetchedProfile] = React.useState<any>(null);
  
  // Determine default role based on requiredRole
  const defaultRole = React.useMemo(() => {
    if (requiredRole === 'admin') return 'admin';
    if (requiredRole === 'business') return 'business';
    return 'user';
  }, [requiredRole]);

  // Profile bootstrap: Auto-create profile if missing
  React.useEffect(() => {
    const bootstrapProfile = async () => {
      // Only bootstrap if: user exists, profile is null, and we haven't tried yet
      if (!user || profile || profileCreationAttempted || isCreatingProfile) {
        return;
      }

      console.debug('🔄 ProfileGate: Profile missing, starting auto-creation', {
        userId: user.id,
        email: user.email,
        requiredRole,
        defaultRole
      });

      setIsCreatingProfile(true);
      setProfileCreationAttempted(true);

      try {
        // For admin routes, create with admin role and is_active=true
        const profileData: any = {
          email: user.email || '',
          role: defaultRole,
          is_active: true
        };

        // Add id or user_id based on schema
        // Try id first (most common)
        profileData.id = user.id;
        profileData.user_id = user.id;

        // Set admin flags for admin routes
        if (requiredRole === 'admin') {
          profileData.is_admin = true;
          profileData.role = 'admin';
        } else if (requiredRole === 'business') {
          profileData.is_business_owner = true;
          profileData.role = 'business';
        }

        // Try creating profile
        let { data: newProfile, error: createError } = await supabase
          .from('profiles')
          .insert(profileData)
          .select()
          .single();

        // If that fails, try with minimal fields
        if (createError) {
          console.debug('⚠️ ProfileGate: First attempt failed, trying minimal fields...', createError);
          const minimalData: any = {
            id: user.id,
            email: user.email || '',
            role: defaultRole,
            is_active: true
          };
          
          if (requiredRole === 'admin') {
            minimalData.is_admin = true;
            minimalData.role = 'admin';
          }

          const retryResult = await supabase
            .from('profiles')
            .insert(minimalData)
            .select()
            .single();
          
          newProfile = retryResult.data;
          createError = retryResult.error;
        }

        // If still fails, try with just user_id
        if (createError) {
          console.debug('⚠️ ProfileGate: Retrying with user_id only...', createError);
          const userIdData: any = {
            user_id: user.id,
            email: user.email || '',
            role: defaultRole,
            is_active: true
          };
          
          if (requiredRole === 'admin') {
            userIdData.is_admin = true;
            userIdData.role = 'admin';
          }

          const retryResult = await supabase
            .from('profiles')
            .insert(userIdData)
            .select()
            .single();
          
          newProfile = retryResult.data;
          createError = retryResult.error;
        }

        if (createError) {
          console.error('❌ ProfileGate: Profile creation failed after all attempts', {
            code: createError.code,
            message: createError.message,
            details: createError.details,
            hint: createError.hint
          });
          setIsCreatingProfile(false);
          return;
        }

        if (newProfile) {
          console.debug('✅ ProfileGate: Profile created successfully', {
            profileId: newProfile.id,
            role: newProfile.role,
            isAdmin: newProfile.is_admin,
            isActive: newProfile.is_active
          });
          
          // Re-fetch the profile to ensure it's fully loaded
          setIsCreatingProfile(false);
          setIsFetchingProfile(true);
          
          // Try fetching by id first
          let { data: refetchedProfile, error: fetchError } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', user.id)
            .maybeSingle();

          // If not found by id, try user_id
          if ((fetchError && fetchError.code === 'PGRST116') || !refetchedProfile) {
            const { data: altProfile } = await supabase
              .from('profiles')
              .select('*')
              .eq('user_id', user.id)
              .maybeSingle();
            
            if (altProfile) {
              refetchedProfile = altProfile;
            }
          }
          
          // Use refetched profile if available, otherwise use created one
          if (refetchedProfile) {
            setFetchedProfile(refetchedProfile);
            console.debug('✅ ProfileGate: Profile re-fetched successfully');
          } else {
            setFetchedProfile(newProfile);
            console.debug('⚠️ ProfileGate: Using created profile (re-fetch returned no data)');
          }
          
          setIsFetchingProfile(false);
        } else {
          console.error('❌ ProfileGate: Profile creation returned no data');
          setIsCreatingProfile(false);
        }
      } catch (error: any) {
        console.error('❌ ProfileGate: Exception during profile creation', {
          message: error.message,
          stack: error.stack
        });
        setIsCreatingProfile(false);
        setIsFetchingProfile(false);
      }
    };

    bootstrapProfile();
  }, [user, profile, profileCreationAttempted, isCreatingProfile, requiredRole, defaultRole]);

  // Use fetched profile if available, otherwise use passed profile
  const activeProfile = fetchedProfile || profile;

  // Determine user role
  const userRole = React.useMemo(() => {
    if (activeProfile?.is_admin || activeProfile?.role === 'admin') return 'admin';
    if (activeProfile?.is_business_owner || activeProfile?.role === 'business') return 'business';
    return activeProfile?.role || 'user';
  }, [activeProfile]);

  // Diagnostic logging
  React.useEffect(() => {
    if (user) {
      console.debug('🔍 ProfileGate: Session loaded', {
        userId: user.id,
        email: user.email,
        hasProfile: !!activeProfile
      });
    }
  }, [user, activeProfile]);

  React.useEffect(() => {
    if (user && !activeProfile && !profileCreationAttempted) {
      console.debug('🔍 ProfileGate: Profile fetch starting', {
        userId: user.id
      });
    }
  }, [user, activeProfile, profileCreationAttempted]);

  React.useEffect(() => {
    if (activeProfile) {
      console.debug('✅ ProfileGate: Final profile ready', {
        profileId: activeProfile.id,
        role: activeProfile.role,
        isAdmin: activeProfile.is_admin,
        isActive: activeProfile.is_active
      });
    }
  }, [activeProfile]);

  // Show loading state while creating profile
  if (isCreatingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Creating profile...</p>
        </div>
      </div>
    );
  }

  // Show loading state while re-fetching profile
  if (isFetchingProfile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary mx-auto"></div>
          <p className="text-sm text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  // Check if user is active (using profile data)
  // Only check if we have a profile - if no profile and no required role, allow through
  const userIsActive = activeProfile ? (activeProfile.is_active !== false) : true;
  if (requireActive && activeProfile && !userIsActive) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <Card className="w-full max-w-md">
          <CardHeader className="text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
              <AlertCircle className="w-8 h-8 text-destructive" />
            </div>
            <CardTitle>Account Deactivated</CardTitle>
            <CardDescription>
              Your account has been deactivated. Please contact an administrator.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button asChild variant="outline" className="w-full">
              <a href="/">Return Home</a>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Check role permissions
  if (requiredRole) {
    let hasPermission = false;
    
    // For admin routes, check isAdmin directly or if profile has admin role AND is_active
    if (requiredRole === 'admin') {
      const isAdminRole = activeProfile?.role === 'admin' || activeProfile?.is_admin === true;
      const isActive = activeProfile?.is_active !== false; // Default to true if not set
      hasPermission = (isAdmin || isAdminRole) && isActive;
    }
    // For business routes, check isBusiness directly
    else if (requiredRole === 'business') {
      hasPermission = isBusiness || 
                     activeProfile?.role === 'business' || 
                     activeProfile?.is_business_owner === true;
    }
    // For user routes, anyone authenticated can access
    else if (requiredRole === 'user') {
      hasPermission = true; // Any authenticated user
    }
    // Fallback to role hierarchy check
    else {
      hasPermission = checkRolePermission(userRole, requiredRole);
    }
    
    if (!hasPermission) {
      // Log detailed debug information
      console.error('❌ ProfileGate: Access denied', {
        requiredRole,
        userRole,
        isAdmin,
        isBusiness,
        profile: activeProfile ? {
          is_admin: activeProfile.is_admin,
          role: activeProfile.role,
          is_business_owner: activeProfile.is_business_owner,
          id: activeProfile.id
        } : null,
        userId: user?.id,
        email: user?.email,
        hasProfile: !!activeProfile
      });
      
      return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/10 flex items-center justify-center">
                <Shield className="w-8 h-8 text-destructive" />
              </div>
              <CardTitle>Access Denied</CardTitle>
              <CardDescription>
                You don't have permission to access this page. Required role: {requiredRole}
                {userRole && (
                  <span className="block mt-2 text-sm text-muted-foreground">
                    Your current role: {userRole}
                  </span>
                )}
                {requiredRole === 'admin' && activeProfile && (
                  <span className="block mt-2 text-xs text-muted-foreground">
                    Profile: is_admin={String(activeProfile.is_admin)}, role={activeProfile.role || 'none'}
                  </span>
                )}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <a href="/">Return Home</a>
              </Button>
              {requiredRole === 'admin' && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground text-center">
                    Admin access requires <code>is_admin = true</code> or <code>role = 'admin'</code> in your profile.
                  </p>
                  <p className="text-xs text-muted-foreground text-center">
                    Check the browser console (F12) for detailed debug information.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      );
    }
  }

  return <>{children}</>;
};

const checkRolePermission = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) {
    console.warn('ProfileGate: userRole is null or undefined');
    return false;
  }
  
  const roleHierarchy = {
    'user': 1,
    'business': 2,
    'admin': 3
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  const hasPermission = userLevel >= requiredLevel;
  
  if (!hasPermission) {
    console.warn('ProfileGate: Permission denied', {
      userRole,
      requiredRole,
      userLevel,
      requiredLevel
    });
  }
  
  return hasPermission;
};

// Main RouteGuard component - follows guard pattern to prevent hook order issues
const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  requireActive = true 
}) => {
  // CRITICAL: Only call useAuth hook - no other hooks until auth is ready
  const { user, profile, isAdmin, isBusiness, loading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Diagnostic logging
  React.useEffect(() => {
    console.debug('🔍 RouteGuard: Auth state', {
      hasUser: !!user,
      hasProfile: !!profile,
      loading,
      requiredRole
    });
  }, [user, profile, loading, requiredRole]);

  // GUARD PATTERN: If auth is not ready, return static component (no hooks)
  // This ensures hooks are never conditionally called
  if (loading) {
    return <FullPageSpinner />;
  }

  // Redirect to login if not authenticated
  if (!user) {
    console.debug('🔄 RouteGuard: No session, redirecting to /auth');
    navigate('/auth', { state: { from: location.pathname } });
    return null;
  }

  // Now it's safe to render ProfileGate which uses hooks consistently
  // All hooks in ProfileGate are always called in the same order
  return (
    <ProfileGate
      user={user}
      profile={profile}
      isAdmin={isAdmin}
      isBusiness={isBusiness}
      requiredRole={requiredRole}
      requireActive={requireActive}
      navigate={navigate}
      location={location}
    >
      {children}
    </ProfileGate>
  );
};

export default RouteGuard;
