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

        // Priority 1: Environment variable (Vite uses import.meta.env)
        const envApiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
        if (envApiKey) {
          console.log('Using Google Maps API key from environment variables');
          setApiKey(envApiKey);
          setLoading(false);
          return;
        }

        // Priority 2: Try to fetch from the get-setting edge function
        try {
          const response = await fetch('http://localhost:5055/api/get-setting/GOOGLE_MAPS_API_KEY');
          
          if (response.ok) {
            const data = await response.json();
            if (data.value) {
              console.log('Using Google Maps API key from Supabase settings');
              setApiKey(data.value);
              setLoading(false);
              return;
            }
          }
        } catch (fetchError) {
          console.warn('Failed to fetch API key from Supabase:', fetchError);
        }

        // Priority 3: Fallback to localStorage if available
        const savedApiKey = localStorage.getItem('google_maps_api_key');
        if (savedApiKey) {
          console.log('Using Google Maps API key from localStorage');
          setApiKey(savedApiKey);
          setError(null);
        } else {
          setError('No Google Maps API key found. Please set VITE_GOOGLE_MAPS_API_KEY in your .env file.');
        }
      } catch (err) {
        console.error('Error fetching Google Maps API key:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch API key');
      } finally {
        setLoading(false);
      }
    };

    fetchApiKey();
  }, []);

  return { apiKey, loading, error };
};
