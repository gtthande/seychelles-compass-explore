/**
 * Centralized Business Creation API
 * Implements Hybrid Option C: pending (users) / approved (admins)
 * 
 * This is the single source of truth for business creation logic
 */

import { supabase } from "@/integrations/supabase/client";

export interface CreateBusinessPayload {
  title: string;
  description?: string | null;
  category_id?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  island?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  image_url?: string | null;
  owner_id: string;
}

export interface CreateBusinessResult {
  success: boolean;
  business?: any;
  error?: string;
}

/**
 * Create a business with role-aware status assignment
 * - Admin users → status: 'approved', is_verified: true, is_active: true
 * - Regular users → status: 'pending', is_verified: false, is_active: false
 * 
 * @param payload Business data to create
 * @param isAdmin Whether the current user is an admin
 * @returns Result with created business or error
 */
export async function createBusiness(
  payload: CreateBusinessPayload,
  isAdmin: boolean = false
): Promise<CreateBusinessResult> {
  try {
    // Validate required fields
    if (!payload.title || !payload.title.trim()) {
      return {
        success: false,
        error: "Business name is required"
      };
    }

    if (!payload.owner_id) {
      return {
        success: false,
        error: "Owner ID is required"
      };
    }

    // HYBRID APPROVAL MODEL (Option C)
    // Admin-created businesses start as 'approved'
    // Public user-created businesses start as 'pending'
    const status = isAdmin ? 'approved' : 'pending';
    const is_verified = isAdmin ? true : false;
    const is_active = isAdmin ? true : false;

    // Prepare insert data - only use valid database fields
    // NEVER use undefined - use null for optional fields
    const insertData: Record<string, any> = {
      title: payload.title.trim(),
      description: payload.description?.trim() || null,
      category_id: payload.category_id || null,
      phone: payload.phone?.trim() || null,
      email: payload.email?.trim() || null,
      website: payload.website?.trim() || null,
      address: payload.address?.trim() || null,
      island: payload.island || null,
      latitude: payload.latitude ?? null,
      longitude: payload.longitude ?? null,
      image_url: payload.image_url || null,
      owner_id: payload.owner_id,
      status: status,
      is_verified: is_verified,
      is_active: is_active,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from('businesses')
      .insert(insertData)
      .select()
      .single();

    if (error) {
      console.error('Business creation error:', error);
      
      // Provide user-friendly error messages
      let errorMessage = "Failed to create business";
      if (error.message.includes('duplicate key') || error.message.includes('unique constraint')) {
        errorMessage = "A business with this name already exists";
      } else if (error.message.includes('violates') || error.message.includes('constraint')) {
        errorMessage = "Please check all required fields are filled correctly";
      } else if (error.message.includes('foreign key')) {
        errorMessage = "Invalid category or owner reference";
      } else {
        errorMessage = error.message || "An unexpected error occurred";
      }

      return {
        success: false,
        error: errorMessage
      };
    }

    return {
      success: true,
      business: data
    };
  } catch (err: any) {
    console.error('Unexpected error creating business:', err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred"
    };
  }
}

/**
 * Quick-create business with minimal fields (for quick-add component)
 * @param name Business name (required)
 * @param ownerId Owner profile ID (required)
 * @param isAdmin Whether the current user is an admin
 * @returns Result with created business or error
 */
export async function createBusinessQuick(
  name: string,
  ownerId: string,
  isAdmin: boolean = false
): Promise<CreateBusinessResult> {
  return createBusiness(
    {
      title: name,
      owner_id: ownerId
    },
    isAdmin
  );
}

