import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import type { Tables } from '@/integrations/supabase/types';

type HeroSection = Tables<'hero_section'>;

export const useHeroSection = () => {
  const [heroSection, setHeroSection] = useState<HeroSection | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchHeroSection = async () => {
      try {
        setLoading(true);
        setError(null);

        const { data, error: fetchError } = await supabase
          .from('hero_section')
          .select('*')
          .order('updated_at', { ascending: false })
          .limit(1)
          .single();

        if (fetchError) {
          throw fetchError;
        }

        setHeroSection(data);
      } catch (err) {
        console.error('Error fetching hero section:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hero section');
        
        // Fallback to default data if fetch fails
        setHeroSection({
          id: 'default',
          title: 'Welcome to iCompass Seychelles',
          subtitle: 'Find trusted businesses, discover local services, and explore everything Seychelles has to offer',
          image_url: '/assets/hero-seychelles.jpg',
          updated_at: new Date().toISOString()
        });
      } finally {
        setLoading(false);
      }
    };

    fetchHeroSection();
  }, []);

  const updateHeroSection = async (updates: Partial<HeroSection>) => {
    try {
      setError(null);

      if (!heroSection) {
        throw new Error('No hero section data available');
      }

      const { data, error: updateError } = await supabase
        .from('hero_section')
        .update(updates)
        .eq('id', heroSection.id)
        .select()
        .single();

      if (updateError) {
        throw updateError;
      }

      setHeroSection(data);
      return data;
    } catch (err) {
      console.error('Error updating hero section:', err);
      setError(err instanceof Error ? err.message : 'Failed to update hero section');
      throw err;
    }
  };

  return {
    heroSection,
    loading,
    error,
    updateHeroSection
  };
};
