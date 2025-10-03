import React, { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "./useAuth";

interface Business {
  id: string;
  name: string;
  category: string;
  status: string;
  owner_id: string;
  description: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  address: string | null;
  island: string | null;
  logo_url: string | null;
  cover_image_url: string | null;
  services: string[] | null;
  average_rating: number | null;
  total_reviews: number | null;
}

export const useBusinessAuth = () => {
  const { user, loading: authLoading } = useAuth();
  const [business, setBusiness] = useState<Business | null>(null);
  const [loading, setLoading] = useState(true);
  const [isBusinessOwner, setIsBusinessOwner] = useState(false);

  useEffect(() => {
    const fetchBusiness = async () => {
      if (!user || authLoading) {
        setLoading(false);
        return;
      }

      try {
        // First, get the user's profile to get their profile ID
        const { data: profile } = await supabase
          .from('profiles')
          .select('id, is_business_owner')
          .eq('user_id', user.id)
          .single();

        if (profile) {
          setIsBusinessOwner(profile.is_business_owner || false);
          
          // Check if user has a business
          const { data: businessData } = await supabase
            .from('businesses')
            .select('*')
            .eq('owner_id', profile.id)
            .single();

          if (businessData) {
            setBusiness(businessData);
          }
        }
      } catch (error) {
        console.error('Error fetching business:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBusiness();
  }, [user, authLoading]);

  return {
    business,
    loading: loading || authLoading,
    isBusinessOwner,
    hasBusiness: !!business,
  };
};