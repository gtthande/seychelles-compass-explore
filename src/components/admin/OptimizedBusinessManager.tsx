import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCw, Plus, CheckCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import PendingCountBadge from './PendingCountBadge';

interface Business {
  id: string;
  name: string;
  description: string;
  address: string;
  island: string;
  category: string;
  status: string;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
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
  const [loading, setLoading] = useState(false);
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

  const fetchBusinesses = async (page: number = 1) => {
    const fetchStartTime = performance.now();
    console.debug('🔍 [fetchBusinesses] Starting fetch for page:', page);
    console.debug('🔍 [fetchBusinesses] Filters:', { statusFilter, categoryFilter, islandFilter, searchTerm });
    
    setLoading(true);
    setError(null);
    
    // Timeout protection - prevent infinite loading
    const timeoutId = setTimeout(() => {
      console.error('⏱️ [fetchBusinesses] Query timeout after 30 seconds');
      setError('Query timeout: The request took too long. Please try again.');
      setLoading(false);
      toast({
        title: "Timeout",
        description: "The request took too long. Please try again.",
        variant: "destructive",
      });
    }, 30000);
    
    try {
      // Get total count first (optimized)
      console.debug('🔍 [fetchBusinesses] Fetching total count...');
      const countQuery = supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true });
      
      const { count: totalCount, error: countError } = await countQuery;
      
      if (countError) {
        console.error('❌ [fetchBusinesses] Count query error:', {
          error: countError,
          message: countError.message,
          details: countError.details,
          hint: countError.hint,
          code: countError.code,
        });
        throw countError;
      }
      
      console.debug('🔍 [fetchBusinesses] Total count:', totalCount);
      setTotalBusinesses(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / USERS_PER_PAGE));

      // Get paginated businesses with specific fields
      const from = (page - 1) * USERS_PER_PAGE;
      const to = from + USERS_PER_PAGE - 1;

      console.debug('🔍 [fetchBusinesses] Building query with range:', { from, to });
      
      // CRITICAL: Select all required fields matching database schema
      // Use exact column names: latitude/longitude (NOT lat/lng/coords/location_lat/location_lng)
      let query = supabase
        .from('businesses')
        .select(`
          id,
          owner_id,
          name,
          description,
          category,
          status,
          phone,
          whatsapp,
          email,
          website,
          facebook_url,
          instagram_url,
          linkedin_url,
          youtube_url,
          address,
          latitude,
          longitude,
          island,
          opening_hours,
          featured,
          verified,
          logo_url,
          cover_image_url,
          gallery_images,
          average_rating,
          total_reviews,
          services,
          created_at,
          updated_at
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (statusFilter !== "all") {
        console.debug('🔍 [fetchBusinesses] Applying status filter:', statusFilter);
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== "all") {
        console.debug('🔍 [fetchBusinesses] Applying category filter:', categoryFilter);
        query = query.eq('category', categoryFilter);
      }
      if (islandFilter !== "all") {
        console.debug('🔍 [fetchBusinesses] Applying island filter:', islandFilter);
        query = query.eq('island', islandFilter);
      }

      console.debug('🔍 [fetchBusinesses] Executing query...');
      const { data, error: businessesError } = await query;
      
      const fetchDuration = performance.now() - fetchStartTime;
      console.debug(`🔍 [fetchBusinesses] Query completed in ${fetchDuration.toFixed(2)}ms`);

      if (businessesError) {
        // CRITICAL: Log SELECT query errors - MUST appear in console
        console.error('❌ [fetchBusinesses] Fetch businesses error:', businessesError);
        console.error('❌ [fetchBusinesses] Supabase query error details:', {
          error: businessesError,
          message: businessesError.message,
          details: businessesError.details,
          hint: businessesError.hint,
          code: businessesError.code,
        });
        
        // Return empty array instead of throwing to prevent UI hanging
        setBusinesses([]);
        setError(businessesError.message || 'Failed to load businesses');
        clearTimeout(timeoutId);
        setLoading(false);
        toast({
          title: "Error",
          description: `Failed to load businesses: ${businessesError.message}`,
          variant: "destructive",
        });
        return;
      }

      console.debug('🔍 [fetchBusinesses] Raw data received:', {
        dataType: Array.isArray(data) ? 'array' : typeof data,
        dataLength: Array.isArray(data) ? data.length : 'N/A',
        data: data,
      });

      // Sanitize all businesses before setting state
      const rawBusinesses = data || [];
      console.debug('🔍 [fetchBusinesses] Sanitizing', rawBusinesses.length, 'businesses...');
      
      const sanitizedBusinesses = rawBusinesses
        .map((raw: any) => sanitizeBusiness(raw))
        .filter((business: Business | null): business is Business => business !== null);
      
      const skippedCount = rawBusinesses.length - sanitizedBusinesses.length;
      if (skippedCount > 0) {
        console.warn(`⚠️ [fetchBusinesses] Skipped ${skippedCount} invalid businesses`);
      }
      
      console.debug('🔍 [fetchBusinesses] Sanitized businesses:', sanitizedBusinesses.length);

      // Apply search filter
      let filteredBusinesses = sanitizedBusinesses;
      if (searchTerm) {
        console.debug('🔍 [fetchBusinesses] Applying search filter:', searchTerm);
        filteredBusinesses = sanitizedBusinesses.filter(business =>
          business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
        console.debug('🔍 [fetchBusinesses] Search results:', filteredBusinesses.length);
      }

      setBusinesses(filteredBusinesses);
      console.debug('✅ [fetchBusinesses] Successfully loaded', filteredBusinesses.length, 'businesses');
      
      clearTimeout(timeoutId);
    } catch (error: any) {
      clearTimeout(timeoutId);
      const fetchDuration = performance.now() - fetchStartTime;
      console.error('❌ [fetchBusinesses] Error after', fetchDuration.toFixed(2), 'ms:', {
        error,
        message: error?.message,
        details: error?.details,
        hint: error?.hint,
        code: error?.code,
        stack: error?.stack,
      });
      
      // Return empty array instead of leaving UI hanging
      setBusinesses([]);
      const errorMessage = error?.message || 'Unknown error occurred while fetching businesses';
      setError(errorMessage);
      toast({
        title: "Error",
        description: `Failed to load businesses: ${errorMessage}`,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      const totalDuration = performance.now() - fetchStartTime;
      console.debug(`🔍 [fetchBusinesses] Fetch completed in ${totalDuration.toFixed(2)}ms`);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('slug, name')
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

      fetchBusinesses(currentPage);
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
      await fetchBusinesses(currentPage);
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
        fetchBusinesses(currentPage);
      }, 500);
      return () => clearTimeout(timeoutId);
    } else {
      fetchBusinesses(currentPage);
    }
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
              fetchBusinesses(currentPage);
            }} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </Button>
            <Button onClick={() => {
              setError(null);
              setCurrentPage(1);
              fetchBusinesses(1);
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

          {/* Businesses Table */}
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin mr-2" />
              Loading businesses...
            </div>
          ) : (
            <div className="space-y-2">
              {businesses.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-muted-foreground">No businesses found</p>
                </div>
              ) : (
                businesses.map((business) => {
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
                })
              )}
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
