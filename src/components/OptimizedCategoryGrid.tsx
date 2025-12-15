import React, { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { useToast } from "@/hooks/use-toast";
import { notifySupabaseError } from "@/lib/supabase-error-handler";
import { 
  Store, 
  UtensilsCrossed, 
  Plane, 
  Building, 
  Car, 
  Heart, 
  GraduationCap, 
  Wrench,
  Camera,
  Waves,
  Calendar,
  Gift,
  Package,
  Briefcase
} from "lucide-react";

// Import the generated category images
import accommodationImg from '@/assets/category-accommodation.jpg';
import foodImg from '@/assets/category-food.jpg';
import toursImg from '@/assets/category-tours.jpg';
import transportImg from '@/assets/category-transport.jpg';
import retailImg from '@/assets/category-retail.jpg';
import servicesImg from '@/assets/category-services.jpg';
import entertainmentImg from '@/assets/category-entertainment.jpg';

interface Category {
  id: string;
  title: string;
  slug?: string; // May not exist in schema
  description: string | null;
  is_active: boolean;
}

interface CategoryWithCount extends Category {
  slug: string; // Generated from title if not in DB
  count: number;
  businessCount: number;
  productCount: number;
}

// Memoized icon mapping to prevent recreation on every render
const getIconForCategory = (slug: string) => {
  const iconMap: Record<string, any> = {
    food: UtensilsCrossed,
    accommodation: Building,
    tours: Plane,
    transport: Car,
    retail: Store,
    services: Wrench,
    entertainment: Camera,
    wellness: Heart,
    education: GraduationCap,
    events: Calendar,
    products: Package,
    professional: Briefcase,
    'water-sports': Waves,
    gifts: Gift,
  };
  
  return iconMap[slug] || Store;
};

// Memoized color mapping
const getColorForCategory = (index: number) => {
  const colors = [
    "from-primary to-primary-dark",
    "from-orange-400 to-orange-600",
    "from-blue-400 to-blue-600",
    "from-purple-400 to-purple-600",
    "from-green-400 to-green-600",
    "from-pink-400 to-pink-600",
    "from-indigo-400 to-indigo-600",
    "from-gray-400 to-gray-600",
    "from-red-400 to-red-600",
    "from-teal-400 to-teal-600",
    "from-yellow-400 to-yellow-600",
    "from-rose-400 to-rose-600"
  ];
  
  return colors[index % colors.length];
};

// Memoized image mapping
const getImageForCategory = (slug: string): string => {
  const imageMap: Record<string, string> = {
    accommodation: accommodationImg,
    food: foodImg,
    tours: toursImg,
    // Helicopter on tropical island for transportation in Seychelles
    transport: 'https://images.unsplash.com/photo-1583212292454-1fe6229603b7?w=800&h=600&fit=crop&q=80',
    retail: retailImg,
    services: servicesImg,
    entertainment: entertainmentImg,
    // Yoga/fitness image for health & wellness (woman exercising)
    wellness: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=600&fit=crop&q=80',
    other: foodImg
  };
  
  return imageMap[slug] || foodImg;
};

// Memoized CategoryCard component to prevent unnecessary re-renders
const CategoryCard = React.memo(({ 
  category, 
  index, 
  onCategoryClick 
}: { 
  category: CategoryWithCount; 
  index: number; 
  onCategoryClick: (category: CategoryWithCount) => void;
}) => {
  const IconComponent = useMemo(() => getIconForCategory(category.slug), [category.slug]);
  const colorGradient = useMemo(() => getColorForCategory(index), [index]);
  // Use default image mapping (image_url column doesn't exist in categories table)
  const categoryImage = useMemo(() => {
    return getImageForCategory(category.slug);
  }, [category.slug]);
  
  const handleClick = useCallback(() => {
    onCategoryClick(category);
  }, [category, onCategoryClick]);
  
  return (
    <Card 
      className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 animate-fade-in overflow-hidden"
      style={{ animationDelay: `${index * 0.1}s`, boxShadow: 'var(--card-shadow)' }}
      onClick={handleClick}
    >
      <div className="relative h-32 overflow-hidden">
        <OptimizedImage
          src={categoryImage}
          alt={category.title}
          width={300}
          height={128}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
          sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
          loading="lazy"
          fallback={
            <div className="w-full h-full bg-gradient-to-br from-primary/20 to-secondary/20 flex items-center justify-center">
              <IconComponent className="h-12 w-12 text-primary/60" />
            </div>
          }
        />
        <div className={`hidden w-full h-full bg-gradient-to-br ${colorGradient} flex items-center justify-center`}>
          <IconComponent className="h-12 w-12 text-white" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
        <div className={`absolute top-3 left-3 w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center shadow-lg`}>
          <IconComponent className="h-5 w-5 text-white" />
        </div>
      </div>
      
      <CardContent className="p-4 text-center">
        <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
          {category.title}
        </h3>
        
        <div className="text-sm text-muted-foreground space-y-1">
          <p>{category.count} total listings</p>
          <div className="flex justify-center gap-2 text-xs">
            {category.businessCount > 0 && (
              <span>{category.businessCount} businesses</span>
            )}
            {category.productCount > 0 && (
              <span>{category.productCount} products</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
});

CategoryCard.displayName = 'CategoryCard';

const OptimizedCategoryGrid = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const abortControllerRef = useRef<AbortController | null>(null);

  // Memoized fetch function to prevent recreation
  const fetchCategoriesWithCounts = useCallback(async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    const startTime = performance.now();
    
    if (import.meta.env.DEV) {
      console.debug('[Home] CategoryGrid: Starting data fetch...');
    }
    
    // Track if categories loaded successfully
    let categoriesLoadedSuccessfully = false;
    let categories: any[] = [];
    
    try {
      setLoading(true);
      setError(null);
      
      // Fetch categories
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, title, slug, description, is_active, created_at')
        .eq('is_active', true) // Filter active categories
        .order('title', { ascending: true });

      if (import.meta.env.DEV) {
        console.log('[HOMEPAGE] categories returned:', categoriesData, 'error:', categoriesError);
      }

      // Treat as SUCCESS if data exists AND is an array
      if (categoriesData && Array.isArray(categoriesData)) {
        categoriesLoadedSuccessfully = true;
        categories = categoriesData;
      } else if (categoriesError) {
        // Only treat as error if categories query failed AND no data exists
        // Use console.warn for consistency with reduced error logging
        console.warn('[CategoryGrid] Categories query failed:', categoriesError.message || 'Unknown error');
        if (import.meta.env.DEV) {
          console.warn('   Error details:', JSON.stringify(categoriesError, null, 2));
        }
        notifySupabaseError('Failed to load categories', categoriesError);
        setCategories([]);
        setLoading(false);
        setError(categoriesError.message || 'Failed to load categories');
        return; // Exit early, don't throw to avoid catch block
      } else {
        // No error but no data - empty array is valid
        categories = [];
        categoriesLoadedSuccessfully = true;
      }
      
      if (categories && categories.length === 0 && import.meta.env.DEV) {
        console.warn('[HOMEPAGE] categories table is EMPTY');
      }
      
      if (import.meta.env.DEV) {
        console.debug('[Home] CategoryGrid: Loaded categories', { 
          count: categories.length, 
          categories: categories.map(c => ({ id: c.id, title: c.title }))
        });
      }

      // Fetch business counts via direct category_id FK
      // SCHEMA NOTE: Uses businesses.category_id (direct FK), not business_categories join table
      // TODO: category_id column may not exist on all businesses - handled gracefully below
      const { data: activeBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select('id, category_id')
        .eq('status', 'active');

      if (businessError) {
        // SAFETY: Non-fatal error - category counts will show 0 instead of crashing
        console.error('🚨 CategoryGrid: Business counts query failed:', businessError);
        if (import.meta.env.DEV) {
          console.error('   Error details:', JSON.stringify(businessError, null, 2));
        }
      }

      // Count businesses by category_id directly
      const businessCountMap: Record<string, number> = {};
      if (activeBusinesses) {
        activeBusinesses.forEach((business: any) => {
          const categoryId = business.category_id;
          if (categoryId) {
            businessCountMap[categoryId] = (businessCountMap[categoryId] || 0) + 1;
          }
        });
      }

      // Product counts: Products don't have category_id, they're linked via business_products -> businesses -> category_id
      // FALLBACK: Safely defaults to 0 for product counts per category if query fails
      // SCHEMA NOTE: Complex join required: business_products -> businesses -> category_id
      // TODO: This is optional and may fail - handled gracefully with try-catch below
      const productCountMap: Record<string, number> = {};
      
      // FALLBACK: Attempt to count products via business_products -> businesses -> category_id
      // SAFETY: This query is optional - failures are non-fatal and logged as warnings
      try {
        const { data: businessProductsData, error: productError } = await supabase
          .from('business_products')
          .select(`
            is_active,
            business:businesses (
              category_id,
              status
            )
          `)
          .eq('is_active', true);

        if (productError) {
          if (import.meta.env.DEV) {
            console.warn('[CategoryGrid] Product counts query failed (non-critical):', productError.message);
          }
        } else if (businessProductsData && businessProductsData.length > 0) {
          businessProductsData.forEach((bp: any) => {
            // Only count if business is active and has a category_id
            if (bp.business?.status === 'active' && bp.business?.category_id) {
              const categoryId = bp.business.category_id;
              productCountMap[categoryId] = (productCountMap[categoryId] || 0) + 1;
            }
          });
        }
      } catch (err: any) {
        // SAFETY: Silently fail - product counts are optional and non-critical
        // FALLBACK: Product counts will show 0 instead of crashing the component
        if (import.meta.env.DEV) {
          console.warn('[CategoryGrid] Product counting failed (non-critical):', err.message);
        }
      }

      // Process the data - show all categories even with zero counts
      const categoriesWithCounts = categories.map(category => {
        const categoryId = category.id;
        const businessCount = businessCountMap[categoryId] || 0;
        const productCount = productCountMap[categoryId] || 0;
        const count = businessCount + productCount;
        
        return {
          ...category,
          slug: category.slug || category.title.toLowerCase().replace(/\s+/g, '-'), // Generate slug from title if missing
          businessCount,
          productCount,
          count
        };
      });

      const endTime = performance.now();
      
      if (import.meta.env.DEV) {
        console.debug('[Home] CategoryGrid: Data fetch completed', {
          duration: `${(endTime - startTime).toFixed(2)}ms`,
          categoriesCount: categoriesWithCounts.length,
          totalBusinesses: Object.values(businessCountMap).reduce((a, b) => a + b, 0),
          totalProducts: Object.values(productCountMap).reduce((a, b) => a + b, 0)
        });
      }

      if (!signal.aborted) {
        setCategories(categoriesWithCounts);
        setLoading(false);
        // Clear any previous error state since we have successful data
        setError(null);
      }
    } catch (err: any) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      // Only set error if categories didn't load successfully
      // If categories loaded successfully, treat as success even if other queries failed
      if (!categoriesLoadedSuccessfully || categories.length === 0) {
        // Use console.warn instead of console.error for consistency
        console.warn('[CategoryGrid] Failed to load categories:', err?.message || 'Unknown error');
        const errorMessage = err?.message || 'Failed to load categories';
        setError(errorMessage);
        notifySupabaseError('Failed to load categories', err);
        setCategories([]);
      } else {
        // Categories loaded successfully, don't show error
        if (import.meta.env.DEV) {
          console.warn('[CategoryGrid] Non-critical error after successful category load:', err?.message);
        }
        // Still set the categories we successfully loaded
        const categoriesWithCounts = categories.map(category => {
          const categoryId = category.id;
          return {
            ...category,
            slug: category.slug || category.title.toLowerCase().replace(/\s+/g, '-'),
            businessCount: 0,
            productCount: 0,
            count: 0
          };
        });
        setCategories(categoriesWithCounts);
      }
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (import.meta.env.DEV) {
      console.debug('[Home] CategoryGrid: Component mounting...');
    }
    
    fetchCategoriesWithCounts();
    
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, [fetchCategoriesWithCounts]);

  // Memoized click handler
  const handleCategoryClick = useCallback((category: CategoryWithCount) => {
    // Navigate to directory with category filter
    window.location.href = `/directory?category=${category.slug}`;
  }, []);

  // Memoized skeleton component
  const skeletonCards = useMemo(() => (
    [...Array(8)].map((_, i) => (
      <Card key={i} className="animate-pulse">
        <CardContent className="p-6 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted"></div>
          <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
          <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
        </CardContent>
      </Card>
    ))
  ), []);

  // Show skeleton only while loading
  if (loading) {
    return (
      <section className="py-20 bg-gradient-to-b from-background to-accent">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
              Explore by Category
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Discover the best businesses and services across Seychelles, organized by category
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {skeletonCards}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-gradient-to-b from-background to-accent">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Explore by Category
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the best businesses and services across Seychelles, organized by category
          </p>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {categories.map((category, index) => (
            <CategoryCard
              key={category.id}
              category={category}
              index={index}
              onCategoryClick={handleCategoryClick}
            />
          ))}
        </div>
        
        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-muted/30 rounded-lg p-8">
              {error ? (
                <>
                  <p className="text-destructive mb-2">Failed to load categories</p>
                  <p className="text-sm text-muted-foreground">{error}</p>
                </>
              ) : (
                <>
                  <p className="text-muted-foreground mb-2">No categories available yet</p>
                  <p className="text-sm text-muted-foreground">Categories will appear here as businesses are added to the directory.</p>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default OptimizedCategoryGrid;
