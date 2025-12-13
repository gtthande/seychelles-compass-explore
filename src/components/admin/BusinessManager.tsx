import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StatusBadge from "@/components/ui/StatusBadge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { fetchBusinesses } from "@/lib/business-api";
import { 
  Search, 
  Building, 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Eye, 
  Edit, 
  Trash2, 
  CheckCircle, 
  XCircle,
  Star,
  Filter,
  Download
} from "lucide-react";

interface Business {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  categories?: { id: string; title: string; slug: string } | null;
  is_active: boolean;
  is_verified: boolean;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  image_url: string | null;
  created_at: string;
  updated_at: string;
  owner_id: string | null;
  // Computed fields
  status?: string; // Computed from is_active and is_verified
  category?: string; // Computed from categories.title
}

const BusinessManager = () => {
  const { toast } = useToast();
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [filteredBusinesses, setFilteredBusinesses] = useState<Business[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [islandFilter, setIslandFilter] = useState("all");
  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  const islands = ["Mahé", "Praslin", "La Digue", "Silhouette", "Curieuse", "Bird", "Denis"];

  useEffect(() => {
    fetchBusinessesData();
    fetchCategories();
  }, []);

  useEffect(() => {
    applyFilters();
  }, [businesses, searchTerm, statusFilter, categoryFilter, islandFilter]);

  const fetchBusinessesData = async () => {
    setLoading(true);
    try {
      // Query businesses with categories join
      const { data, error } = await supabase
        .from('businesses')
        .select(`
          id,
          title,
          description,
          category_id,
          phone,
          email,
          website,
          address,
          image_url,
          is_active,
          is_verified,
          owner_id,
          created_at,
          updated_at,
          categories (id, title, slug)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error) throw error;

      // Transform data to include computed fields
      const businessesWithComputed = (data || []).map((b: any) => ({
        ...b,
        status: !b.is_active ? 'pending' : b.is_verified ? 'active' : 'pending',
        category: b.categories?.title || null,
      }));

      setBusinesses(businessesWithComputed);
    } catch (error) {
      console.error('Error fetching businesses:', error);
      toast({
        title: "Error",
        description: "Failed to load businesses",
        variant: "destructive",
      });
      setBusinesses([]); // Ensure we set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data, error } = await supabase
        .from('categories')
        .select('id, title, slug')
        .order('title');

      if (error) throw error;
      
      const categoryOptions = data?.map(cat => ({
        value: cat.id,
        label: cat.title
      })) || [];
      
      setCategories(categoryOptions);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const applyFilters = () => {
    let filtered = businesses;

    // Search filter
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = filtered.filter(business =>
        business.title.toLowerCase().includes(searchLower) ||
        business.description?.toLowerCase().includes(searchLower) ||
        business.email?.toLowerCase().includes(searchLower) ||
        business.address?.toLowerCase().includes(searchLower)
      );
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter(business => business.status === statusFilter);
    }

    // Category filter
    if (categoryFilter !== "all") {
      filtered = filtered.filter(business => business.category_id === categoryFilter);
    }

    // Island filter
    if (islandFilter !== "all") {
      filtered = filtered.filter(business => business.island === islandFilter);
    }

    setFilteredBusinesses(filtered);
  };

  const updateBusinessStatus = async (businessId: string, newStatus: string) => {
    try {
      // Map status string to is_active and is_verified
      const updateData: any = {};
      if (newStatus === 'active') {
        updateData.is_active = true;
        updateData.is_verified = true;
      } else if (newStatus === 'suspended' || newStatus === 'pending') {
        updateData.is_active = false;
        updateData.is_verified = false;
      }
      
      const { error } = await supabase
        .from('businesses')
        .update(updateData)
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId 
            ? { 
                ...business, 
                ...updateData,
                status: newStatus
              }
            : business
        )
      );

      toast({
        title: "Success",
        description: `Business status updated to ${newStatus}`,
      });
    } catch (error) {
      console.error('Error updating business status:', error);
      toast({
        title: "Error",
        description: "Failed to update business status",
        variant: "destructive",
      });
    }
  };

  // Note: featured field removed from schema - keeping function for backward compatibility
  const toggleFeatured = async (businessId: string, currentFeatured: boolean) => {
    toast({
      title: "Info",
      description: "Featured status is not available in current schema",
    });
  };

  const toggleVerified = async (businessId: string, currentVerified: boolean) => {
    try {
      const { error } = await supabase
        .from('businesses')
        .update({ is_verified: !currentVerified })
        .eq('id', businessId);

      if (error) throw error;

      setBusinesses(prev => 
        prev.map(business => 
          business.id === businessId 
            ? { 
                ...business, 
                is_verified: !currentVerified,
                status: !business.is_active ? 'pending' : (!currentVerified ? 'active' : 'pending')
              }
            : business
        )
      );

      toast({
        title: "Success",
        description: `Business ${!currentVerified ? 'verified' : 'unverified'}`,
      });
    } catch (error) {
      console.error('Error toggling verified status:', error);
      toast({
        title: "Error",
        description: "Failed to update verified status",
        variant: "destructive",
      });
    }
  };

  const exportBusinesses = () => {
    const csvContent = [
      ['Name', 'Category', 'Status', 'Island', 'Phone', 'Email', 'Address', 'Featured', 'Verified', 'Created At'],
      ...filteredBusinesses.map(business => [
        business.title,
        business.category || 'Uncategorized',
        business.status || 'pending',
        business.address || '',
        business.phone || '',
        business.email || '',
        business.address || '',
        business.is_verified ? 'Yes' : 'No',
        business.is_verified ? 'Yes' : 'No',
        new Date(business.created_at).toLocaleDateString()
      ])
    ].map(row => row.join(',')).join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `businesses-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };


  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Business Management</CardTitle>
          <CardDescription>Loading businesses...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-muted rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5" />
            Business Management
          </CardTitle>
          <CardDescription>
            View, search, and manage all businesses in the system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {/* Search and Filters */}
          <div className="space-y-4 mb-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="Search businesses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Button onClick={exportBusinesses} variant="outline" className="flex items-center gap-2">
                <Download className="w-4 h-4" />
                Export CSV
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Statuses</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>

              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Category" />
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
                <SelectTrigger>
                  <SelectValue placeholder="Filter by Island" />
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
          </div>

          {/* Results Summary */}
          <div className="mb-4">
            <p className="text-sm text-muted-foreground">
              Showing {filteredBusinesses.length} of {businesses.length} businesses
            </p>
          </div>

          {/* Business List */}
          <div className="space-y-4">
            {filteredBusinesses.map((business) => (
              <Card key={business.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
                    <div className="flex-1 space-y-2">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-semibold text-lg">{business.title}</h3>
                        <StatusBadge status={business.status} />
                        {business.is_verified && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <CheckCircle className="w-3 h-3" />
                            Verified
                          </Badge>
                        )}
                      </div>

                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {business.description}
                      </p>

                      <div className="flex flex-wrap gap-4 text-sm">
                        {business.address && (
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4 text-muted-foreground" />
                            <span>{business.address}</span>
                          </div>
                        )}
                        {business.phone && (
                          <div className="flex items-center gap-1">
                            <Phone className="w-4 h-4 text-muted-foreground" />
                            <span>{business.phone}</span>
                          </div>
                        )}
                        {business.email && (
                          <div className="flex items-center gap-1">
                            <Mail className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">{business.email}</span>
                          </div>
                        )}
                        {business.website && (
                          <div className="flex items-center gap-1">
                            <Globe className="w-4 h-4 text-muted-foreground" />
                            <span className="truncate max-w-[200px]">Website</span>
                          </div>
                        )}
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Created: {new Date(business.created_at).toLocaleDateString()}
                      </div>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => updateBusinessStatus(business.id, business.status === 'active' ? 'suspended' : 'active')}
                      >
                        {business.status === 'active' ? 'Suspend' : 'Activate'}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toggleVerified(business.id, business.is_verified)}
                      >
                        {business.is_verified ? 'Unverify' : 'Verify'}
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}

            {filteredBusinesses.length === 0 && (
              <div className="text-center py-8">
                <Building className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-semibold mb-2">No businesses found</h3>
                <p className="text-muted-foreground">
                  Try adjusting your search criteria or filters.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default BusinessManager;
