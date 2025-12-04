import React, { useState, useEffect, useCallback, useMemo, lazy, Suspense } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useStaticData, useServerSideData, usePaginatedData } from "@/hooks/useOptimizedData";
import { dataFetchers } from "@/lib/data-loader";
import { performanceLog, createPerformanceTimer } from "@/lib/performance";
import { testSupabaseConnection } from "@/utils/test-supabase-connection";

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useToast } from "@/hooks/use-toast";
import LiveCounters from "@/components/LiveCounters";
import BackButton from "@/components/BackButton";
import GoogleMap from "@/components/GoogleMap";
// Lazy load heavy image search component
const ImageSearch = lazy(() => import("@/components/ImageSearch"));
import SearchWithTypeahead from "@/components/SearchWithTypeahead";
import BusinessSearch from "@/components/BusinessSearch";
import BusinessTable from "@/components/BusinessTable";
import BusinessLocationMap from "@/components/business/BusinessLocationMap";
// import { BusinessMapPreview } from "@/components/BusinessMapPreview"; // Disabled - using static maps instead
import BusinessCardSkeleton from "@/components/BusinessCardSkeleton";
import BusinessCardLight from "@/components/BusinessCardLight";
// Lazy load heavy map component
const MapModal = lazy(() => import("@/components/MapModal"));
import { geocodeAddress } from "@/lib/geocoding";
import { getDirectionsUrl, getAddressDirectionsUrl, isValidCoordinates } from "@/lib/maps";
import { 
  MapPin, 
  Phone, 
  Mail, 
  Globe, 
  Star, 
  MessageCircle,
  Facebook,
  Instagram,
  Linkedin,
  Youtube,
  Clock,
  Verified,
  Map,
  Edit,
  Save,
  Trash2,
  List,
  Filter,
  ExternalLink,
  ChevronDown,
  Navigation,
  Loader2
} from "lucide-react";

interface Business {
  id: string;
  owner_id: string;
  name: string;
  description: string;
  category: string;
  status: string;
  phone: string;
  whatsapp: string;
  email: string;
  website: string;
  facebook_url: string;
  instagram_url: string;
  linkedin_url: string;
  youtube_url: string;
  address: string;
  island: string;
  latitude: number | null;
  longitude: number | null;
  featured: boolean;
  verified: boolean;
  logo_url: string;
  cover_image_url: string;
  average_rating: number;
  total_reviews: number;
  created_at: string;
  services?: string[];
  subcategory?: string;
}

interface CategoryGroup {
  category: string;
  subcategories: {
    [key: string]: Business[];
  };
}

