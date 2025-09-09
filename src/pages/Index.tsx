import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import LiveCounters from "@/components/LiveCounters";
import SearchFilter from "@/components/SearchFilter";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <LiveCounters />
      </div>
      <CategoryGrid />
      
      {/* Enhanced Search and Directory Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Discover Local Businesses & Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              Search through our comprehensive directory of businesses and products across Seychelles
            </p>
          </div>
          <SearchFilter onFiltersChange={() => {}} />
        </div>
      </section>
      
      <FeaturedListings />
      <Footer />
    </div>
  );
};

export default Index;
