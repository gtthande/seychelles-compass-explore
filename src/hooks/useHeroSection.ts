import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

interface HeroSection {
  title: string;
  subtitle: string;
  image_url: string;
}

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
          .from('app_settings')
          .select('key, value')
          .in('key', ['HERO_TITLE', 'HERO_SUBTITLE', 'HERO_IMAGE_URL']);

        if (fetchError) {
          console.warn('Could not fetch hero settings from app_settings, using defaults:', fetchError);
          // Don't throw error, just use defaults
        }

        const settings: Record<string, string> = {};
        data?.forEach(item => {
          settings[item.key] = item.value;
        });

        setHeroSection({
          title: settings.HERO_TITLE || 'Welcome to iCompass Seychelles',
          subtitle: settings.HERO_SUBTITLE || 'Find trusted businesses, discover local services, and explore everything Seychelles has to offer',
          image_url: settings.HERO_IMAGE_URL || '/assets/hero-seychelles.jpg'
        });
      } catch (err) {
        console.error('Error fetching hero section:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch hero section');
        
        // Fallback to default data if fetch fails
        setHeroSection({
          title: 'Welcome to iCompass Seychelles',
          subtitle: 'Find trusted businesses, discover local services, and explore everything Seychelles has to offer',
          image_url: '/assets/hero-seychelles.jpg'
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

      const settingsUpdates = Object.entries(updates).map(([key, value]) => {
        const settingKey = key === 'title' ? 'HERO_TITLE' :
                          key === 'subtitle' ? 'HERO_SUBTITLE' :
                          key === 'image_url' ? 'HERO_IMAGE_URL' : key;
        
        return { key: settingKey, value };
      });

      for (const setting of settingsUpdates) {
        const { error: updateError } = await supabase
          .from('app_settings')
          .upsert(setting, { onConflict: 'key' });

        if (updateError) {
          throw updateError;
        }
      }

      // Update local state
      setHeroSection(prev => prev ? { ...prev, ...updates } : null);
      
      return { ...heroSection, ...updates };
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