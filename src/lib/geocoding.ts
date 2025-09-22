/**
 * Google Maps Geocoding API utility
 * Handles address geocoding using the Google Maps Geocoding API
 */

export interface GeocodingResult {
  latitude: number;
  longitude: number;
  formatted_address: string;
  place_id: string;
}

export interface GeocodingError {
  error: string;
  details?: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - The address to geocode
 * @param island - Optional island name to improve accuracy
 * @returns Promise with geocoding result or error
 */
export const geocodeAddress = async (
  address: string, 
  island?: string
): Promise<GeocodingResult | GeocodingError> => {
  try {
    // Get API key from environment variables
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        error: 'Google Maps API key not configured',
        details: 'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'
      };
    }

    // Construct the full address with island for better accuracy
    const fullAddress = island 
      ? `${address}, ${island}, Seychelles`
      : `${address}, Seychelles`;

    // Encode the address for URL
    const encodedAddress = encodeURIComponent(fullAddress);

    // Make request to Google Maps Geocoding API
    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?address=${encodedAddress}&key=${apiKey}`
    );

    if (!response.ok) {
      return {
        error: 'Geocoding API request failed',
        details: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    // Handle API errors
    if (data.status !== 'OK') {
      let errorMessage = 'Geocoding failed';
      let details = data.status;

      switch (data.status) {
        case 'ZERO_RESULTS':
          errorMessage = 'No results found for this address';
          details = 'The address could not be found. Please check the spelling and try again.';
          break;
        case 'OVER_QUERY_LIMIT':
          errorMessage = 'Geocoding quota exceeded';
          details = 'The daily geocoding quota has been exceeded. Please try again tomorrow.';
          break;
        case 'REQUEST_DENIED':
          errorMessage = 'Geocoding request denied';
          details = 'The API key may be invalid or restricted. Please check your configuration.';
          break;
        case 'INVALID_REQUEST':
          errorMessage = 'Invalid geocoding request';
          details = 'The request was malformed. Please check the address format.';
          break;
        default:
          details = data.error_message || data.status;
      }

      return { error: errorMessage, details };
    }

    // Extract the first result
    const result = data.results[0];
    if (!result || !result.geometry || !result.geometry.location) {
      return {
        error: 'Invalid geocoding response',
        details: 'The API returned an unexpected response format'
      };
    }

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: 'Network error during geocoding',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};

/**
 * Reverse geocode coordinates to get an address
 * @param latitude - The latitude coordinate
 * @param longitude - The longitude coordinate
 * @returns Promise with reverse geocoding result or error
 */
export const reverseGeocode = async (
  latitude: number,
  longitude: number
): Promise<GeocodingResult | GeocodingError> => {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        error: 'Google Maps API key not configured',
        details: 'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'
      };
    }

    const response = await fetch(
      `https://maps.googleapis.com/maps/api/geocode/json?latlng=${latitude},${longitude}&key=${apiKey}`
    );

    if (!response.ok) {
      return {
        error: 'Reverse geocoding API request failed',
        details: `HTTP ${response.status}: ${response.statusText}`
      };
    }

    const data = await response.json();

    if (data.status !== 'OK') {
      return {
        error: 'Reverse geocoding failed',
        details: data.error_message || data.status
      };
    }

    const result = data.results[0];
    if (!result || !result.geometry || !result.geometry.location) {
      return {
        error: 'Invalid reverse geocoding response',
        details: 'The API returned an unexpected response format'
      };
    }

    return {
      latitude: result.geometry.location.lat,
      longitude: result.geometry.location.lng,
      formatted_address: result.formatted_address,
      place_id: result.place_id
    };

  } catch (error) {
    console.error('Reverse geocoding error:', error);
    return {
      error: 'Network error during reverse geocoding',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
};
