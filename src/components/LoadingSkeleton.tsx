import React from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export const DirectorySkeleton = () => (
  <div className="space-y-4">
    {Array.from({ length: 6 }).map((_, i) => (
      <Card key={i} className="p-4">
        <div className="flex space-x-4">
          <Skeleton className="h-20 w-20 rounded" />
          <div className="space-y-2 flex-1">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </div>
      </Card>
    ))}
  </div>
);

export const CategorySkeleton = () => (
  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
    {Array.from({ length: 4 }).map((_, i) => (
      <div key={i} className="p-4 border rounded-lg">
        <div className="space-y-2">
          <div className="h-8 w-8 bg-muted rounded-full mx-auto animate-pulse" />
          <div className="h-3 w-3/4 bg-muted rounded mx-auto animate-pulse" />
          <div className="h-2 w-1/2 bg-muted rounded mx-auto animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

export const FeaturedSkeleton = () => (
  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
    {Array.from({ length: 2 }).map((_, i) => (
      <div key={i} className="p-4 border rounded-lg">
        <div className="space-y-2">
          <div className="h-24 w-full bg-muted rounded animate-pulse" />
          <div className="h-3 w-3/4 bg-muted rounded animate-pulse" />
          <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
        </div>
      </div>
    ))}
  </div>
);

// Generic loading skeleton for dynamic imports - Lightweight version
export const LoadingSkeleton = () => (
  <div className="flex items-center justify-center p-4">
    <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
  </div>
);

// Lightweight business card skeleton
export const BusinessCardSkeletonLight = () => (
  <div className="p-4 border rounded-lg">
    <div className="space-y-2">
      <div className="h-4 w-3/4 bg-muted rounded animate-pulse" />
      <div className="h-3 w-1/2 bg-muted rounded animate-pulse" />
      <div className="h-3 w-2/3 bg-muted rounded animate-pulse" />
    </div>
  </div>
);

// Map loading skeleton
export const MapSkeleton = () => (
  <div className="flex items-center justify-center h-96 bg-muted/30 rounded-lg">
    <div className="flex flex-col items-center gap-4">
      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
      <p className="text-muted-foreground">Loading map...</p>
    </div>
  </div>
);

// Admin component loading skeleton
export const AdminSkeleton = () => (
  <div className="space-y-6">
    <div className="flex items-center justify-between">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="space-y-2">
            <Skeleton className="h-4 w-3/4" />
            <Skeleton className="h-4 w-1/2" />
            <Skeleton className="h-4 w-2/3" />
          </div>
        </Card>
      ))}
    </div>
  </div>
);

// Default export - you can use any of the skeleton components
const LoadingSkeletonComponents = {
  Directory: DirectorySkeleton,
  Category: CategorySkeleton,
  Featured: FeaturedSkeleton,
  Map: MapSkeleton,
  Admin: AdminSkeleton,
};

export default LoadingSkeletonComponents;
