/**
 * Google Maps utility functions for iCompass Seychelles
 * Provides helper functions for map-related operations
 */

/**
 * Generate Google Maps directions URL
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Google Maps directions URL
 */
export const getDirectionsUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`;

/**
 * Generate Google Maps search URL for address-based directions
 * @param address - Business address or name
 * @returns Google Maps search URL
 */
export const getAddressDirectionsUrl = (address: string): string => {
  const encodedAddress = encodeURIComponent(address);
  return `https://www.google.com/maps/dir/?api=1&destination=${encodedAddress}`;
};

/**
 * Generate Google Maps embed URL for modal display
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param apiKey - Google Maps API key
 * @param zoom - Map zoom level (default: 15)
 * @returns Google Maps embed URL
 */
export const getEmbedUrl = (
  lat: number, 
  lng: number, 
  apiKey: string, 
  zoom: number = 15
): string => {
  return `https://www.google.com/maps/embed/v1/place?key=${apiKey}&q=${lat},${lng}&zoom=${zoom}`;
};

/**
 * Generate Google Maps search URL for viewing location
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns Google Maps search URL
 */
export const getViewUrl = (lat: number, lng: number): string =>
  `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`;

/**
 * Check if coordinates are valid
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @returns True if coordinates are valid
 */
export const isValidCoordinates = (lat: number | null, lng: number | null): boolean => {
  return lat !== null && lng !== null && 
         !isNaN(lat) && !isNaN(lng) &&
         lat >= -90 && lat <= 90 &&
         lng >= -180 && lng <= 180;
};

/**
 * Format coordinates for display
 * @param lat - Latitude coordinate
 * @param lng - Longitude coordinate
 * @param precision - Decimal places (default: 6)
 * @returns Formatted coordinate string
 */
export const formatCoordinates = (lat: number, lng: number, precision: number = 6): string => {
  return `${lat.toFixed(precision)}, ${lng.toFixed(precision)}`;
};
