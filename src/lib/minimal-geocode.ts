/**
 * Minimal Google Maps Geocoding utility
 * Fetches coordinates only - no map UI
 */

export interface GeocodeResult {
  lat: number;
  lng: number;
  formatted: string;
}

export interface GeocodeError {
  error: string;
  details?: string;
}

/**
 * Geocode an address using Google Maps Geocoding API
 * @param address - The address to geocode
 * @returns Promise with coordinates or error
 */
export async function geocodeAddress(address: string): Promise<GeocodeResult | GeocodeError> {
  try {
    const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    
    if (!apiKey) {
      return {
        error: 'Missing Google Maps API key',
        details: 'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'
      };
    }

    // Construct the full address with Seychelles for better accuracy
    const fullAddress = `${address}, Seychelles`;
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
          errorMessage = 'No coordinates found for that address';
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
      lat: result.geometry.location.lat,
      lng: result.geometry.location.lng,
      formatted: result.formatted_address
    };

  } catch (error) {
    console.error('Geocoding error:', error);
    return {
      error: 'Network error during geocoding',
      details: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}















