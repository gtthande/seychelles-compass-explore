import React, { lazy, Suspense, useCallback, useMemo, useEffect, useState } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LiveCounters from "@/components/OptimizedLiveCounters";
import BusinessSearch from "@/components/BusinessSearch";
import { CategorySkeleton, FeaturedSkeleton, BusinessCardSkeletonLight } from "@/components/LoadingSkeleton";

// Lazy load heavy components with error handling - Defer non-critical components
const CategoryGrid = lazy(() => import("@/components/OptimizedCategoryGrid"));
const FeaturedListings = lazy(() => import("@/components/OptimizedFeaturedListings"));
const SearchFilter = lazy(() => import("@/components/SearchFilter"));

// SAFETY: Error boundary component for lazy loading failures
// FALLBACK: Prevents blank screens if lazy-loaded components fail to load
// Memoized to prevent unnecessary re-renders
const LazyErrorBoundary = React.memo(({ children, fallback }: { children: React.ReactNode; fallback: React.ReactNode }) => {
  const [hasError, setHasError] = React.useState(false);

  React.useEffect(() => {
    const handleError = () => setHasError(true);
    window.addEventListener('error', handleError);
    return () => window.removeEventListener('error', handleError);
  }, []);

  // FALLBACK: Render skeleton/placeholder instead of crashing
  if (hasError) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
});


const Index = () => {
  const [showDeferredComponents, setShowDeferredComponents] = useState(false);
  
  // Defer non-critical components until after main content loads
  useEffect(() => {
    // Preload CategoryGrid immediately for faster loading
    const categoryGridPromise = import("@/components/OptimizedCategoryGrid");
    
    const timer = setTimeout(() => {
      setShowDeferredComponents(true);
    }, 50); // Reduced delay for faster loading
    
    return () => clearTimeout(timer);
  }, []);

  // Memoize the empty function to prevent SearchFilter re-renders
  const handleFiltersChange = useCallback(() => {
    // Empty function - no action needed for this component
  }, []);
  
  // Memoize static content to prevent unnecessary re-renders
  const staticContent = useMemo(() => (
    <div className="text-center mb-12">
      <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
        Find Local Businesses & Products
      </h2>
      <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
        Discover trusted businesses and quality products throughout Seychelles
      </p>
    </div>
  ), []);

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <LiveCounters />
      </div>
      
      {/* Critical content loads immediately */}
      <LazyErrorBoundary fallback={<CategorySkeleton />}>
        <Suspense fallback={<CategorySkeleton />}>
          <CategoryGrid />
        </Suspense>
      </LazyErrorBoundary>
      
      {/* Enhanced Search and Directory Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          {staticContent}
          
          {/* Global Business Search */}
          <div className="max-w-2xl mx-auto mb-8">
            <BusinessSearch 
              placeholder="Search for any business by name..."
              className="w-full"
            />
          </div>
          
          {/* Defer SearchFilter to reduce initial load */}
          {showDeferredComponents ? (
            <LazyErrorBoundary fallback={<div className="animate-pulse h-32 bg-muted rounded-lg"></div>}>
              <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg"></div>}>
                <SearchFilter onFiltersChange={handleFiltersChange} />
              </Suspense>
            </LazyErrorBoundary>
          ) : (
            <div className="animate-pulse h-32 bg-muted rounded-lg"></div>
          )}
        </div>
      </section>
      
      {/* Defer FeaturedListings to reduce initial load */}
      {showDeferredComponents ? (
        <LazyErrorBoundary fallback={<FeaturedSkeleton />}>
          <Suspense fallback={<FeaturedSkeleton />}>
            <FeaturedListings />
          </Suspense>
        </LazyErrorBoundary>
      ) : (
        <FeaturedSkeleton />
      )}
      
      <Footer />
    </div>
  );
};

export default Index;
