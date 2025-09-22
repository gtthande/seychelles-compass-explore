/**
 * Geocoding Tests
 * 
 * Tests for the Google Maps geocoding functionality
 * Run with: npm test or vitest
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { geocodeAddress, reverseGeocode } from '../lib/geocoding';

// Mock environment variables
const mockEnv = {
  VITE_GOOGLE_MAPS_API_KEY: 'test-api-key'
};

// Mock fetch
const mockFetch = vi.fn();
global.fetch = mockFetch;

// Mock import.meta.env
vi.mock('import.meta', () => ({
  env: mockEnv
}));

describe('Geocoding Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('geocodeAddress', () => {
    it('should return coordinates for a valid address', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: {
              lat: -4.6515,
              lng: 55.4864
            }
          },
          formatted_address: 'PO Box 48, Providence Mahe, Seychelles',
          place_id: 'test-place-id'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geocodeAddress('PO Box 48, Providence Mahe', 'Mahé');

      expect(result).toEqual({
        latitude: -4.6515,
        longitude: 55.4864,
        formatted_address: 'PO Box 48, Providence Mahe, Seychelles',
        place_id: 'test-place-id'
      });

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('maps.googleapis.com/maps/api/geocode/json')
      );
    });

    it('should handle missing API key', async () => {
      // Temporarily remove API key
      const originalApiKey = mockEnv.VITE_GOOGLE_MAPS_API_KEY;
      delete mockEnv.VITE_GOOGLE_MAPS_API_KEY;

      const result = await geocodeAddress('Test Address');

      expect(result).toEqual({
        error: 'Google Maps API key not configured',
        details: 'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'
      });

      // Restore API key
      mockEnv.VITE_GOOGLE_MAPS_API_KEY = originalApiKey;
    });

    it('should handle zero results', async () => {
      const mockResponse = {
        status: 'ZERO_RESULTS',
        results: []
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geocodeAddress('Non-existent Address');

      expect(result).toEqual({
        error: 'No results found for this address',
        details: 'The address could not be found. Please check the spelling and try again.'
      });
    });

    it('should handle quota exceeded', async () => {
      const mockResponse = {
        status: 'OVER_QUERY_LIMIT',
        error_message: 'Quota exceeded'
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await geocodeAddress('Test Address');

      expect(result).toEqual({
        error: 'Geocoding quota exceeded',
        details: 'The daily geocoding quota has been exceeded. Please try again tomorrow.'
      });
    });

    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await geocodeAddress('Test Address');

      expect(result).toEqual({
        error: 'Network error during geocoding',
        details: 'Network error'
      });
    });
  });

  describe('reverseGeocode', () => {
    it('should return address for valid coordinates', async () => {
      const mockResponse = {
        status: 'OK',
        results: [{
          geometry: {
            location: {
              lat: -4.6515,
              lng: 55.4864
            }
          },
          formatted_address: 'PO Box 48, Providence Mahe, Seychelles',
          place_id: 'test-place-id'
        }]
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse
      });

      const result = await reverseGeocode(-4.6515, 55.4864);

      expect(result).toEqual({
        latitude: -4.6515,
        longitude: 55.4864,
        formatted_address: 'PO Box 48, Providence Mahe, Seychelles',
        place_id: 'test-place-id'
      });
    });

    it('should handle missing API key', async () => {
      const originalApiKey = mockEnv.VITE_GOOGLE_MAPS_API_KEY;
      delete mockEnv.VITE_GOOGLE_MAPS_API_KEY;

      const result = await reverseGeocode(-4.6515, 55.4864);

      expect(result).toEqual({
        error: 'Google Maps API key not configured',
        details: 'Please set VITE_GOOGLE_MAPS_API_KEY in your .env file'
      });

      mockEnv.VITE_GOOGLE_MAPS_API_KEY = originalApiKey;
    });
  });
});

// Integration test example
describe('Geocoding Integration', () => {
  it('should work with real API key (manual test)', async () => {
    // This test should be run manually with a real API key
    // Skip in automated tests
    if (process.env.NODE_ENV === 'test') {
      return;
    }

    const result = await geocodeAddress('Victoria, Mahé, Seychelles');
    
    // Should return valid coordinates for Victoria, Seychelles
    expect(result).toHaveProperty('latitude');
    expect(result).toHaveProperty('longitude');
    expect(typeof result.latitude).toBe('number');
    expect(typeof result.longitude).toBe('number');
  });
});
