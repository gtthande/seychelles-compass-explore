import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
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
  slug: string;
  description: string | null;
  is_active: boolean;
}

interface CategoryWithCount extends Category {
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
  const [categories, setCategories] = useState<CategoryWithCount[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCategoriesWithCounts();
  }, []);

  const fetchCategoriesWithCounts = async () => {
    try {
      setLoading(true);
      
      // Fetch categories with error handling
      const { data: categoriesData, error: categoriesError } = await supabase
        .from('categories')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (categoriesError) {
        console.error('Categories error:', categoriesError);
        throw categoriesError;
      }

      // Use fallback empty arrays if no data
      const categories = categoriesData || [];

      // Fetch business counts by category with error handling
      const { data: businessCounts, error: businessError } = await supabase
        .from('businesses')
        .select('category')
        .eq('status', 'active');

      if (businessError) {
        console.error('Business counts error:', businessError);
        // Continue with empty array instead of throwing
      }

      // Fetch product counts by category with error handling
      const { data: productCounts, error: productError } = await supabase
        .from('products')
        .select('category, business_id')
        .eq('status', 'active');

      if (productError) {
        console.error('Product counts error:', productError);
        // Continue with empty array instead of throwing
      }

      // Count by category with safe fallbacks
      const businessCountMap = (businessCounts || []).reduce((acc, business) => {
        if (business.category) {
          acc[business.category] = (acc[business.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      const productCountMap = (productCounts || []).reduce((acc, product) => {
        if (product.category) {
          acc[product.category] = (acc[product.category] || 0) + 1;
        }
        return acc;
      }, {} as Record<string, number>);

      // Combine data with safe fallbacks
      const categoriesWithCounts = categories.map(category => ({
        ...category,
        businessCount: businessCountMap[category.slug] || 0,
        productCount: productCountMap[category.slug] || 0,
        count: (businessCountMap[category.slug] || 0) + (productCountMap[category.slug] || 0)
      }));

      // Show all categories, even with zero counts for better UX
      setCategories(categoriesWithCounts);
    } catch (error) {
      console.error('Error fetching categories:', error);
      // Set empty array as fallback
      setCategories([]);
    } finally {
      setLoading(false);
    }
  };

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
          {categories.map((category, index) => {
            const IconComponent = getIconForCategory(category.slug);
            const colorGradient = getColorForCategory(index);
            const categoryImage = getImageForCategory(category.slug);
            
            return (
              <Card 
                key={category.id}
                className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 animate-fade-in overflow-hidden"
                style={{ animationDelay: `${index * 0.1}s`, boxShadow: 'var(--card-shadow)' }}
                onClick={() => handleCategoryClick(category)}
              >
                <div className="relative h-32 overflow-hidden">
                  <img 
                    src={categoryImage} 
                    alt={category.name}
                    className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                    onError={(e) => {
                      // Fallback to gradient background if image fails to load
                      e.currentTarget.style.display = 'none';
                      e.currentTarget.nextElementSibling?.classList.remove('hidden');
                    }}
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