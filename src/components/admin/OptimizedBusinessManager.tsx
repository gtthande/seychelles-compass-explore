import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Search, Eye, Edit, Trash2, Loader2, AlertCircle, RefreshCw, Plus } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

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
  owner_id: string;
}

interface Category {
  value: string;
  label: string;
}

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
    setLoading(true);
    setError(null);
    
    try {
      // Get total count first (optimized)
      const { count: totalCount } = await supabase
        .from('businesses')
        .select('id', { count: 'exact', head: true });

      setTotalBusinesses(totalCount || 0);
      setTotalPages(Math.ceil((totalCount || 0) / USERS_PER_PAGE));

      // Get paginated businesses with specific fields
      const from = (page - 1) * USERS_PER_PAGE;
      const to = from + USERS_PER_PAGE - 1;

      let query = supabase
        .from('businesses')
        .select(`
          id, name, description, address, island, category, status, 
          created_at, updated_at, owner_id, phone, email, website
        `)
        .order('created_at', { ascending: false })
        .range(from, to);

      // Apply filters
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      if (categoryFilter !== "all") {
        query = query.eq('category', categoryFilter);
      }
      if (islandFilter !== "all") {
        query = query.eq('island', islandFilter);
      }

      const { data, error: businessesError } = await query;

      if (businessesError) throw businessesError;

      // Apply search filter
      let filteredBusinesses = data || [];
      if (searchTerm) {
        filteredBusinesses = (data || []).filter(business =>
          business.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          business.address?.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      setBusinesses(filteredBusinesses);
    } catch (error: any) {
      console.error('Error fetching businesses:', error);
      setError(error.message);
      toast({
        title: "Error",
        description: "Failed to load businesses. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
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
    try {
      setLoading(true);
      
      const { error } = await supabase
        .from('businesses')
        .delete()
        .eq('id', businessId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business deleted successfully",
      });

      fetchBusinesses(currentPage);
    } catch (error: any) {
      console.error("Error deleting business:", error);
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
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
        </CardHeader>
        <CardContent>
          <p className="text-destructive mb-4">{error}</p>
          <Button onClick={() => fetchBusinesses(currentPage)} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            Retry
          </Button>
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
            <Button onClick={() => navigate('/admin/businesses/create')}>
              <Plus className="w-4 h-4 mr-2" />
              Create Business
            </Button>
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
                <SelectItem value="approved">Approved</SelectItem>
                <SelectItem value="rejected">Rejected</SelectItem>
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
              {businesses.map((business) => (
                <div key={business.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium">{business.name}</h3>
                      <Badge className={
                        business.status === 'active' ? 'bg-green-500 text-white' :
                        business.status === 'pending' ? 'bg-yellow-400 text-black' :
                        business.status === 'suspended' ? 'bg-red-500 text-white' :
                        business.status === 'draft' ? 'bg-gray-300 text-gray-700' :
                        'bg-gray-300 text-gray-700'
                      }>
                        {business.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">{business.description}</p>
                    <p className="text-xs text-muted-foreground">
                      {business.address}, {business.island} • {business.category}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Created: {new Date(business.created_at).toLocaleDateString()}
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
                        <SelectItem value="approved">Approved</SelectItem>
                        <SelectItem value="rejected">Rejected</SelectItem>
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
              ))}
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
