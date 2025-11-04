/**
 * Image optimization utilities for Vite React applications
 */
import { useState, useRef, useEffect } from 'react';

// Generate a simple blur data URL for placeholder
export const generateBlurDataURL = (width: number = 10, height: number = 10): string => {
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  
  if (!ctx) return '';
  
  // Create a simple gradient blur
  const gradient = ctx.createLinearGradient(0, 0, width, height);
  gradient.addColorStop(0, '#f3f4f6');
  gradient.addColorStop(1, '#e5e7eb');
  
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, width, height);
  
  return canvas.toDataURL('image/jpeg', 0.1);
};

// Preload critical images
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = src;
  });
};

// Generate responsive image sizes
export const generateImageSizes = (breakpoints: Record<string, number> = {
  mobile: 320,
  tablet: 768,
  desktop: 1024,
  large: 1280
}): string => {
  return Object.entries(breakpoints)
    .map(([breakpoint, size]) => `(max-width: ${size}px) ${size}px`)
    .join(', ') + ', 100vw';
};

// Check if image is likely to be above the fold
export const isAboveTheFold = (element: HTMLElement): boolean => {
  const rect = element.getBoundingClientRect();
  return rect.top < window.innerHeight;
};

// Lazy load images with Intersection Observer
export const useLazyImage = (src: string, options: IntersectionObserverInit = {}) => {
  const [imageSrc, setImageSrc] = useState<string | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setImageSrc(src);
          observer.disconnect();
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px',
        ...options,
      }
    );

    if (imgRef.current) {
      observer.observe(imgRef.current);
    }

    return () => observer.disconnect();
  }, [src, options]);

  return { imgRef, imageSrc, isLoaded, setIsLoaded };
};

// Image compression utility (client-side)
export const compressImage = (
  file: File,
  maxWidth: number = 1920,
  maxHeight: number = 1080,
  quality: number = 0.8
): Promise<Blob> => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    img.onload = () => {
      // Calculate new dimensions
      let { width, height } = img;
      
      if (width > height) {
        if (width > maxWidth) {
          height = (height * maxWidth) / width;
          width = maxWidth;
        }
      } else {
        if (height > maxHeight) {
          width = (width * maxHeight) / height;
          height = maxHeight;
        }
      }

      canvas.width = width;
      canvas.height = height;

      // Draw and compress
      ctx?.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => resolve(blob || file),
        'image/jpeg',
        quality
      );
    };

    img.src = URL.createObjectURL(file);
  });
};

// Generate WebP src if supported
export const getWebPSrc = (originalSrc: string): string => {
  if (typeof window === 'undefined') return originalSrc;
  
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  
  if (!ctx || !canvas.toBlob) return originalSrc;
  
  // Check WebP support
  canvas.width = 1;
  canvas.height = 1;
  
  return canvas.toDataURL('image/webp').indexOf('data:image/webp') === 0
    ? originalSrc.replace(/\.(jpg|jpeg|png)$/i, '.webp')
    : originalSrc;
};

// Image aspect ratio utilities
export const getAspectRatio = (width: number, height: number): number => {
  return width / height;
};

export const getAspectRatioClass = (ratio: number): string => {
  const commonRatios: Record<number, string> = {
    1: 'aspect-square',
    1.33: 'aspect-[4/3]',
    1.5: 'aspect-[3/2]',
    1.77: 'aspect-video',
    2: 'aspect-[2/1]',
  };
  
  return commonRatios[Math.round(ratio * 100) / 100] || 'aspect-auto';
};