const Directory = () => {
  const performanceTimer = createPerformanceTimer('Directory component mount');
  const { toast } = useToast();
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  performanceLog('Directory component initializing');
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [products, setProducts] = useState<any[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("");
  const [selectedIsland, setSelectedIsland] = useState("");
  const [editingBusiness, setEditingBusiness] = useState<Business | null>(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    phone: "",
    email: "",
    website: "",
    address: "",
    island: "",
    latitude: null as number | null,
    longitude: null as number | null,
    facebook_url: "",
    instagram_url: "",
    linkedin_url: "",
    youtube_url: ""
  });
  const [hasWhatsApp, setHasWhatsApp] = useState(false);
  const [showFeatured, setShowFeatured] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "map" | "table">("table");
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [mapModalOpen, setMapModalOpen] = useState(false);
  const [selectedBusinessForMap, setSelectedBusinessForMap] = useState<Business | null>(null);

  const [categories, setCategories] = useState<{value: string, label: string}[]>([]);

  // Use optimized data fetching for categories
  const { data: categoriesData, loading: categoriesLoading } = useStaticData(
    'directory_categories',
    async () => {
      const { data, error } = await supabase
        .from('businesses')
        .select('category')
        .eq('status', 'active')
        .not('category', 'is', null);

      if (error) throw error;
      
      // Get distinct categories with counts
      const categoryMap: Record<string, { label: string; count: number }> = {};
      
      data?.forEach(business => {
        const categoryValue = business.category;
        if (categoryValue) {
          if (!categoryMap[categoryValue]) {
            categoryMap[categoryValue] = { label: categoryValue, count: 0 };
          }
          categoryMap[categoryValue].count++;
        }
      });

      // Convert to array and format labels
      return Object.entries(categoryMap).map(([value, data]) => ({
        value,
        label: `${data.label} (${data.count})`
      })).sort((a, b) => a.label.localeCompare(b.label));
    },
    {
      fallback: [
        { value: "food", label: "Food & Beverages" },
        { value: "accommodation", label: "Accommodation" },
        { value: "tours", label: "Tours & Activities" },
        { value: "transport", label: "Transportation" },
        { value: "retail", label: "Retail Products" },
        { value: "services", label: "Services" },
        { value: "entertainment", label: "Entertainment" },
        { value: "education", label: "Education" },
      ]
    }
  );

  // Update categories state when data loads
  useEffect(() => {
    if (categoriesData) {
      setCategories(categoriesData);
    }
  }, [categoriesData]);

  const islands = ["Mahé", "Praslin", "La Digue", "Silhouette", "Curieuse", "Bird", "Denis"];
  
  const handleImageSearchResults = (results: {
    categories: string[];
    keywords: string[];
    searchQuery: string;
    description: string;
  }) => {
    // Apply image search results to filters
    if (results.categories.length > 0) {
      setSelectedCategory(results.categories[0]);
    }
    setSearchTerm(results.searchQuery);
    
    toast({
      title: "Image Search Applied",
      description: `Found ${results.categories.join(', ')} - searching for: ${results.searchQuery}`,
    });
  };

  // Cache for businesses data
  const [businessesCache, setBusinessesCache] = React.useState<Business[] | null>(null);
  const [cacheTimestamp, setCacheTimestamp] = React.useState<number>(0);
  const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  // Use optimized data fetching for businesses - Prioritize first 10 for faster loading
  // RLS policies will automatically filter by status, but we also filter client-side for non-admins
  // Cache key includes isAdmin to differentiate admin vs non-admin queries
  const {
    data: businessesData,
    loading: businessesLoading,
    error: businessesError,
    refetch: refreshBusinesses
  } = useServerSideData(
    `directory_businesses_${isAdmin ? 'admin' : 'public'}_${selectedCategory}_${selectedIsland}_${searchTerm}`,
    async () => {
      try {
        let query = supabase
          .from('businesses')
          .select('*')
          .order('featured', { ascending: false })
          .order('created_at', { ascending: false })
          .limit(100); // Increased limit to get more results, will deduplicate

        // For non-admin users, filter to only show active businesses
        // RLS will enforce this at the database level, but client-side filter improves UX
        if (!isAdmin) {
          query = query.eq('status', 'active');
        }
        // Admins can see all businesses (including pending) - RLS will allow this

        // Apply filters
        if (selectedCategory) {
          query = query.eq('category', selectedCategory);
        }
        if (selectedIsland) {
          query = query.eq('island', selectedIsland);
        }
        if (searchTerm) {
          query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
        }

        // Execute query with retry logic for network errors
        let lastError: any = null;
        let data: Business[] | null = null;
        let error: any = null;
        let status: number | null = null;
        
        // Try up to 3 times for network errors
        for (let attempt = 1; attempt <= 3; attempt++) {
          try {
            const result = await query;
            data = result.data;
            error = result.error;
            status = result.status;
            
            if (!error) {
              break; // Success, exit retry loop
            }
            
            // If it's a network error and we have retries left, wait and retry
            const isNetworkError = error.message?.includes('Failed to fetch') || 
                                   error.message?.includes('NetworkError') ||
                                   error.name === 'TypeError' ||
                                   error.code === 'PGRST301';
            
            if (attempt < 3 && isNetworkError) {
              console.warn(`⚠️ Directory: Network error on attempt ${attempt}, retrying in ${attempt}s...`);
              lastError = error;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt)); // Exponential backoff
              // Recreate query for retry (queries can't be reused after execution)
              query = supabase
                .from('businesses')
                .select('*')
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100);
              
              if (!isAdmin) {
                query = query.eq('status', 'active');
              }
              if (selectedCategory) {
                query = query.eq('category', selectedCategory);
              }
              if (selectedIsland) {
                query = query.eq('island', selectedIsland);
              }
              if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
              }
              continue;
            }
            
            break; // Non-network error or last attempt
          } catch (fetchError: any) {
            // Catch network errors that might not be in error object
            const isFetchError = fetchError.message?.includes('Failed to fetch') ||
                                 fetchError.name === 'TypeError' ||
                                 fetchError.message?.includes('NetworkError');
            
            if (attempt < 3 && isFetchError) {
              console.warn(`⚠️ Directory: Fetch error on attempt ${attempt}, retrying in ${attempt}s...`);
              lastError = fetchError;
              await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
              // Recreate query for retry
              query = supabase
                .from('businesses')
                .select('*')
                .order('featured', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(100);
              
              if (!isAdmin) {
                query = query.eq('status', 'active');
              }
              if (selectedCategory) {
                query = query.eq('category', selectedCategory);
              }
              if (selectedIsland) {
                query = query.eq('island', selectedIsland);
              }
              if (searchTerm) {
                query = query.or(`name.ilike.%${searchTerm}%,description.ilike.%${searchTerm}%`);
              }
              continue;
            }
            throw fetchError; // Re-throw if not a retryable error
          }
        }
        
        // Log detailed error information
        if (error || lastError) {
          const finalError = error || lastError;
          console.error('❌ Directory: Failed to load businesses after retries', {
            error: finalError,
            message: finalError.message,
            details: finalError.details,
            hint: finalError.hint,
            code: finalError.code,
            status,
            isAdmin,
            filters: { selectedCategory, selectedIsland, searchTerm },
            supabaseUrl: import.meta.env.VITE_SUPABASE_URL,
            hasAnonKey: !!import.meta.env.VITE_SUPABASE_ANON_KEY
          });
          
          // Check if it's a network/fetch error
          if (finalError.message?.includes('Failed to fetch') || 
              finalError.message?.includes('NetworkError') || 
              finalError.name === 'TypeError' ||
              finalError.code === 'PGRST301') {
            throw new Error(`Network error: Unable to connect to Supabase. Please check your internet connection and Supabase configuration.`);
          }
          
          throw new Error(`Failed to load businesses: ${finalError.message}${finalError.details ? ` (${finalError.details})` : ''}${finalError.hint ? ` - ${finalError.hint}` : ''}`);
        }

        // Deduplicate businesses by ID to prevent duplicates
        const uniqueBusinesses = (data || []).reduce((acc: Business[], business: Business) => {
          if (!acc.find(b => b.id === business.id)) {
            acc.push(business);
          }
          return acc;
        }, []);

        console.log(`✅ Directory: Loaded ${uniqueBusinesses.length} unique businesses (from ${data?.length || 0} total)`);
        return uniqueBusinesses;
      } catch (err: any) {
        console.error('❌ Directory: Error in businesses fetch', {
          error: err,
          message: err?.message,
          stack: err?.stack,
          isAdmin,
          filters: { selectedCategory, selectedIsland, searchTerm }
        });
        throw err;
      }
    },
    {
      cache: true,
      ttl: 30000 // 30 seconds cache
    }
  );

  // Update businesses state when data changes - with deduplication
  useEffect(() => {
    if (businessesData) {
      performanceLog('Businesses data loaded', performanceTimer());
      
      // Additional deduplication check to prevent duplicates from multiple sources
      const uniqueBusinesses = businessesData.reduce((acc: Business[], business: Business) => {
        if (!acc.find(b => b.id === business.id)) {
          acc.push(business);
        }
        return acc;
      }, []);
      
      // Only update if the data actually changed (prevent unnecessary re-renders)
      // Use a ref to track previous length to avoid dependency on businesses array
      setBusinesses(prevBusinesses => {
        if (prevBusinesses.length === uniqueBusinesses.length && 
            prevBusinesses.every((b, i) => b.id === uniqueBusinesses[i]?.id)) {
          return prevBusinesses; // No change, return previous to prevent re-render
        }
        return uniqueBusinesses;
      });
    }
  }, [businessesData]); // Only depend on businessesData to prevent loops

  // Update loading state
  useEffect(() => {
    setLoading(businessesLoading);
  }, [businessesLoading]);

  // Handle errors with detailed logging and helpful messages
  useEffect(() => {
    if (businessesError) {
      console.error('❌ Directory: Business loading error', {
        error: businessesError,
        isAdmin,
        timestamp: new Date().toISOString()
      });
      
      // Check if it's a "Failed to fetch" error (network/CORS issue) or timeout
      const isNetworkError = businessesError.includes('Failed to fetch') || 
                             businessesError.includes('NetworkError') ||
                             businessesError.includes('TypeError') ||
                             businessesError.includes('Network error') ||
                             businessesError.includes('timeout') ||
                             businessesError.includes('Request timeout') ||
                             businessesError.includes('took too long');
      
      let errorDescription = businessesError;
      let helpText = '';
      
      if (isNetworkError) {
        if (businessesError.includes('timeout') || businessesError.includes('took too long')) {
          errorDescription = 'Connection timeout: Supabase is taking too long to respond.';
          helpText = 'This could be: 1) Slow network connection, 2) Supabase project is paused/slow, 3) CORS blocking the request, 4) Firewall/VPN blocking Supabase. Try the connection test below.';
        } else {
          errorDescription = 'Unable to connect to Supabase. This is usually a network or configuration issue.';
          helpText = 'Please check: 1) Your internet connection, 2) Supabase project is active, 3) CORS settings in Supabase dashboard, 4) Run: npm run verify-supabase';
        }
      } else if (businessesError.includes('permission') || businessesError.includes('policy')) {
        errorDescription = 'Permission denied. You may not have access to view businesses.';
        helpText = 'Contact an administrator if you believe this is an error.';
      }
      
      toast({
        title: "Failed to Load Businesses",
        description: (
          <div>
            <p>{errorDescription}</p>
            {helpText && <p className="text-xs mt-1 opacity-90">{helpText}</p>}
            <p className="text-xs mt-1 opacity-75">Error: {businessesError}</p>
            {isNetworkError && (
              <div className="mt-2">
                <Button
                  size="sm"
                  variant="outline"
                  onClick={async () => {
                    console.log('Running connection test...');
                    const result = await testSupabaseConnection();
                    if (result.success) {
                      toast({
                        title: "Connection Test Passed",
                        description: "Supabase connection is working. Try refreshing the page.",
                      });
                      // Reload after a short delay
                      setTimeout(() => window.location.reload(), 1000);
                    } else {
                      toast({
                        title: "Connection Test Failed",
                        description: result.error || "Check browser console for details",
                        variant: "destructive",
                      });
                    }
                  }}
                  className="mt-2"
                >
                  🔍 Test Connection
                </Button>
              </div>
            )}
          </div>
        ) as any,
        variant: "destructive",
        duration: 10000,
      });
    }
  }, [businessesError, toast, isAdmin]);

  // Memoize fetchProducts to prevent unnecessary re-renders
  const fetchProducts = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select(`
          id, name, description, category, price, currency, business_id,
          business:businesses(id, name, category, status, island, address)
        `)
        .eq('status', 'active')
        .eq('business.status', 'active')
        .order('featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        console.error('Error fetching products:', error);
        setProducts([]);
      } else {
        setProducts(data || []);
      }
    } catch (error) {
      console.error('Error fetching products:', error);
      setProducts([]);
    }
  }, []);

  // Edit business functions
  const handleEditBusiness = (business: Business) => {
    setEditingBusiness(business);
    setEditForm({
      name: business.name || "",
      description: business.description || "",
      phone: business.phone || "",
      email: business.email || "",
      website: business.website || "",
      address: business.address || "",
      island: business.island || "",
      latitude: business.latitude || null,
      longitude: business.longitude || null,
      facebook_url: business.facebook_url || "",
      instagram_url: business.instagram_url || "",
      linkedin_url: business.linkedin_url || "",
      youtube_url: business.youtube_url || ""
    });
    setIsEditDialogOpen(true);
  };

  const handleSaveBusiness = async () => {
    if (!editingBusiness || !user) return;

    try {
      const { error } = await supabase
        .from('businesses')
        .update(editForm)
        .eq('id', editingBusiness.id)
        .eq('owner_id', user.id); // Ensure user can only edit their own business

      if (error) throw error;

      toast({
        title: "Success",
        description: "Business updated successfully.",
      });

      setIsEditDialogOpen(false);
      setEditingBusiness(null);
      refreshBusinesses(); // Refresh the list
    } catch (error: any) {
      console.error('Error updating business:', error);
      toast({
        title: "Error",
        description: `Failed to update business: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const handleGeocodeAddress = async (address: string) => {
    if (!address.trim()) return;
    
    try {
      const result = await geocodeAddress(address, editForm.island);
      
      if ('error' in result) {
        toast({
          title: 'Geocoding Failed',
          description: result.error,
          variant: 'destructive',
        });
        
        if (result.details) {
          console.error('Geocoding error details:', result.details);
        }
        return;
      }
      
      // Success - update the form with coordinates
      setEditForm(prev => ({
        ...prev,
        latitude: result.latitude,
        longitude: result.longitude
      }));
      
      toast({
        title: 'Location Found',
        description: `Coordinates set: ${result.latitude.toFixed(6)}, ${result.longitude.toFixed(6)}`,
      });
      
    } catch (error: any) {
      console.error('Unexpected error during geocoding:', error);
      toast({
        title: 'Geocoding Failed',
        description: 'An unexpected error occurred while geocoding the address.',
        variant: 'destructive',
      });
    }
  };

  // Check if user can edit a business
  const canEditBusiness = (business: Business) => {
    if (!user) return false;
    return business.owner_id === user.id;
  };

  useEffect(() => {
    // Test Supabase connection first
    const testConnection = async () => {
      try {
        console.log('Testing Supabase connection...');
        
        // Simple connection test
        const { data, error } = await supabase.from('businesses').select('id').limit(1);
        
        if (error) {
          console.error('Supabase connection error:', error);
          console.error('Error details:', {
            message: error.message,
            code: error.code,
            details: error.details,
            hint: error.hint
          });
          toast({
            title: "Connection Error",
            description: `Database error: ${error.message} (Code: ${error.code})`,
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
        
        console.log('Supabase connection successful, data:', data);
        // Refresh data using the proper methods
        refreshBusinesses();
        fetchProducts();
      } catch (error) {
        console.error('Connection test failed:', error);
        console.error('Error type:', typeof error);
        console.error('Error instanceof Error:', error instanceof Error);
        if (error instanceof Error) {
          console.error('Error message:', error.message);
          console.error('Error stack:', error.stack);
        }
        toast({
          title: "Connection Error",
          description: `Connection failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
          variant: "destructive",
        });
        setLoading(false);
      }
    };
    
    testConnection();
  }, []);

  // Handle URL parameters on component mount
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const searchParam = urlParams.get('search');
    
    if (searchParam) {
      console.log('🔍 Directory: Setting search term from URL on mount:', searchParam);
      setSearchTerm(searchParam);
    }
  }, []); // Run once on mount

  useEffect(() => {
    // Check for URL parameters after categories and businesses are loaded
    if (categories.length > 0) {
      const urlParams = new URLSearchParams(window.location.search);
      const categoryParam = urlParams.get('category');
      
      if (categoryParam && categories.some(cat => cat.value === categoryParam)) {
        setSelectedCategory(categoryParam);
      }
    }
  }, [categories]);

  // Debounced filter application
  // Memoize filtered businesses calculation to prevent expensive re-computations
  const filteredBusinesses = useMemo(() => {
    // Apply all filters
    let filtered = businesses;
    
    // Enhanced search with relevance scoring and prioritization
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      console.log('🔍 Enhanced search for:', searchTerm, 'in', businesses.length, 'businesses');
      console.log('🔍 Search term details:', { searchTerm, searchLower, length: searchTerm.length });
      
      filtered = filtered
        .map(business => {
          let relevanceScore = 0;
          const name = business.name?.toLowerCase() || '';
          const description = business.description?.toLowerCase() || '';
          const category = business.category?.toLowerCase() || '';
          const address = business.address?.toLowerCase() || '';
          const island = business.island?.toLowerCase() || '';
          
          // Prioritize exact name matches (highest score)
          if (name.includes(searchLower)) {
            console.log(`🔍 Name match found: "${business.name}" contains "${searchLower}"`);
            relevanceScore += 100;
            // Bonus for exact name match
            if (name === searchLower) relevanceScore += 50;
            // Bonus for name starting with search term
            if (name.startsWith(searchLower)) relevanceScore += 25;
          }
          
          // Category match (high relevance)
          if (category.includes(searchLower)) {
            relevanceScore += 75;
          }
          
          // Description match (medium relevance)
          if (description.includes(searchLower)) {
            relevanceScore += 50;
          }
          
          // Address match (low relevance)
          if (address.includes(searchLower)) {
            relevanceScore += 25;
          }
          
          // Island match (low relevance)
          if (island.includes(searchLower)) {
            relevanceScore += 20;
          }
          
          // Services match (medium relevance)
          if (business.services && Array.isArray(business.services)) {
            const serviceMatch = business.services.some(service => 
              service?.toLowerCase().includes(searchLower)
            );
            if (serviceMatch) {
              relevanceScore += 40;
            }
          }
          
          return { ...business, relevanceScore };
        })
        .filter(business => (business as any).relevanceScore > 0)
        .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore) // Sort by relevance
        .slice(0, 50); // Limit to top 50 results
      
      console.log('🔍 Enhanced search results:', filtered.length, 'businesses found');
      filtered.forEach((business, index) => {
        console.log(`  ${index + 1}. ${business.name} (score: ${(business as any).relevanceScore})`);
      });

      // Also search products and add matching businesses
      const productMatches = products
        .map(product => {
          let relevanceScore = 0;
          const name = product.name?.toLowerCase() || '';
          const description = product.description?.toLowerCase() || '';
          const businessName = product.business?.name?.toLowerCase() || '';
          const searchLower = searchTerm.toLowerCase();

          // Product name match (highest priority)
          if (name.includes(searchLower)) {
            relevanceScore += 100;
            if (name === searchLower) relevanceScore += 50;
            if (name.startsWith(searchLower)) relevanceScore += 25;
          }

          // Product description match
          if (description.includes(searchLower)) {
            relevanceScore += 75;
          }

          // Business name match (lower priority)
          if (businessName.includes(searchLower)) {
            relevanceScore += 50;
          }

          return { ...product, relevanceScore };
        })
        .filter(product => (product as any).relevanceScore > 0)
        .sort((a, b) => (b as any).relevanceScore - (a as any).relevanceScore)
        .slice(0, 20);

      console.log('🔍 Product search results:', productMatches.length, 'products found');
      
      // Add businesses that have matching products to the results
      const businessIdsWithMatchingProducts = new Set(
        productMatches.map(p => p.business_id)
      );
      
      const businessesWithMatchingProducts = businesses.filter(b => 
        businessIdsWithMatchingProducts.has(b.id)
      );

      // Merge and deduplicate results
      const allBusinessIds = new Set([
        ...filtered.map(b => b.id),
        ...businessesWithMatchingProducts.map(b => b.id)
      ]);

      const mergedResults = Array.from(allBusinessIds).map(id => {
        const businessResult = filtered.find(b => b.id === id);
        const productResult = businessesWithMatchingProducts.find(b => b.id === id);
        return businessResult || productResult;
      }).filter(Boolean);

      filtered = mergedResults;
      console.log('🔍 Combined search results:', filtered.length, 'total businesses found');
    }

    if (selectedCategory && selectedCategory !== "__all__") {
      filtered = filtered.filter(business => business.category === selectedCategory);
    }

    if (selectedIsland && selectedIsland !== "__all__") {
      filtered = filtered.filter(business => business.island === selectedIsland);
    }
    
    // WhatsApp filter
    if (hasWhatsApp) {
      filtered = filtered.filter(business => business.whatsapp && business.whatsapp.trim() !== '');
    }
    
    // Featured filter
    if (showFeatured) {
      filtered = filtered.filter(business => business.featured);
    }

    return filtered;
  }, [businesses, searchTerm, selectedCategory, selectedIsland, hasWhatsApp, showFeatured, products]);
  
  const openInMaps = (business: Business) => {
    if (business.latitude && business.longitude) {
      const isMobile = /iPhone|iPad|iPod|Android/i.test(navigator.userAgent);
      const coords = `${business.latitude},${business.longitude}`;
      const query = encodeURIComponent(business.name + ', ' + business.address);
      
      if (isMobile) {
        // Try Apple Maps first on iOS, Google Maps on Android
        const isIOS = /iPhone|iPad|iPod/i.test(navigator.userAgent);
        if (isIOS) {
          // Apple Maps with directions
          window.open(`http://maps.apple.com/?daddr=${coords}&dirflg=d`);
        } else {
          // Google Maps with directions on Android
          window.open(`https://maps.google.com/maps?daddr=${coords}&dirflg=d`);
        }
      } else {
        // Desktop - use Google Maps with directions
        window.open(`https://maps.google.com/maps?daddr=${coords}&dirflg=d`);
      }
    } else {
      // Fallback to address search with directions
      const query = encodeURIComponent(business.name + ', ' + business.address + ', Seychelles');
      window.open(`https://maps.google.com/maps?daddr=${query}&dirflg=d`);
    }
  };

  const handleViewOnMap = (business: Business) => {
    setSelectedBusinessForMap(business);
    setMapModalOpen(true);
  };

  const handleGetDirections = (business: Business) => {
    if (isValidCoordinates(business.latitude, business.longitude)) {
      const url = getDirectionsUrl(business.latitude!, business.longitude!);
      window.open(url, '_blank', 'noopener,noreferrer');
    } else {
      // Fallback to address search
      const address = `${business.name}, ${business.address}, Seychelles`;
      const url = getAddressDirectionsUrl(address);
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const formatCategory = (category: string) => {
    if (!category) return 'Unknown';
    const found = categories.find(c => c.value === category);
    return found ? found.label : category.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  // Group businesses by category and subcategory
  const groupBusinessesByCategory = (businesses: Business[]): CategoryGroup[] => {
    const grouped: { [category: string]: { [subcategory: string]: Business[] } } = {};

    businesses.forEach(business => {
      if (!business || !business.category) return;
      const category = formatCategory(business.category);
      
      // Create proper subcategories based on business type
      let subcategory = 'General';
      if (business.category === 'healthcare') {
        subcategory = business.verified ? 'Government' : 'Private';
      } else if (business.category === 'hospitality') {
        subcategory = business.verified ? 'Licensed Hotels' : 'Guesthouses & B&Bs';
      } else if (business.category === 'education') {
        subcategory = business.verified ? 'Government Schools' : 'Private Institutions';
      } else if (business.category === 'financial_services') {
        subcategory = business.verified ? 'Banks' : 'Other Financial Services';
      } else {
        subcategory = business.verified ? 'Verified' : 'General';
      }

      if (!grouped[category]) {
        grouped[category] = {};
      }
      if (!grouped[category][subcategory]) {
        grouped[category][subcategory] = [];
      }
      grouped[category][subcategory].push(business);
    });

    // Sort businesses alphabetically within each subcategory
    Object.keys(grouped).forEach(category => {
      Object.keys(grouped[category]).forEach(subcategory => {
        grouped[category][subcategory].sort((a, b) => a.name.localeCompare(b.name));
      });
    });

    // Convert to array and sort categories alphabetically
    return Object.keys(grouped)
      .sort((a, b) => a.localeCompare(b))
      .map(category => ({
        category,
        subcategories: grouped[category]
      }));
  };

  const groupedBusinesses = filteredBusinesses.length > 0 ? groupBusinessesByCategory(filteredBusinesses) : [];

  const BusinessListingCard = ({ business }: { business: Business }) => {
    const hasLocationData = business.latitude && business.longitude && business.address;
    
    return (
      <Card className="hover:shadow-sm transition-all duration-200 border-border/50">
        <CardContent className="p-3 sm:p-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Business Info Column */}
            <div className="lg:col-span-2 space-y-3">
              <div className="flex items-start justify-between">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground hover:text-primary transition-colors">
                      {business.name}
                    </h3>
                    {business.verified && (
                      <Badge variant="secondary" className="text-xs">
                        <Verified className="w-3 h-3 mr-1" />
                        Verified
                      </Badge>
                    )}
                    {business.featured && (
                      <Badge className="text-xs bg-primary text-primary-foreground">
                        Featured
                      </Badge>
                    )}
                    {canEditBusiness(business) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditBusiness(business)}
                        className="h-6 w-6 p-0 ml-auto"
                        title="Edit business"
                      >
                        <Edit className="w-3 h-3" />
                      </Button>
                    )}
                  </div>
                  
                  {/* Small Map Preview */}
                  {hasLocationData && (
                    <div className="mt-3 p-2 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg border border-blue-200">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                          <MapPin className="w-5 h-5 text-blue-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <MapPin className="w-4 h-4 text-blue-600" />
                            <span className="text-sm font-medium text-blue-800">Location</span>
                          </div>
                          <p className="text-xs text-blue-600 font-mono">
                            {business.latitude.toFixed(4)}, {business.longitude.toFixed(4)}
                          </p>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => openInMaps(business)}
                            className="mt-2 h-7 text-xs"
                          >
                            View in Maps
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                  
                   {/* Contact Information */}
                   <div className="grid grid-cols-1 md:grid-cols-2 gap-2 text-sm">
                     {business.phone && (
                       <div className="flex items-center gap-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-auto p-1 hover:bg-accent"
                           asChild
                         >
                           <a href={`tel:${business.phone}`} className="flex items-center gap-2">
                             <Phone className="w-4 h-4 text-primary" />
                             <span className="text-foreground hover:text-primary truncate">{business.phone}</span>
                           </a>
                         </Button>
                       </div>
                     )}
                     
                     {business.email && (
                       <div className="flex items-center gap-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-auto p-1 hover:bg-accent"
                           asChild
                         >
                           <a href={`mailto:${business.email}`} className="flex items-center gap-2">
                             <Mail className="w-4 h-4 text-primary" />
                             <span className="text-foreground hover:text-primary truncate">{business.email}</span>
                           </a>
                         </Button>
                       </div>
                     )}
                     
                     {business.whatsapp && (
                       <div className="flex items-center gap-2 md:col-span-2">
                         <Button 
                           variant="ghost" 
                           size="sm" 
                           className="h-auto p-1 hover:bg-accent"
                           asChild
                         >
                           <a href={`https://wa.me/${business.whatsapp.replace(/[^\d]/g, '')}`} className="flex items-center gap-2" target="_blank" rel="noopener noreferrer">
                             <MessageCircle className="w-4 h-4 text-green-600" />
                             <span className="text-foreground hover:text-primary truncate">WhatsApp</span>
                           </a>
                         </Button>
                       </div>
                     )}
                   </div>

                  {business.address && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4" />
                      <span>{business.address}</span>
                      {business.island && (
                        <Badge variant="outline" className="ml-2">{business.island}</Badge>
                      )}
                    </div>
                  )}

                   {/* Social Links */}
                   <div className="flex items-center gap-1 flex-wrap">
                     {business.website && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                         <a href={business.website} target="_blank" rel="noopener noreferrer" aria-label="Visit website">
                           <Globe className="w-4 h-4 text-primary" />
                         </a>
                       </Button>
                     )}
                     
                     {business.facebook_url && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                         <a href={business.facebook_url} target="_blank" rel="noopener noreferrer" aria-label="Facebook page">
                           <Facebook className="w-4 h-4 text-blue-600" />
                         </a>
                       </Button>
                     )}
                     
                     {business.instagram_url && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                         <a href={business.instagram_url} target="_blank" rel="noopener noreferrer" aria-label="Instagram profile">
                           <Instagram className="w-4 h-4 text-pink-600" />
                         </a>
                       </Button>
                     )}

                     {business.linkedin_url && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                         <a href={business.linkedin_url} target="_blank" rel="noopener noreferrer" aria-label="LinkedIn profile">
                           <Linkedin className="w-4 h-4 text-blue-700" />
                         </a>
                       </Button>
                     )}

                     {business.youtube_url && (
                       <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                         <a href={business.youtube_url} target="_blank" rel="noopener noreferrer" aria-label="YouTube channel">
                           <Youtube className="w-4 h-4 text-red-600" />
                         </a>
                       </Button>
                     )}
                   </div>

                   {/* Map Action Buttons */}
                   <div className="flex gap-2 mt-3">
                     <Button
                       variant="secondary"
                       size="sm"
                       onClick={() => handleViewOnMap(business)}
                       disabled={!isValidCoordinates(business.latitude, business.longitude)}
                       className="flex-1 text-xs"
                       title={!isValidCoordinates(business.latitude, business.longitude) ? "No location set" : "View on Map"}
                     >
                       <MapPin className="w-3 h-3 mr-1" />
                       View on Map
                     </Button>
                     <Button
                       variant="outline"
                       size="sm"
                       onClick={() => handleGetDirections(business)}
                       className="flex-1 text-xs"
                     >
                       <Navigation className="w-3 h-3 mr-1" />
                       Get Directions
                     </Button>
                   </div>
                 </div>

                {business.logo_url && (
                  <img 
                    src={business.logo_url} 
                    alt={`${business.name} logo`}
                    className="w-12 h-12 rounded-lg object-cover ml-4 flex-shrink-0"
                  />
                )}
              </div>
              
              {/* Temporarily disabled to fix hanging issue */}
              {/* Map preview disabled for performance - will be lazy-loaded in detail view */}
            </div>

            {/* Location Map Column - Only show if location data exists */}
            {hasLocationData && (
              <div className="lg:col-span-1">
                <div className="sticky top-4">
                  <BusinessLocationMap 
                    business={business} 
                    height="140px" 
                    showTitle={false}
                    canEdit={canEditBusiness(business)}
                    onLocationUpdate={(lat, lng) => {
                      // Update business location
                      const updatedBusiness = { ...business, latitude: lat, longitude: lng };
                      setBusinesses(prev => prev.map(b => b.id === business.id ? updatedBusiness : b));
                      // Note: filteredBusinesses will automatically update via useMemo
                      
                      // Update in database
                      supabase
                        .from('businesses')
                        .update({ latitude: lat, longitude: lng })
                        .eq('id', business.id)
                        .then(({ error }) => {
                          if (error) {
                            toast({
                              title: 'Update Failed',
                              description: 'Could not update location coordinates.',
                              variant: 'destructive',
                            });
                          } else {
                            toast({
                              title: 'Location Updated',
                              description: 'Business location coordinates have been updated.',
                            });
                          }
                        });
                    }}
                  />
                  {/* Map directions link */}
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full mt-2 text-xs"
                    onClick={() => openInMaps(business)}
                  >
                    <Navigation className="w-3 h-3 mr-1" />
                    Get Directions
                  </Button>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    );
  };

  const CategoryAccordion = ({ categoryGroup }: { categoryGroup: CategoryGroup }) => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value={categoryGroup.category} className="border-border/50">
        <AccordionTrigger className="text-lg font-semibold text-foreground hover:text-primary">
          <div className="flex items-center justify-between w-full pr-4">
            <span>{categoryGroup.category}</span>
            <Badge variant="outline" className="ml-2">
              {Object.values(categoryGroup.subcategories).reduce((total, businesses) => total + businesses.length, 0)}
            </Badge>
          </div>
        </AccordionTrigger>
        <AccordionContent className="space-y-6">
          {Object.entries(categoryGroup.subcategories)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([subcategory, businesses]) => (
              <div key={subcategory} className="space-y-3">
                <div className="flex items-center gap-2">
                  <h4 className="font-medium text-foreground">{subcategory}</h4>
                  <Badge variant="secondary" className="text-xs">
                    {businesses.length}
                  </Badge>
                </div>
                <div className="space-y-2">
                  {businesses.map((business) => (
                    <BusinessCardLight 
                      key={business.id} 
                      business={business}
                      onEdit={isAdmin ? handleEditBusiness : undefined}
                      onView={(business) => navigate(`/business/${business.id}`)}
                      isOwner={isAdmin}
                    />
                  ))}
                </div>
              </div>
            ))}
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );

  // Add loading state check
  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading businesses...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-light via-background to-secondary">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="mb-6">
          <BackButton />
        </div>
        
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-foreground mb-4">
            Seychelles Business Directory
          </h1>
          <p className="text-lg text-muted-foreground">
            Find trusted local businesses across the beautiful islands of Seychelles
          </p>
          {searchTerm && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/20">
              <p className="text-sm text-primary font-medium">
                🔍 Search Results: {filteredBusinesses.length} business{filteredBusinesses.length !== 1 ? 'es' : ''} found for "{searchTerm}"
                {filteredBusinesses.length > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    (Sorted by relevance)
                  </span>
                )}
              </p>
            </div>
          )}
        </div>

        {/* Search Results - Show immediately when there's a search term */}
        {searchTerm && (
          <div className="mb-8">
            {filteredBusinesses.length > 0 ? (
              <>
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-2xl font-bold text-foreground">
                    Search Results ({filteredBusinesses.length})
                  </h2>
                  <div className="flex gap-2">
                    <Button
                      variant={viewMode === 'table' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('table')}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Table
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                    >
                      <List className="w-4 h-4 mr-2" />
                      Cards
                    </Button>
                    <Button
                      variant={viewMode === 'map' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setViewMode('map')}
                    >
                      <Map className="w-4 h-4 mr-2" />
                      Map
                    </Button>
                  </div>
                </div>
                
                {viewMode === 'map' ? (
                  <div className="space-y-4">
                    <GoogleMap 
                      businesses={filteredBusinesses}
                      selectedBusiness={selectedBusiness}
                      onBusinessSelect={(business) => setSelectedBusiness(business)}
                    />
                    {selectedBusiness && (
                      <Card>
                        <CardContent className="pt-6">
                          <BusinessListingCard business={selectedBusiness} />
                        </CardContent>
                      </Card>
                    )}
                  </div>
                ) : viewMode === 'table' ? (
                  <BusinessTable businesses={filteredBusinesses} searchTerm={searchTerm} />
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredBusinesses.map((business) => (
                      <BusinessCardLight 
                        key={business.id} 
                        business={business}
                        onEdit={isAdmin ? handleEditBusiness : undefined}
                        onView={(business) => navigate(`/business/${business.id}`)}
                        isOwner={isAdmin}
                      />
                    ))}
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No results found for "{searchTerm}"</h3>
                  <p className="text-muted-foreground mb-4">
                    Try different search terms or browse all available options.
                  </p>
                  <Button onClick={() => {
                    setSearchTerm("");
                    setSelectedCategory("");
                    setSelectedIsland("");
                    setHasWhatsApp(false);
                    setShowFeatured(false);
                  }}>
                    Clear Search & Show All
                  </Button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Live Counters - Only show when no search */}
        {!searchTerm && <LiveCounters />}

        {/* Search and Filters - Hide when there's an active search */}
        {!searchTerm && (
          <div className="bg-card rounded-xl p-4 sm:p-6 shadow-card mb-8">
            {/* Business Search */}
            <div className="mb-6">
              <h2 className="text-lg font-semibold mb-3">Quick Business Search</h2>
              <BusinessSearch 
                placeholder="Type a business name to find it quickly..."
                className="max-w-2xl"
              />
            </div>

            {/* Image Search */}
            <Suspense fallback={
              <div className="flex items-center justify-center h-32">
                <div className="flex flex-col items-center gap-2">
                  <Loader2 className="w-6 h-6 animate-spin" />
                  <p className="text-sm text-muted-foreground">Loading image search...</p>
                </div>
              </div>
            }>
              <ImageSearch onSearchResults={handleImageSearchResults} />
            </Suspense>
            
            {/* Main Search */}
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-4 mb-4">
              <div className="lg:col-span-2">
                <SearchWithTypeahead
                  value={searchTerm}
                  onChange={setSearchTerm}
                  onSelect={(result) => {
                    // Navigate to specific business detail page
                    if (result.type === 'business') {
                      navigate(`/business/${result.id}`);
                    }
                  }}
                  onSearch={(searchTerm) => {
                    console.log('🔍 Directory: Search triggered with term:', searchTerm);
                    setSearchTerm(searchTerm);
                    // Update URL with search parameter
                    const url = new URL(window.location.href);
                    if (searchTerm) {
                      url.searchParams.set('search', searchTerm);
                    } else {
                      url.searchParams.delete('search');
                    }
                    navigate(url.pathname + url.search, { replace: true });
                  }}
                  placeholder="Find businesses, services, or products..."
                />
            </div>
            
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Browse by Type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">Browse All Types</SelectItem>
                {categories.map((category) => (
                  <SelectItem key={category.value} value={category.value}>
                    {category.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedIsland} onValueChange={setSelectedIsland}>
              <SelectTrigger>
                <SelectValue placeholder="Choose Location" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="__all__">All Locations</SelectItem>
                {islands.map((island) => (
                  <SelectItem key={island} value={island}>
                    {island}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Additional Filters */}
          <div className="flex flex-wrap gap-4 items-center">
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="whatsapp" 
                checked={hasWhatsApp}
                onCheckedChange={(checked) => setHasWhatsApp(checked === true)}
              />
              <label htmlFor="whatsapp" className="text-sm font-medium cursor-pointer">
                Can message instantly
              </label>
            </div>
            
            <div className="flex items-center space-x-2">
              <Checkbox 
                id="featured" 
                checked={showFeatured}
                onCheckedChange={(checked) => setShowFeatured(checked === true)}
              />
              <label htmlFor="featured" className="text-sm font-medium cursor-pointer">
                Top picks only
              </label>
            </div>

            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSearchTerm("");
                setSelectedCategory("");
                setSelectedIsland("");
                setHasWhatsApp(false);
                setShowFeatured(false);
              }}
            >
              <Filter className="w-4 h-4 mr-2" />
              Reset
            </Button>

            <div className="ml-auto flex gap-2">
              <Button
                variant={viewMode === 'table' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('table')}
              >
                <List className="w-4 h-4" />
                Table
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
              >
                <List className="w-4 h-4" />
                Cards
              </Button>
              <Button
                variant={viewMode === 'map' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('map')}
              >
                <Map className="w-4 h-4" />
                Map
              </Button>
            </div>
          </div>
        </div>
        )}
        
        {/* Regular results - Only show when no search term */}
        {!searchTerm && (
          <>
            {viewMode === 'map' ? (
              <div className="space-y-4">
                <GoogleMap 
                  businesses={filteredBusinesses}
                  selectedBusiness={selectedBusiness}
                  onBusinessSelect={(business) => setSelectedBusiness(business)}
                />
                {selectedBusiness && (
                  <Card>
                    <CardContent className="pt-6">
                      <BusinessListingCard business={selectedBusiness} />
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : viewMode === 'table' ? (
              <BusinessTable businesses={filteredBusinesses} />
            ) : loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[...Array(6)].map((_, i) => (
                  <BusinessCardSkeleton key={i} />
                ))}
              </div>
            ) : filteredBusinesses.length > 0 ? (
              <div className="space-y-6">
                {groupedBusinesses.map((categoryGroup) => (
                  <CategoryAccordion key={categoryGroup.category} categoryGroup={categoryGroup} />
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <div className="mb-4">
                  <div className="w-16 h-16 bg-muted rounded-full mx-auto mb-4 flex items-center justify-center">
                    <MapPin className="w-8 h-8 text-muted-foreground" />
                  </div>
                  <h3 className="text-xl font-semibold text-foreground mb-2">No results found</h3>
                  <p className="text-muted-foreground">
                    Try different search terms or browse all available options.
                  </p>
                </div>
                <Button onClick={() => {
                  setSearchTerm("");
                  setSelectedCategory("");
                  setSelectedIsland("");
                  setHasWhatsApp(false);
                  setShowFeatured(false);
                }}>
                  Show All Results
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Edit Business Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Business</DialogTitle>
            <DialogDescription>
              Update your business information. Changes will be reflected immediately.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-name" className="text-right">
                Name
              </Label>
              <Input
                id="edit-name"
                value={editForm.name}
                onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-description" className="text-right">
                Description
              </Label>
              <Textarea
                id="edit-description"
                value={editForm.description}
                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                className="col-span-3"
                rows={3}
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-phone" className="text-right">
                Phone
              </Label>
              <Input
                id="edit-phone"
                value={editForm.phone}
                onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-email" className="text-right">
                Email
              </Label>
              <Input
                id="edit-email"
                type="email"
                value={editForm.email}
                onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-website" className="text-right">
                Website
              </Label>
              <Input
                id="edit-website"
                type="url"
                value={editForm.website}
                onChange={(e) => setEditForm({ ...editForm, website: e.target.value })}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-island" className="text-right">
                Island
              </Label>
              <Select
                value={editForm.island}
                onValueChange={(value) => setEditForm({ ...editForm, island: value })}
              >
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select island" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Mahé">Mahé</SelectItem>
                  <SelectItem value="Praslin">Praslin</SelectItem>
                  <SelectItem value="La Digue">La Digue</SelectItem>
                  <SelectItem value="Silhouette">Silhouette</SelectItem>
                  <SelectItem value="Curieuse">Curieuse</SelectItem>
                  <SelectItem value="Bird">Bird</SelectItem>
                  <SelectItem value="Denis">Denis</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="edit-address">Address</Label>
              <div className="flex gap-2">
                <Input
                  id="edit-address"
                  value={editForm.address}
                  onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                  placeholder="Enter your business address"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleGeocodeAddress(editForm.address)}
                  disabled={!editForm.address.trim()}
                  className="flex items-center gap-1"
                >
                  <MapPin className="w-4 h-4" />
                  Get Location
                </Button>
              </div>
              {editForm.latitude && editForm.longitude && (
                <div className="mt-2 space-y-2">
                  <div className="p-2 bg-muted rounded-md">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Navigation className="w-4 h-4" />
                      <span>Location: {editForm.latitude.toFixed(6)}, {editForm.longitude.toFixed(6)}</span>
                    </div>
                  </div>
                  <div className="h-32">
                    <BusinessLocationMap
                      business={{
                        id: 'preview',
                        name: editForm.name || 'Business Location',
                        address: editForm.address,
                        latitude: editForm.latitude,
                        longitude: editForm.longitude,
                        island: editForm.island
                      }}
                      height="128px"
                      showTitle={false}
                    />
                  </div>
                </div>
              )}
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-facebook" className="text-right">
                Facebook
              </Label>
              <Input
                id="edit-facebook"
                type="url"
                value={editForm.facebook_url}
                onChange={(e) => setEditForm({ ...editForm, facebook_url: e.target.value })}
                className="col-span-3"
                placeholder="https://facebook.com/yourpage"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-instagram" className="text-right">
                Instagram
              </Label>
              <Input
                id="edit-instagram"
                type="url"
                value={editForm.instagram_url}
                onChange={(e) => setEditForm({ ...editForm, instagram_url: e.target.value })}
                className="col-span-3"
                placeholder="https://instagram.com/yourprofile"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-linkedin" className="text-right">
                LinkedIn
              </Label>
              <Input
                id="edit-linkedin"
                type="url"
                value={editForm.linkedin_url}
                onChange={(e) => setEditForm({ ...editForm, linkedin_url: e.target.value })}
                className="col-span-3"
                placeholder="https://linkedin.com/company/yourcompany"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="edit-youtube" className="text-right">
                YouTube
              </Label>
              <Input
                id="edit-youtube"
                type="url"
                value={editForm.youtube_url}
                onChange={(e) => setEditForm({ ...editForm, youtube_url: e.target.value })}
                className="col-span-3"
                placeholder="https://youtube.com/channel/yourchannel"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveBusiness}>
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Map Modal */}
      {selectedBusinessForMap && (
        <Suspense fallback={
          <div className="flex items-center justify-center h-96">
            <div className="flex flex-col items-center gap-4">
              <Loader2 className="w-8 h-8 animate-spin" />
              <p className="text-muted-foreground">Loading map...</p>
            </div>
          </div>
        }>
          <MapModal
            isOpen={mapModalOpen}
            onClose={() => {
              setMapModalOpen(false);
              setSelectedBusinessForMap(null);
            }}
            businessName={selectedBusinessForMap.name}
            latitude={selectedBusinessForMap.latitude!}
            longitude={selectedBusinessForMap.longitude!}
            address={selectedBusinessForMap.address}
          />
        </Suspense>
      )}
    </div>
  );
};

export default Directory;