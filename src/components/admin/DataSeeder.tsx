import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Database } from "@/integrations/supabase/types";
import { Loader2, Database as DatabaseIcon, CheckCircle, AlertTriangle } from "lucide-react";

type Business = Database['public']['Tables']['businesses']['Insert'];
type Product = Database['public']['Tables']['products']['Insert'];
type Profile = Database['public']['Tables']['profiles']['Insert'];

const DataSeeder = () => {
  const [loading, setLoading] = useState(false);
  const [seeded, setSeeded] = useState(false);
  const { toast } = useToast();

  // Demo data
  const demoBusinesses: Business[] = [
    {
      name: "Paradise Dive Center",
      description: "Professional diving services in the beautiful waters of Seychelles. We offer PADI courses, equipment rental, and guided dives to the best spots around the islands.",
      category: "tourism",
      status: "active",
      owner_id: "00000000-0000-0000-0000-000000000001", // Demo owner ID
      phone: "+248 2 123 456",
      whatsapp: "+248 2 123 456",
      email: "info@paradisedive.sc",
      website: "https://paradisedive.sc",
      facebook_url: "https://facebook.com/paradisedive",
      instagram_url: "https://instagram.com/paradisedive",
      address: "Beau Vallon Beach, Mahé",
      island: "Mahé",
      latitude: -4.6167,
      longitude: 55.4500,
      services: ["Scuba Diving", "PADI Courses", "Equipment Rental", "Boat Trips"],
      opening_hours: {
        monday: "8:00 AM - 6:00 PM",
        tuesday: "8:00 AM - 6:00 PM",
        wednesday: "8:00 AM - 6:00 PM",
        thursday: "8:00 AM - 6:00 PM",
        friday: "8:00 AM - 6:00 PM",
        saturday: "8:00 AM - 4:00 PM",
        sunday: "Closed"
      },
      featured: true,
      verified: true,
      average_rating: 4.8,
      total_reviews: 24
    },
    {
      name: "Seychelles Spice Café",
      description: "Authentic Seychellois cuisine with a modern twist. We serve traditional dishes made with fresh local ingredients and spices.",
      category: "restaurants",
      status: "active",
      owner_id: "00000000-0000-0000-0000-000000000002", // Demo owner ID
      phone: "+248 2 234 567",
      whatsapp: "+248 2 234 567",
      email: "hello@spicecafe.sc",
      website: "https://spicecafe.sc",
      facebook_url: "https://facebook.com/spicecafe",
      instagram_url: "https://instagram.com/spicecafe",
      address: "Victoria Market, Mahé",
      island: "Mahé",
      latitude: -4.6200,
      longitude: 55.4500,
      services: ["Traditional Cuisine", "Catering", "Cooking Classes", "Spice Sales"],
      opening_hours: {
        monday: "7:00 AM - 10:00 PM",
        tuesday: "7:00 AM - 10:00 PM",
        wednesday: "7:00 AM - 10:00 PM",
        thursday: "7:00 AM - 10:00 PM",
        friday: "7:00 AM - 11:00 PM",
        saturday: "7:00 AM - 11:00 PM",
        sunday: "8:00 AM - 9:00 PM"
      },
      featured: true,
      verified: true,
      average_rating: 4.6,
      total_reviews: 18
    },
    {
      name: "Praslin Island Tours",
      description: "Discover the natural beauty of Praslin Island with our guided tours. Visit Vallée de Mai, Anse Lazio, and other stunning locations.",
      category: "tourism",
      status: "active",
      owner_id: "00000000-0000-0000-0000-000000000003", // Demo owner ID
      phone: "+248 2 345 678",
      whatsapp: "+248 2 345 678",
      email: "tours@praslin.sc",
      website: "https://praslintours.sc",
      facebook_url: "https://facebook.com/praslintours",
      instagram_url: "https://instagram.com/praslintours",
      address: "Baie Ste Anne, Praslin",
      island: "Praslin",
      latitude: -4.3200,
      longitude: 55.7500,
      services: ["Island Tours", "Nature Walks", "Transportation", "Photography Tours"],
      opening_hours: {
        monday: "8:00 AM - 5:00 PM",
        tuesday: "8:00 AM - 5:00 PM",
        wednesday: "8:00 AM - 5:00 PM",
        thursday: "8:00 AM - 5:00 PM",
        friday: "8:00 AM - 5:00 PM",
        saturday: "8:00 AM - 5:00 PM",
        sunday: "9:00 AM - 4:00 PM"
      },
      featured: false,
      verified: true,
      average_rating: 4.7,
      total_reviews: 15
    }
  ];

  const demoProducts: Product[] = [
    {
      business_id: "", // Will be set after business creation
      name: "PADI Open Water Course",
      description: "Learn to dive with our certified PADI instructors. Complete course includes theory, confined water, and open water dives.",
      category: "Diving Courses",
      price: 450.00,
      currency: "USD",
      in_stock: true,
      stock_quantity: 10,
      featured: true,
      status: "active",
      tags: ["PADI", "Diving", "Course", "Certification"]
    },
    {
      business_id: "", // Will be set after business creation
      name: "Equipment Rental Package",
      description: "Complete diving equipment rental for certified divers. Includes BCD, regulator, wetsuit, mask, fins, and weights.",
      category: "Equipment Rental",
      price: 35.00,
      currency: "USD",
      in_stock: true,
      stock_quantity: 20,
      featured: false,
      status: "active",
      tags: ["Equipment", "Rental", "Diving"]
    },
    {
      business_id: "", // Will be set after business creation
      name: "Traditional Fish Curry",
      description: "Authentic Seychellois fish curry made with fresh local fish, coconut milk, and traditional spices. Served with rice and salad.",
      category: "Main Course",
      price: 25.00,
      currency: "SCR",
      in_stock: true,
      stock_quantity: 50,
      featured: true,
      status: "active",
      tags: ["Traditional", "Fish", "Curry", "Local"]
    },
    {
      business_id: "", // Will be set after business creation
      name: "Cooking Class - Seychellois Cuisine",
      description: "Learn to cook traditional Seychellois dishes with our experienced chefs. Includes ingredients and recipe cards.",
      category: "Experience",
      price: 80.00,
      currency: "USD",
      in_stock: true,
      stock_quantity: 8,
      featured: true,
      status: "active",
      tags: ["Cooking", "Class", "Traditional", "Experience"]
    }
  ];

  const checkExistingData = async () => {
    const { data: businesses } = await supabase
      .from('businesses')
      .select('id, name')
      .limit(1);
    
    return businesses && businesses.length > 0;
  };

  const seedData = async () => {
    setLoading(true);
    
    try {
      // Check if data already exists
      const hasExistingData = await checkExistingData();
      
      if (hasExistingData) {
        toast({
          title: "Data already exists",
          description: "Demo data has already been seeded. Skipping to avoid duplicates.",
          variant: "default",
        });
        setSeeded(true);
        return;
      }

      // Create demo businesses
      const businessIds: string[] = [];
      
      for (const business of demoBusinesses) {
        const { data: newBusiness, error } = await supabase
          .from('businesses')
          .insert(business)
          .select('id')
          .single();

        if (error) {
          console.error('Error creating business:', error);
          throw new Error(`Failed to create business: ${business.name}`);
        }

        if (newBusiness) {
          businessIds.push(newBusiness.id);
        }
      }

      // Create demo products
      const productsWithBusinessIds = demoProducts.map((product, index) => {
        const businessIndex = Math.floor(index / 2); // 2 products per business
        return {
          ...product,
          business_id: businessIds[businessIndex]
        };
      });

      for (const product of productsWithBusinessIds) {
        const { error } = await supabase
          .from('products')
          .insert(product);

        if (error) {
          console.error('Error creating product:', error);
          throw new Error(`Failed to create product: ${product.name}`);
        }
      }

      // Create some demo categories if they don't exist
      const categories = [
        { name: "Diving Courses", slug: "diving-courses", description: "Professional diving courses and certifications" },
        { name: "Equipment Rental", slug: "equipment-rental", description: "Diving and water sports equipment rental" },
        { name: "Traditional Cuisine", slug: "traditional-cuisine", description: "Authentic Seychellois dishes and cooking" },
        { name: "Island Tours", slug: "island-tours", description: "Guided tours and experiences around the islands" }
      ];

      for (const category of categories) {
        const { error } = await supabase
          .from('categories')
          .upsert(category, { onConflict: 'slug' });

        if (error) {
          console.error('Error creating category:', error);
          // Don't throw here as categories might already exist
        }
      }

      setSeeded(true);
      toast({
        title: "Demo data seeded successfully!",
        description: `Created ${demoBusinesses.length} businesses and ${demoProducts.length} products.`,
      });

    } catch (error: unknown) {
      console.error('Seeding error:', error);
      const errorMessage = error instanceof Error ? error.message : "An unexpected error occurred while seeding data.";
      toast({
        title: "Seeding failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <DatabaseIcon className="w-5 h-5" />
          Demo Data Seeder
        </CardTitle>
        <CardDescription>
          Seed the database with demo businesses, products, and categories for testing purposes.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Alert>
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            This will create demo data including businesses, products, and categories. 
            It's safe to run multiple times - existing data will be skipped.
          </AlertDescription>
        </Alert>

        <div className="space-y-2">
          <h4 className="font-medium">Demo Data Includes:</h4>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 3 demo businesses (Paradise Dive Center, Seychelles Spice Café, Praslin Island Tours)</li>
            <li>• 4 demo products (diving courses, equipment rental, traditional cuisine, cooking classes)</li>
            <li>• 4 demo categories (diving, equipment, cuisine, tours)</li>
            <li>• Complete business profiles with contact info, locations, and services</li>
          </ul>
        </div>

        <Button 
          onClick={seedData} 
          disabled={loading || seeded}
          className="w-full"
        >
          {loading ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              Seeding Data...
            </>
          ) : seeded ? (
            <>
              <CheckCircle className="w-4 h-4 mr-2" />
              Data Seeded Successfully
            </>
          ) : (
            <>
              <DatabaseIcon className="w-4 h-4 mr-2" />
              Seed Demo Data
            </>
          )}
        </Button>

        {seeded && (
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              Demo data has been successfully seeded! You can now browse the directory 
              to see the demo businesses and products.
            </AlertDescription>
          </Alert>
        )}
      </CardContent>
    </Card>
  );
};

export default DataSeeder;
