import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export const useGoogleMapsApiKey = () => {
  const [apiKey, setApiKey] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchApiKey = async () => {
      try {
        setLoading(true);
        setError(null);

        // Try to fetch from the get-setting edge function
        const response = await fetch('/api/get-setting/GOOGLE_MAPS_API_KEY');
        
        if (!response.ok) {
          throw new Error('Failed to fetch API key');
        }

        const data = await response.json();
        setApiKey(data.value || '');
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch API key');
        
        // Fallback to localStorage if available
        const savedApiKey = localStorage.getItem('google_maps_api_key');
        if (savedApiKey) {
          setApiKey(savedApiKey);
          setError(null);
        }
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};
