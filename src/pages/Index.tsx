import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import CategoryGrid from "@/components/CategoryGrid";
import FeaturedListings from "@/components/FeaturedListings";
import Footer from "@/components/Footer";
import LiveCounters from "@/components/LiveCounters";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <LiveCounters />
      </div>
      <CategoryGrid />
      <FeaturedListings />
      <Footer />
    </div>
  );
};

export default Index;
