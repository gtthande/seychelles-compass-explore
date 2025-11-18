import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Building, CheckCircle, XCircle, Eye, Search, ArrowLeft, Bell } from 'lucide-react';
import { formatDate } from '@/lib/date-utils';
import { subscribeToPendingBusinesses, approveBusiness, rejectBusiness } from '@/lib/admin-utils';

interface PendingBusiness {
  id: string;
  name: string;
  description: string | null;
  category: string;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  island: string | null;
  logo_url: string | null;
  created_at: string;
  owner_id: string;
  profiles?: {
    full_name: string | null;
    email: string | null;
  };
}

const PendingBusinesses = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { isAdmin } = useAuth();
  const [businesses, setBusinesses] = useState<PendingBusiness[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<PendingBusiness[]>([]);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (!isAdmin) {
      navigate('/admin');
      return;
    }
    fetchPendingBusinesses();

    // Subscribe to realtime updates for pending businesses
    const unsubscribe = subscribeToPendingBusinesses(
      (newBusiness) => {
        // New pending business added
        setBusinesses(prev => [newBusiness, ...prev]);
        setFilteredBusinesses(prev => [newBusiness, ...prev]);
        toast({
          title: "New Pending Business",
          description: `${newBusiness.name} is awaiting approval`,
        });
      },
      (updatedBusiness) => {
        // Pending business updated
        setBusinesses(prev => 
          prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b)
        );
        setFilteredBusinesses(prev => 
          prev.map(b => b.id === updatedBusiness.id ? updatedBusiness : b)
        );
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAdmin, navigate, toast]);

  useEffect(() => {
    if (searchTerm) {
      const filtered = businesses.filter(business =>
        business.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
        business.email?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredBusinesses(filtered);
    } else {
      setFilteredBusinesses(businesses);
    }
  }, [searchTerm, businesses]);

  const fetchPendingBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          name,
          description,
          category,
          phone,
          email,
          website,
          address,
          island,
          logo_url,
          created_at,
          owner_id,
          profiles:owner_id (
            full_name,
            email
          )
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setBusinesses(data || []);
      setFilteredBusinesses(data || []);
    } catch (error: any) {
      console.error('Error fetching pending businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load pending businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (businessId: string, businessName: string) => {
    setApproving(businessId);
    try {
      const result = await approveBusiness(businessId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to approve business');
      }

      toast({
        title: "Success",
        description: `${businessName} has been activated and is now visible to the public.`,
      });

      // Remove from list
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      setFilteredBusinesses(prev => prev.filter(b => b.id !== businessId));
    } catch (error: any) {
      console.error('Error approving business:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to approve business",
        variant: "destructive",
      });
    } finally {
      setApproving(null);
    }
  };

  const handleReject = async (businessId: string, businessName: string) => {
    if (!confirm(`Are you sure you want to reject ${businessName}? This action cannot be undone.`)) {
      return;
    }

    try {
      const result = await rejectBusiness(businessId);
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to reject business');
      }

      toast({
        title: "Business Suspended",
        description: `${businessName} has been suspended.`,
      });

      // Remove from list
      setBusinesses(prev => prev.filter(b => b.id !== businessId));
      setFilteredBusinesses(prev => prev.filter(b => b.id !== businessId));
    } catch (error: any) {
      console.error('Error rejecting business:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to reject business",
        variant: "destructive",
      });
    }
  };

  const handleView = (businessId: string) => {
    navigate(`/admin/businesses/edit/${businessId}`);
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="flex items-center justify-center h-64">
          <div className="text-center space-y-4">
            <Loader2 className="w-8 h-8 animate-spin mx-auto text-primary" />
            <p className="text-muted-foreground">Loading pending businesses...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="outline" onClick={() => navigate('/admin')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Admin
          </Button>
          <div>
            <h1 className="text-2xl font-bold">Pending Business Approvals</h1>
            <p className="text-muted-foreground">
              Review and approve business registration requests
            </p>
          </div>
        </div>
      </div>

      {/* Search */}
      <Card>
        <CardContent className="pt-6">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="Search businesses by name, category, or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardContent>
      </Card>

      {/* Pending Businesses List */}
      {filteredBusinesses.length === 0 ? (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center py-12">
              <Building className="w-16 h-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No Pending Businesses</h3>
              <p className="text-muted-foreground">
                {searchTerm ? 'No businesses match your search.' : 'All business registrations have been reviewed.'}
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredBusinesses.map((business) => (
            <Card key={business.id}>
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-3 flex-1">
                    {business.logo_url && (
                      <img
                        src={business.logo_url}
                        alt={business.name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <CardTitle className="text-lg truncate">{business.name}</CardTitle>
                      <Badge variant="secondary" className="mt-1">
                        {business.category}
                      </Badge>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {business.description && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {business.description}
                  </p>
                )}

                <div className="space-y-2 text-sm">
                  {business.email && (
                    <div>
                      <span className="font-medium">Email:</span> {business.email}
                    </div>
                  )}
                  {business.phone && (
                    <div>
                      <span className="font-medium">Phone:</span> {business.phone}
                    </div>
                  )}
                  {business.address && (
                    <div>
                      <span className="font-medium">Address:</span> {business.address}
                    </div>
                  )}
                  {business.island && (
                    <div>
                      <span className="font-medium">Island:</span> {business.island}
                    </div>
                  )}
                  {business.profiles && (
                    <div>
                      <span className="font-medium">Submitted by:</span>{' '}
                      {business.profiles.full_name || business.profiles.email || 'Unknown'}
                    </div>
                  )}
                  <div className="text-xs text-muted-foreground">
                    Submitted: {formatDate(business.created_at, 'MMM dd, yyyy')}
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleView(business.id)}
                    className="flex-1"
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    View
                  </Button>
                  <Button
                    variant="default"
                    size="sm"
                    onClick={() => handleApprove(business.id, business.name)}
                    disabled={approving === business.id}
                    className="flex-1"
                  >
                    {approving === business.id ? (
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <CheckCircle className="w-4 h-4 mr-2" />
                    )}
                    Approve
                  </Button>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => handleReject(business.id, business.name)}
                    className="flex-1"
                  >
                    <XCircle className="w-4 h-4 mr-2" />
                    Reject
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Summary */}
      {filteredBusinesses.length > 0 && (
        <Card>
          <CardContent className="pt-6">
            <div className="text-center text-sm text-muted-foreground">
              Showing {filteredBusinesses.length} of {businesses.length} pending business{businesses.length !== 1 ? 'es' : ''}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default PendingBusinesses;

