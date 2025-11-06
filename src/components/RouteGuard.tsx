import React from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Shield, AlertCircle } from 'lucide-react';

interface RouteGuardProps {
  children: React.ReactNode;
  requiredRole?: 'admin' | 'business' | 'user';
  requireActive?: boolean;
}

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  requireActive = true 
}) => {
  const { user, loading: authLoading, isAdmin, isBusiness, profile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Determine user role from useAuth hook
  const userRole = React.useMemo(() => {
    if (isAdmin) return 'admin';
    if (isBusiness) return 'business';
    return 'user';
  }, [isAdmin, isBusiness]);

  // Show loading state while auth is loading or profile is not yet loaded
  if (authLoading || (user && !profile && requiredRole)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user) {
    navigate('/auth', { state: { from: location.pathname } });
    return null;
  }

  // Check if user is active (using profile data from useAuth)
  const isActive = profile?.is_active !== false; // Default to true if not set
  if (requireActive && !isActive) {
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
    const hasPermission = checkRolePermission(userRole, requiredRole);
    
    if (!hasPermission) {
      // Log debug information
      console.log('RouteGuard: Access denied', {
        userRole,
        requiredRole,
        isAdmin,
        isBusiness,
        profile: profile ? { is_admin: profile.is_admin, role: profile.role } : null,
        userId: user?.id
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
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <Button asChild variant="outline" className="w-full">
                <a href="/">Return Home</a>
              </Button>
              {requiredRole === 'admin' && (
                <p className="text-xs text-muted-foreground text-center">
                  Admin access requires <code>is_admin = true</code> or <code>role = 'admin'</code> in your profile.
                </p>
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
    console.warn('RouteGuard: userRole is null or undefined');
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
    console.warn('RouteGuard: Permission denied', {
      userRole,
      requiredRole,
      userLevel,
      requiredLevel
    });
  }
  
  return hasPermission;
};

export default RouteGuard;
