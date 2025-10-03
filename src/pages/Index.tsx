import React, { lazy, Suspense, useEffect } from "react";
import Navbar from "@/components/Navbar";
import Hero from "@/components/Hero";
import Footer from "@/components/Footer";
import LiveCounters from "@/components/LiveCounters";
import BusinessSearch from "@/components/BusinessSearch";
import { CategorySkeleton, FeaturedSkeleton } from "@/components/LoadingSkeleton";

// Lazy load heavy components
const CategoryGrid = lazy(() => import("@/components/CategoryGrid"));
const FeaturedListings = lazy(() => import("@/components/FeaturedListings"));
const SearchFilter = lazy(() => import("@/components/SearchFilter"));

// Performance profiling utility
const perfLog = (label: string, startTime?: number) => {
  if (startTime) {
    const duration = performance.now() - startTime;
    console.log(`⏱️  ${label}: ${duration.toFixed(2)}ms`);
    if (duration > 1000) {
      console.warn(`🐌 SLOW OPERATION: ${label} took ${duration.toFixed(2)}ms`);
    }
  } else {
    console.log(`🚀 Starting: ${label}`);
    return performance.now();
  }
};

const Index = () => {
  const pageStartTime = perfLog('Index page render start');
  
  // Enhanced error logging for debugging
  console.log('🏠 Index component initializing...');
  
  useEffect(() => {
    console.log('🏠 Index component mounted successfully');
    perfLog('Index page fully loaded', pageStartTime);
  }, []);

  // Add error boundary for this specific page
  try {
    return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <div className="container mx-auto px-4 py-8">
        <LiveCounters />
      </div>
      <Suspense fallback={<CategorySkeleton />}>
        <CategoryGrid />
      </Suspense>
      
      {/* Enhanced Search and Directory Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-foreground">
              Find Local Businesses & Products
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
              Discover trusted businesses and quality products throughout Seychelles
            </p>
            
            {/* Global Business Search */}
            <div className="max-w-2xl mx-auto mb-8">
              <BusinessSearch 
                placeholder="Search for any business by name..."
                className="w-full"
              />
            </div>
          </div>
          <Suspense fallback={<div className="animate-pulse h-32 bg-muted rounded-lg"></div>}>
            <SearchFilter onFiltersChange={() => {}} />
          </Suspense>
        </div>
      </section>
      
      <Suspense fallback={<FeaturedSkeleton />}>
        <FeaturedListings />
      </Suspense>
      <Footer />
    </div>
    );
  } catch (error) {
    console.error('🚨 Index component error:', error);
    return (
      <div className="min-h-screen flex items-center justify-center bg-background p-4">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-red-600 mb-4">Index Page Error</h1>
          <p className="text-gray-600 mb-4">There was an error loading the main page.</p>
          <pre className="text-sm text-gray-500 bg-gray-100 p-4 rounded">
            {error instanceof Error ? error.message : 'Unknown error'}
          </pre>
        </div>
      </div>
    );
  }
};

export default Index;
