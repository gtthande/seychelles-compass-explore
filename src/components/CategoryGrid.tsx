import { Card, CardContent } from "@/components/ui/card";
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
  Gift
} from "lucide-react";

const categories = [
  { icon: Store, name: "Retail & Shopping", count: 85, color: "from-primary to-primary-dark" },
  { icon: UtensilsCrossed, name: "Restaurants & Dining", count: 120, color: "from-orange-400 to-orange-600" },
  { icon: Plane, name: "Tourism & Travel", count: 65, color: "from-blue-400 to-blue-600" },
  { icon: Building, name: "Accommodation", count: 45, color: "from-purple-400 to-purple-600" },
  { icon: Car, name: "Transport & Rental", count: 32, color: "from-green-400 to-green-600" },
  { icon: Heart, name: "Health & Wellness", count: 28, color: "from-pink-400 to-pink-600" },
  { icon: GraduationCap, name: "Education", count: 22, color: "from-indigo-400 to-indigo-600" },
  { icon: Wrench, name: "Professional Services", count: 78, color: "from-gray-400 to-gray-600" },
  { icon: Camera, name: "Entertainment", count: 34, color: "from-red-400 to-red-600" },
  { icon: Waves, name: "Water Sports", count: 56, color: "from-teal-400 to-teal-600" },
  { icon: Calendar, name: "Events", count: 18, color: "from-yellow-400 to-yellow-600" },
  { icon: Gift, name: "Local Products", count: 67, color: "from-rose-400 to-rose-600" }
];

const CategoryGrid = () => {
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
            <Card 
              key={category.name}
              className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <CardContent className="p-6 text-center">
                <div className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${category.color} flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <category.icon className="h-8 w-8 text-white" />
                </div>
                
                <h3 className="font-semibold text-foreground mb-2 group-hover:text-primary transition-colors">
                  {category.name}
                </h3>
                
                <p className="text-sm text-muted-foreground">
                  {category.count} listings
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default CategoryGrid;