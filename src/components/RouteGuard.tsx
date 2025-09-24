import React, { useEffect, useState } from 'react';
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

const RouteGuard: React.FC<RouteGuardProps> = ({ 
  children, 
  requiredRole, 
  requireActive = true 
}) => {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isActive, setIsActive] = useState<boolean>(true);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkUserRole = async () => {
      if (authLoading) return;
      
      if (!user) {
        setLoading(false);
        return;
      }

      try {
        const { data: profile, error } = await supabase
          .from('profiles')
          .select('role, is_admin, is_business_owner')
          .eq('user_id', user.id)
          .single();

        if (error) {
          console.error('Error fetching user profile:', error);
          setUserRole('user');
          setIsActive(true);
        } else {
          // Determine role based on existing schema
          let role = 'user';
          if (profile?.is_admin) {
            role = 'admin';
          } else if (profile?.is_business_owner) {
            role = 'business';
          } else if (profile?.role) {
            role = profile.role;
          }
          setUserRole(role);
          setIsActive(true); // Default to active
        }
      } catch (error) {
        console.error('Error checking user role:', error);
        setUserRole('user');
        setIsActive(true);
      } finally {
        setLoading(false);
      }
    };

    checkUserRole();
  }, [user, authLoading]);

  // Show loading state
  if (authLoading || loading) {
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

  // Check if user is active
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
  }

  return <>{children}</>;
};

const checkRolePermission = (userRole: string | null, requiredRole: string): boolean => {
  if (!userRole) return false;
  
  const roleHierarchy = {
    'user': 1,
    'business': 2,
    'admin': 3
  };
  
  const userLevel = roleHierarchy[userRole as keyof typeof roleHierarchy] || 0;
  const requiredLevel = roleHierarchy[requiredRole as keyof typeof roleHierarchy] || 0;
  
  return userLevel >= requiredLevel;
};

export default RouteGuard;
