import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PendingCountBadge from './PendingCountBadge';
import { fetchBusinesses, BusinessRow } from '@/lib/business-api';

interface Business extends BusinessRow {
  description?: string | null;
  address?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  updated_at?: string;
  owner_id?: string | null;
}

interface Category {
  value: string;
  label: string;
}

// Data sanitization helper - ensures all business fields have safe defaults
const sanitizeBusiness = (raw: any): Business | null => {
  try {
    // Validate required fields
    if (!raw || typeof raw !== 'object') {
      console.debug('🔍 [sanitizeBusiness] Invalid raw data:', raw);
      return null;
    }

    if (!raw.id || typeof raw.id !== 'string') {
      console.debug('🔍 [sanitizeBusiness] Missing or invalid id:', raw);
      return null;
    }

    // Sanitize all fields with safe defaults
    const sanitized: Business = {
      id: String(raw.id),
      name: raw.name ? String(raw.name).trim() : 'Unnamed Business',
      description: raw.description ? String(raw.description).trim() : '',
      address: raw.address ? String(raw.address).trim() : '',
      island: raw.island ? String(raw.island).trim() : 'Unknown',
      category: raw.category ? String(raw.category).trim() : 'uncategorized',
      status: raw.status && ['active', 'pending', 'suspended', 'closed', 'draft'].includes(String(raw.status))
        ? String(raw.status)
        : 'pending',
      created_at: raw.created_at ? String(raw.created_at) : new Date().toISOString(),
      updated_at: raw.updated_at ? String(raw.updated_at) : new Date().toISOString(),
      owner_id: raw.owner_id ? String(raw.owner_id) : null,
      phone: raw.phone ? String(raw.phone).trim() : null,
      email: raw.email ? String(raw.email).trim() : null,
      website: raw.website ? String(raw.website).trim() : null,
    };

    // Log if we had to fix any fields
    const fixes: string[] = [];
    if (!raw.name || raw.name !== sanitized.name) fixes.push('name');
    if (!raw.description || raw.description !== sanitized.description) fixes.push('description');
    if (!raw.category || raw.category !== sanitized.category) fixes.push('category');
    if (!raw.status || raw.status !== sanitized.status) fixes.push('status');
    if (fixes.length > 0) {
      console.debug(`🔧 [sanitizeBusiness] Fixed fields for business ${sanitized.id}:`, fixes);
    }

    return sanitized;
  } catch (err) {
    console.error('❌ [sanitizeBusiness] Error sanitizing business:', err, raw);
    return null;
  }
};

