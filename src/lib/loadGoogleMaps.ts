/**
 * Google Maps JavaScript API loader utility
 * Dynamically loads Google Maps API with proper error handling
 */

export interface GoogleMapsInstance {
  Map: any;
  Marker: any;
  event: any;
  LatLng: any;
}

/**
 * Load Google Maps JavaScript API dynamically
 * @param apiKey - Google Maps API key
 * @returns Promise with Google Maps instance
 */
export async function loadGoogleMaps(apiKey: string): Promise<GoogleMapsInstance> {
  // Check if Google Maps is already loaded
  if ((window as any).google?.maps) {
    return (window as any).google.maps;
  }

  return new Promise((resolve, reject) => {
    // Check if script is already being loaded
    const existingScript = document.querySelector('script[src*="maps.googleapis.com"]');
    if (existingScript) {
      // Wait for existing script to load
      existingScript.addEventListener('load', () => {
        resolve((window as any).google.maps);
      });
      existingScript.addEventListener('error', reject);
      return;
    }

    // Create and load new script
    const script = document.createElement('script');
    script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places&callback=initGoogleMaps`;
    script.async = true;
    script.defer = true;
    
    // Set up global callback
    (window as any).initGoogleMaps = () => {
      resolve((window as any).google.maps);
    };
    
    script.onerror = (error) => {
      console.error('Failed to load Google Maps API:', error);
      reject(new Error('Failed to load Google Maps API. Please check your API key and internet connection.'));
    };
    
    document.head.appendChild(script);
  });
}

/**
 * Check if Google Maps API is available
 * @returns boolean indicating if Google Maps is loaded
 */
export function isGoogleMapsLoaded(): boolean {
  return !!(window as any).google?.maps;
}

/**
 * Get current Google Maps instance
 * @returns Google Maps instance or null if not loaded
 */
export function getGoogleMapsInstance(): GoogleMapsInstance | null {
  return (window as any).google?.maps || null;
}


