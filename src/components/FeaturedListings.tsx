import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Star, 
  MapPin, 
  Phone, 
  Globe, 
  Facebook, 
  MessageCircle,
  Clock,
  Heart
} from "lucide-react";

const featuredBusinesses = [
  {
    id: 1,
    name: "Paradise Cove Resort",
    category: "Accommodation",
    rating: 4.9,
    reviews: 234,
    location: "Praslin Island",
    phone: "+248 4 232 000",
    website: "paradise-cove.sc",
    facebook: "paradisecoveseychelles",
    whatsapp: "+248 4 232 000",
    description: "Luxury beachfront resort with world-class amenities and stunning ocean views. Perfect for romantic getaways and family vacations.",
    image: "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&crop=center",
    featured: true,
    verified: true,
    openNow: true
  },
  {
    id: 2,
    name: "Creole Flavors Restaurant",
    category: "Dining",
    rating: 4.7,
    reviews: 156,
    location: "Victoria, Mahé",
    phone: "+248 4 225 678",
    website: "creoleflavors.sc",
    facebook: "creoleflavorsSC",
    whatsapp: "+248 4 225 678",
    description: "Authentic Seychellois cuisine with fresh local ingredients. Known for our famous fish curry and tropical fruit desserts.",
    image: "https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=400&h=300&fit=crop&crop=center",
    featured: true,
    verified: true,
    openNow: true
  },
  {
    id: 3,
    name: "Island Adventure Tours",
    category: "Tourism",
    rating: 4.8,
    reviews: 89,
    location: "La Digue",
    phone: "+248 4 234 567",
    website: "islandadventures.sc",
    facebook: "islandadventuresSC",
    whatsapp: "+248 4 234 567",
    description: "Discover the hidden gems of Seychelles with our expert guides. Snorkeling, hiking, and island hopping tours available.",
    image: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=400&h=300&fit=crop&crop=center",
    featured: true,
    verified: true,
    openNow: false
  }
];

const FeaturedListings = () => {
  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">
            Featured Listings
          </Badge>
          <h2 className="text-4xl md:text-5xl font-bold mb-4 text-foreground">
            Top-Rated Businesses
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Discover the most trusted and highly-rated businesses in Seychelles
          </p>
        </div>
        
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {featuredBusinesses.map((business, index) => (
            <Card 
              key={business.id}
              className="group cursor-pointer hover:shadow-card-hover transition-all duration-300 border-border/50 hover:border-primary/30 overflow-hidden animate-slide-up"
              style={{ animationDelay: `${index * 0.2}s` }}
            >
              <div className="relative">
                <img 
                  src={business.image} 
                  alt={business.name}
                  className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                />
                <div className="absolute top-4 left-4 flex gap-2">
                  {business.featured && (
                    <Badge className="bg-primary text-primary-foreground">
                      Featured
                    </Badge>
                  )}
                  {business.verified && (
                    <Badge variant="secondary" className="bg-green-500 text-white">
                      Verified
                    </Badge>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="secondary" 
                  className="absolute top-4 right-4 rounded-full w-10 h-10 p-0 bg-white/80 hover:bg-white"
                >
                  <Heart className="h-4 w-4" />
                </Button>
              </div>
              
              <CardContent className="p-6">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-xl font-semibold text-foreground mb-1 group-hover:text-primary transition-colors">
                      {business.name}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {business.category}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-2">
                    {business.openNow ? (
                      <div className="flex items-center gap-1 text-green-600 text-xs">
                        <Clock className="h-3 w-3" />
                        Open
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-gray-500 text-xs">
                        <Clock className="h-3 w-3" />
                        Closed
                      </div>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2 mb-3">
                  <div className="flex items-center gap-1">
                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                    <span className="font-medium text-foreground">{business.rating}</span>
                  </div>
                  <span className="text-muted-foreground text-sm">
                    ({business.reviews} reviews)
                  </span>
                </div>
                
                <div className="flex items-center gap-1 mb-4 text-muted-foreground">
                  <MapPin className="h-4 w-4" />
                  <span className="text-sm">{business.location}</span>
                </div>
                
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {business.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="outline" className="rounded-full w-9 h-9 p-0">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full w-9 h-9 p-0">
                      <MessageCircle className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full w-9 h-9 p-0">
                      <Globe className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline" className="rounded-full w-9 h-9 p-0">
                      <Facebook className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button variant="default" size="sm" className="bg-primary hover:bg-primary-dark">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
        
        <div className="text-center mt-12">
          <Button size="lg" variant="outline" className="hover:bg-primary hover:text-primary-foreground">
            View All Listings
          </Button>
        </div>
      </div>
    </section>
  );
};

export default FeaturedListings;