const OptimizedBusinessManager: React.FC = () => {
  const { toast } = useToast();
  const navigate = useNavigate();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [islandFilter, setIslandFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalBusinesses, setTotalBusinesses] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const USERS_PER_PAGE = 10;
  const islands = ["Mahé", "Praslin", "La Digue", "Silhouette", "Curieuse", "Bird", "Denis"];

  const loadBusinesses = async () => {
    console.debug("[OptimizedBusinessManager] Loading businesses...", {
      searchTerm,
      statusFilter,
      categoryFilter,
      islandFilter,
      currentPage
    });
    
    setLoading(true);
    setError(null);
    
    try {
      const { businesses, total } = await fetchBusinesses({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? statusFilter : undefined,
        category: categoryFilter !== "all" ? categoryFilter : undefined,
        island: islandFilter !== "all" ? islandFilter : undefined,
        page: currentPage,
        pageSize: USERS_PER_PAGE,
      });
      
      console.debug("[OptimizedBusinessManager] Businesses loaded:", {
        count: businesses.length,
        total
      });
      
      setBusinesses(businesses as Business[]);
      setTotalBusinesses(total);
      setTotalPages(Math.ceil(total / USERS_PER_PAGE));
    } catch (err: any) {
      console.error("[OptimizedBusinessManager] Failed to load businesses", err);
      setError("Failed to load businesses. Please try again.");
      setBusinesses([]);
      setTotalBusinesses(0);
      toast({
        title: "Error",
        description: err?.message || "Failed to load businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      console.debug("[OptimizedBusinessManager] Loading complete");
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select(`
          id,
          name,
          slug,
          description,
          is_active
        `)
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      
      const categoryOptions = data?.map(cat => ({
        value: cat.slug,
        label: cat.name
      })) || [];
      
      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleStatusChange = async (businessId: string, newStatus: string) => {
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('businesses')
        .update({ status: newStatus })
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business status updated successfully",
      });

      loadBusinesses();
    } catch (error: any) {
      console.error("Error updating business status:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBusiness = async (businessId: string) => {
    // Confirm deletion
    if (!confirm('Are you sure you want to delete this business? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      
      const { data, error, status } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId)
        .select(); // Return deleted row to verify deletion

      // Log detailed error information
      if (error) {
        console.error('❌ OptimizedBusinessManager: Failed to delete business', {
          businessId,
          error,
          message: error.message,
          details: error.details,
          hint: error.hint,
          code: error.code,
          status
        });
        
        // Check if it's an RLS policy issue
        if (error.code === '42501' || error.message?.includes('permission') || error.message?.includes('policy')) {
          throw new Error('You do not have permission to delete this business. Only admins or business owners can delete businesses.');
        }
        
        throw new Error(error.message || 'Failed to delete business');
      }

      // Verify deletion
      if (!data || data.length === 0) {
        console.warn('⚠️ OptimizedBusinessManager: Delete returned no data, business may not exist', { businessId });
        toast({
          title: "Warning",
          description: "Business may have already been deleted or does not exist.",
          variant: "default",
        });
      } else {
        toast({
          title: "Success",
          description: "Business deleted successfully",
        });
      }

      // Refresh the list
      await loadBusinesses();
    } catch (error: any) {
      console.error("❌ OptimizedBusinessManager: Error deleting business", {
        businessId,
        error,
        message: error?.message,
        stack: error?.stack
      });
      
      toast({
        title: "Failed to Delete Business",
        description: error?.message || "An error occurred while deleting the business. Please try again.",
        variant: "destructive",
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (searchTerm) {
      // Debounce search
      const timeoutId = setTimeout(() => {
        loadBusinesses();
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      loadBusinesses();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentPage, statusFilter, categoryFilter, islandFilter, searchTerm]);

  useEffect(() => {
    fetchCategories();
  }, []);

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="w-5 h-5 text-destructive" />
            Business Management Error
          </CardTitle>
          <CardDescription>
            Failed to load businesses. Check the browser console for detailed error information.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-4">
            <p className="text-destructive font-medium mb-2">Error Details:</p>
            <p className="text-sm text-muted-foreground">{error}</p>
            <p className="text-xs text-muted-foreground mt-2">
              Open the browser console (F12) to see full error details including Supabase error codes and hints.
            </p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => {
              setError(null);
              loadBusinesses();
            }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => {
              setError(null);
              setCurrentPage(1);
              loadBusinesses();
            }} variant="outline">
              Reset & Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Business Management</CardTitle>
              <CardDescription>
                Manage business listings and approvals ({totalBusinesses} total businesses)
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => navigate('/admin/businesses/pending')}>
                <CheckCircle className="w-4 h-4 mr-2" />
                Pending Approvals
                <PendingCountBadge className="ml-2" />
              </Button>
              <Button onClick={() => navigate('/admin/businesses/create')}>
                <Plus className="w-4 h-4 mr-2" />
                Create Business
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4 flex-wrap">
            <div className="flex-1 min-w-64">
              <Input
                placeholder="Search businesses..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="suspended">Suspended</SelectItem>
                <SelectItem value="closed">Closed</SelectItem>
              </SelectContent>
            </Select>
            <Select value={categoryFilter} onValueChange={setCategoryFilter}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={islandFilter} onValueChange={setIslandFilter}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Island" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Islands</SelectItem>
                {islands.map((island) => (
                  <SelectItem key={island} value={island}>
                    {island}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Error State */}
          {error && (
            <Alert variant="destructive" className="mb-4">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Businesses Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              <span>Loading businesses...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-destructive" />
              <p className="text-destructive font-medium mb-2">Failed to load businesses</p>
              <p className="text-sm text-muted-foreground mb-4">{error}</p>
              <Button onClick={loadBusinesses} variant="outline">
                <RefreshCw className="w-4 h-4 mr-2" />
                Try Again
              </Button>
            </div>
          ) : businesses.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">No businesses found</p>
              {searchTerm || statusFilter !== "all" || categoryFilter !== "all" || islandFilter !== "all" ? (
                <p className="text-sm text-muted-foreground mt-2">
                  Try adjusting your filters or search term.
                </p>
              ) : null}
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.map((business) => {
                // Safe date parsing
                let createdDate = 'Unknown';
                try {
                  if (business.created_at) {
                    createdDate = new Date(business.created_at).toLocaleDateString();
                  }
                } catch (e) {
                  console.debug('🔍 [render] Invalid date for business:', business.id, business.created_at);
                }

                return (
                  <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium">{business.name || 'Unnamed Business'}</h3>
                        <Badge className={
                          business.status === 'active' ? 'bg-green-500 text-white' :
                          business.status === 'pending' ? 'bg-yellow-400 text-black' :
                          business.status === 'suspended' ? 'bg-red-500 text-white' :
                          business.status === 'draft' ? 'bg-gray-300 text-gray-700' :
                          'bg-gray-300 text-gray-700'
                        }>
                          {business.status || 'pending'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {business.description || 'No description available'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {business.address || 'No address'}, {business.island || 'Unknown'} • {business.category || 'uncategorized'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Created: {createdDate}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <Select 
                        value={business.status} 
                        onValueChange={(value) => handleStatusChange(business.id, value)}
                      >
                        <SelectTrigger className="w-32">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pending">Pending</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="suspended">Suspended</SelectItem>
                          <SelectItem value="closed">Closed</SelectItem>
                        </SelectContent>
                      </Select>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/business/${business.id}`)}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => navigate(`/admin/businesses/edit/${business.id}`)}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleDeleteBusiness(business.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">
                Page {currentPage} of {totalPages}
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setCurrentPage(prev => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default OptimizedBusinessManager;
