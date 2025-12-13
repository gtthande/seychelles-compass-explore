import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import StatusBadge from '@/components/ui/StatusBadge';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle, 
  FileText, 
  Building, 
  User,
  Mail,
  Phone,
  MapPin,
  Globe,
  Star,
  Eye,
  Edit,
  Trash2
} from 'lucide-react';

interface Business {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  category?: { id: string; title: string; slug: string } | null;
  is_active: boolean;
  is_verified: boolean;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  verification_notes?: string;
  verification_date?: string;
  verified_by?: string;
  // Computed status for UI (derived from is_active and is_verified)
  status?: 'pending' | 'active' | 'suspended' | 'closed';
}

interface VerificationAction {
  businessId: string;
  action: 'approve' | 'reject' | 'request_changes'; // UI action names - maps to status: 'active' | 'suspended'
  notes: string;
  status: 'active' | 'suspended' | 'pending' | 'closed'; // Valid business_status enum values
}

const BusinessVerificationWorkflow: React.FC = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [verificationNotes, setVerificationNotes] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchBusinesses();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, searchTerm, statusFilter]);

  const fetchBusinesses = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          title,
          description,
          category_id,
          is_active,
          is_verified,
          phone,
          email,
          website,
          address,
          latitude,
          longitude,
          created_at,
          updated_at,
          owner_id,
          categories (id, title, slug),
          profiles!businesses_owner_id_fkey (
            id,
            full_name,
            email,
            phone
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      // Map data to include computed status
      const businessesWithStatus = (data || []).map((b: any) => ({
        ...b,
        status: !b.is_active ? 'pending' : b.is_verified ? 'active' : 'pending',
        category: b.categories?.title || null
      }));
      setBusinesses(businessesWithStatus);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to fetch businesses",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = businesses;

    if (searchTerm) {
      filtered = filtered.filter(business =>
        business.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (business.description && business.description.toLowerCase().includes(searchTerm.toLowerCase())) ||
        (business.categories?.title && business.categories.title.toLowerCase().includes(searchTerm.toLowerCase()))
      );
    }

    if (statusFilter !== 'all') {
      filtered = filtered.filter(business => business.status === statusFilter);
    }

    setFilteredBusinesses(filtered);
  };

  const handleVerificationAction = async (action: VerificationAction) => {
    try {
      // Map status to is_active and is_verified
      const updateData: any = {
        updated_at: new Date().toISOString()
      };
      
      if (action.status === 'active') {
        updateData.is_active = true;
        updateData.is_verified = true;
      } else if (action.status === 'suspended') {
        updateData.is_active = false;
        updateData.is_verified = false;
      } else if (action.status === 'pending') {
        updateData.is_active = false;
        updateData.is_verified = false;
      } else if (action.status === 'closed') {
        updateData.is_active = false;
      }
      
      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', action.businessId);

      if (error) throw error;

      const actionMessage = action.action === 'approve' 
        ? 'activated' 
        : action.action === 'reject' 
        ? 'suspended' 
        : 'updated';
      
      toast({
        title: "Success",
        description: `Business ${actionMessage} successfully`,
      });

      // Refresh data
      fetchBusinesses();
      setSelectedBusiness(null);
      setVerificationNotes('');
    } catch (error) {
      console.error('Error updating business:', error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  const getStatusCounts = () => {
    const counts = {
      all: businesses.length,
      pending: businesses.filter(b => !b.is_active || (!b.is_verified && b.is_active)).length,
      active: businesses.filter(b => b.is_active && b.is_verified).length,
      suspended: businesses.filter(b => !b.is_active && b.is_verified === false).length,
      closed: businesses.filter(b => !b.is_active).length,
    };
    return counts;
  };

  const statusCounts = getStatusCounts();

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Verification Workflow</CardTitle>
          <CardDescription>Loading businesses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-3/4"></div>
            <div className="h-4 bg-muted rounded w-1/2"></div>
            <div className="h-4 bg-muted rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Verification Workflow
          </CardTitle>
          <CardDescription>
            Review and approve business listings for the Seychelles Compass platform
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            <div className="text-center p-4 bg-muted rounded-lg">
              <div className="text-2xl font-bold">{statusCounts.all}</div>
              <div className="text-sm text-muted-foreground">Total</div>
            </div>
            <div className="text-center p-4 bg-yellow-50 rounded-lg">
              <div className="text-2xl font-bold text-yellow-600">{statusCounts.pending}</div>
              <div className="text-sm text-muted-foreground">Pending</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{statusCounts.active}</div>
              <div className="text-sm text-muted-foreground">Active</div>
            </div>
            <div className="text-center p-4 bg-red-50 rounded-lg">
              <div className="text-2xl font-bold text-red-600">{statusCounts.suspended}</div>
              <div className="text-sm text-muted-foreground">Suspended</div>
            </div>
            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="text-2xl font-bold text-gray-600">{statusCounts.closed}</div>
              <div className="text-sm text-muted-foreground">Closed</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>Filters & Search</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <input
                type="text"
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border rounded-md"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Statuses</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Business List */}
      <div className="space-y-4">
        {filteredBusinesses.map((business) => (
          <Card key={business.id} className="hover:shadow-md transition-shadow">
            <CardContent className="p-6">
              <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                <div className="flex-1 space-y-3">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-lg">{business.title}</h3>
                    <StatusBadge status={business.status} />
                    {business.featured && (
                      <Badge variant="secondary" className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        Featured
                      </Badge>
                    )}
                    {business.verified && (
                      <Badge variant="outline" className="flex items-center gap-1">
                        <CheckCircle className="w-3 h-3" />
                        Verified
                      </Badge>
                    )}
                  </div>

                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {business.description}
                  </p>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-muted-foreground" />
                        <span>{business.address || 'No address'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4 text-muted-foreground" />
                        <span>{business.phone || 'No phone'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Mail className="w-4 h-4 text-muted-foreground" />
                        <span>{business.email || 'No email'}</span>
                      </div>
                      {business.website && (
                        <div className="flex items-center gap-2">
                          <Globe className="w-4 h-4 text-muted-foreground" />
                          <a href={business.website} target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">
                            {business.website}
                          </a>
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="text-muted-foreground">
                        <strong>Category:</strong> {business.categories?.title || 'N/A'}
                      </div>
                      <div className="text-muted-foreground">
                        <strong>Created:</strong> {new Date(business.created_at).toLocaleDateString()}
                      </div>
                      {business.verification_notes && (
                        <div className="text-muted-foreground">
                          <strong>Verification Notes:</strong> {business.verification_notes}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedBusiness(business)}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Review
                  </Button>
                  
                  {(!business.is_active || !business.is_verified) && (
                    <div className="flex gap-2">
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => handleVerificationAction({
                          businessId: business.id,
                          action: 'approve',
                          notes: verificationNotes,
                          status: 'active'
                        })}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleVerificationAction({
                          businessId: business.id,
                          action: 'reject',
                          notes: verificationNotes,
                          status: 'suspended'
                        })}
                      >
                        <XCircle className="w-4 h-4 mr-2" />
                        Reject
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}

        {filteredBusinesses.length === 0 && (
          <Card>
            <CardContent className="text-center py-8">
              <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
              <p className="text-muted-foreground">
                Try adjusting your search criteria or filters.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Verification Modal */}
      {selectedBusiness && (
        <Card className="fixed inset-4 z-50 bg-background border-2">
          <CardHeader>
            <CardTitle>Review Business: {selectedBusiness.title}</CardTitle>
            <CardDescription>
              Review business details and make verification decision
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <h4 className="font-semibold mb-2">Business Information</h4>
                <div className="space-y-2 text-sm">
                  <div><strong>Name:</strong> {selectedBusiness.title}</div>
                  <div><strong>Category:</strong> {selectedBusiness.category || 'N/A'}</div>
                  <div><strong>Address:</strong> {selectedBusiness.address || 'N/A'}</div>
                  <div><strong>Phone:</strong> {selectedBusiness.phone}</div>
                  <div><strong>Email:</strong> {selectedBusiness.email}</div>
                </div>
              </div>
              <div>
                <h4 className="font-semibold mb-2">Description</h4>
                <p className="text-sm text-muted-foreground">
                  {selectedBusiness.description}
                </p>
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">
                Verification Notes
              </label>
              <Textarea
                placeholder="Add notes about your verification decision..."
                value={verificationNotes}
                onChange={(e) => setVerificationNotes(e.target.value)}
                rows={3}
              />
            </div>

            <div className="flex justify-end gap-2">
              <Button
                variant="outline"
                onClick={() => setSelectedBusiness(null)}
              >
                Cancel
              </Button>
              <Button
                className="bg-green-600 hover:bg-green-700"
                onClick={() => handleVerificationAction({
                  businessId: selectedBusiness.id,
                  action: 'approve',
                  notes: verificationNotes,
                  status: 'active'
                })}
              >
                <CheckCircle className="w-4 h-4 mr-2" />
                Approve
              </Button>
              <Button
                variant="destructive"
                onClick={() => handleVerificationAction({
                  businessId: selectedBusiness.id,
                  action: 'reject',
                  notes: verificationNotes,
                  status: 'suspended'
                })}
              >
                <XCircle className="w-4 h-4 mr-2" />
                Reject
              </Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default BusinessVerificationWorkflow;
