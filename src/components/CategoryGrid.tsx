import React, { useState, useEffect, useRef } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import OptimizedImage from "@/components/OptimizedImage";
import { useToast } from "@/hooks/use-toast";
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
  name: string;
  slug?: string; // May not exist in schema
  description: string | null;
  is_active: boolean;
}

interface CategoryWithCount extends Category {
  slug: string; // Generated from name if not in DB
  count: number;
  businessCount: number;
  productCount: number;
}

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

const getImageForCategory = (slug: string): string => {
  const imageMap: Record<string, string> = {
    accommodation: accommodationImg,
    food: foodImg,
    tours: toursImg,
    transport: transportImg,
    retail: retailImg,
    services: servicesImg,
    entertainment: entertainmentImg,
    other: foodImg
  };
  
  return imageMap[slug] || foodImg;
};

const CategoryGrid = () => {
  const { toast } = useToast();
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);
  const abortControllerRef = useRef<AbortController | null>(null);

  const fetchCategoriesWithCounts = async () => {
    // Cancel previous request if still pending
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    
    // Create new AbortController for this request
    abortControllerRef.current = new AbortController();
    const signal = abortControllerRef.current.signal;
    
    try {
      setLoading(true);
      
      // Fetch categories with error handling
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('id, name, description, is_active, created_at')
        .eq('is_active', true)
        .order('name', { ascending: true });

      if (categoriesError) {
        console.error('[CategoryGrid] Failed to load categories', categoriesError);
        toast({
          title: 'Error',
          description: 'Failed to load categories. Please try again.',
          variant: 'destructive',
        });
        throw categoriesError;
      }

      // Use fallback empty arrays if no data
      const categories = categoriesData || [];

      // Fetch business counts via business_categories join
      const { data: activeBusinesses, error: businessError } = await supabase
        .from('businesses')
        .select(`
          id,
          business_categories (
            category_id
          )
        `)
        .eq('status', 'active');

      if (businessError) {
        console.error('Business counts error:', businessError);
        if (import.meta.env.DEV) {
          console.error('   Error details:', JSON.stringify(businessError, null, 2));
        }
      }

      // Fetch product counts - products don't have category field
      const { data: productsData, error: productError } = await supabase
        .from('products')
        .select('business_id');

      if (productError) {
        console.error('Product counts error:', productError);
        if (import.meta.env.DEV) {
          console.error('   Error details:', JSON.stringify(productError, null, 2));
        }
      }

      // Count businesses by category_id
      const businessCountMap: Record<string, number> = {};
      if (activeBusinesses) {
        activeBusinesses.forEach((business: any) => {
          const businessCategories = business.business_categories || [];
          businessCategories.forEach((bc: any) => {
            const categoryId = bc.category_id;
            if (categoryId) {
              businessCountMap[categoryId] = (businessCountMap[categoryId] || 0) + 1;
            }
          });
        });
      }

      // Count products by category_id via business_categories
      const productCountMap: Record<string, number> = {};
      if (productsData && productsData.length > 0) {
        const businessIds = [...new Set(productsData.map((p: any) => p.business_id).filter(Boolean))];
        
        if (businessIds.length > 0) {
          const { data: productBusinessCategories, error: pbcError } = await supabase
            .from('business_categories')
            .select('business_id, category_id')
            .in('business_id', businessIds);

          if (!pbcError && productBusinessCategories) {
            productsData.forEach((product: any) => {
              const productBusinessCats = productBusinessCategories.filter(
                (pbc: any) => pbc.business_id === product.business_id
              );
              productBusinessCats.forEach((pbc: any) => {
                const categoryId = pbc.category_id;
                if (categoryId) {
                  productCountMap[categoryId] = (productCountMap[categoryId] || 0) + 1;
                }
              });
            });
          }
        }
      }

      // Combine data with safe fallbacks - generate slug from name if missing
      const categoriesWithCounts = categories.map(category => {
        const categoryId = category.id;
        const slug = category.slug || category.name.toLowerCase().replace(/\s+/g, '-');
        const businessCount = businessCountMap[categoryId] || 0;
        const productCount = productCountMap[categoryId] || 0;
        const count = businessCount + productCount;
        
        return {
          ...category,
          slug,
          businessCount,
          productCount,
          count
        };
      });

      // Show all categories, even with zero counts for better UX
      if (!signal.aborted) {
        setCategories(categoriesWithCounts);
      }
    } catch (error) {
      // Don't set error if request was aborted
      if (signal.aborted) return;
      
      console.error('Error fetching categories:', error);
      // Set empty array as fallback
      setCategories([]);
    } finally {
      if (!signal.aborted) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    fetchCategoriesWithCounts();
    
    return () => {
      // Cancel any pending requests
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  const handleCategoryClick = (category: CategoryWithCount) => {
    // Navigate to directory with category filter
    window.location.href = `/directory?category=${category.slug}`;
  };

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
            {[...Array(8)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardContent className="p-6 text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-muted"></div>
                  <div className="h-4 bg-muted rounded w-3/4 mx-auto mb-2"></div>
                  <div className="h-3 bg-muted rounded w-1/2 mx-auto"></div>
                </CardContent>
              </Card>
            ))}
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
          {!categories || categories.length === 0 ? null : categories.map((category, index) => {
            const IconComponent = getIconForCategory(category.slug);
            const colorGradient = getColorForCategory(index);
            // Use default image mapping (image_url column doesn't exist in categories table)
            const categoryImage = getImageForCategory(category.slug);
            
            return (
              <Card 
                key={category.id}
                className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s`, boxShadow: 'var(--card-shadow)' }}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="relative h-32 overflow-hidden">
                  <OptimizedImage
                    src={categoryImage}
                    alt={category.name}
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
                    {category.name}
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
          })}
        </div>
        
        {categories.length === 0 && !loading && (
          <div className="text-center py-12">
            <div className="bg-muted/30 rounded-lg p-8">
              <p className="text-muted-foreground mb-2">No categories available yet</p>
              <p className="text-sm text-muted-foreground">Categories will appear here as businesses are added to the directory.</p>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};

export default CategoryGrid;