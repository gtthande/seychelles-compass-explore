/**
 * Admin Utility Functions
 * Helper functions for admin-related operations and checks
 */

import { supabase } from '@/integrations/supabase/client';

/**
 * Check if current user is admin
 * Uses the profile's is_admin flag or role
 */
export async function checkIsAdmin(): Promise<boolean> {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return false;

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, role')
      .eq('id', user.id)  // Fixed: use id (primary key) not user_id
      .single();

    return profile?.is_admin === true || profile?.role === 'admin';
  } catch (error) {
    console.error('Error checking admin status:', error);
    return false;
  }
}

/**
 * Get pending businesses count (admin only)
 */
export async function getPendingBusinessesCount(): Promise<number> {
  try {
    const { count, error } = await supabase
      .from('businesses')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'pending');

    if (error) {
      console.error('Error getting pending count:', error);
      return 0;
    }

    return count || 0;
  } catch (error) {
    console.error('Error getting pending count:', error);
    return 0;
  }
}

/**
 * Subscribe to pending businesses changes (realtime)
 */
export function subscribeToPendingBusinesses(
  onInsert: (business: any) => void,
  onUpdate: (business: any) => void
) {
  const channel = supabase
    .channel('pending-businesses')
    .on(
      'postgres_changes',
      {
        event: 'INSERT',
        schema: 'public',
        table: 'businesses',
        filter: 'status=eq.pending',
      },
      (payload) => {
        onInsert(payload.new);
      }
    )
    .on(
      'postgres_changes',
      {
        event: 'UPDATE',
        schema: 'public',
        table: 'businesses',
        filter: 'status=eq.pending',
      },
      (payload) => {
        onUpdate(payload.new);
      }
    )
    .subscribe();

  return () => {
    supabase.removeChannel(channel);
  };
}

/**
 * Approve a business (admin only)
 */
export async function approveBusiness(businessId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('businesses')
      .update({ status: 'active' })
      .eq('id', businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Reject a business (admin only)
 */
export async function rejectBusiness(businessId: string): Promise<{ success: boolean; error?: string }> {
  try {
    const { error } = await supabase
      .from('businesses')
      .update({ status: 'suspended' })
      .eq('id', businessId);

    if (error) {
      return { success: false, error: error.message };
    }

    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message };
  }
}

/**
 * Get or create admin profile - reliable profile creation utility
 * Tries multiple schema variations and provides detailed error logging
 */
export async function getOrCreateAdminProfile(): Promise<{
  success: boolean;
  profile?: any;
  error?: {
    code?: string;
    message: string;
    details?: string;
    hint?: string;
  };
}> {
  console.log('🔍 getOrCreateAdminProfile: Starting...');
  
  try {
    // Step 1: Get authenticated user
    console.log('🔍 getOrCreateAdminProfile: Step 1 - Getting authenticated user...');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ getOrCreateAdminProfile: Auth error:', {
        code: authError.code,
        message: authError.message,
        status: authError.status
      });
      return {
        success: false,
        error: {
          code: authError.code,
          message: `Authentication failed: ${authError.message}`,
          details: authError.message,
          hint: 'Please ensure you are logged in'
        }
      };
    }
    
    if (!user) {
      console.error('❌ getOrCreateAdminProfile: No user found');
      return {
        success: false,
        error: {
          message: 'No authenticated user found',
          hint: 'Please log in first'
        }
      };
    }
    
    console.log('✅ getOrCreateAdminProfile: User found:', {
      id: user.id,
      email: user.email
    });
    
    // Step 2: Try to fetch existing profile (check both id and user_id)
    console.log('🔍 getOrCreateAdminProfile: Step 2 - Checking for existing profile...');
    
    // Try by id first
    const { data: profileById, error: errorById } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', user.id)
      .maybeSingle();
    
    console.log('🔍 getOrCreateAdminProfile: Profile check by id:', {
      found: !!profileById,
      error: errorById ? {
        code: errorById.code,
        message: errorById.message
      } : null
    });
    
    if (profileById) {
      console.log('✅ getOrCreateAdminProfile: Profile found by id:', {
        id: profileById.id,
        user_id: profileById.user_id,
        role: profileById.role,
        is_admin: profileById.is_admin
      });
      return { success: true, profile: profileById };
    }
    
    // Try by user_id if not found by id
    if (errorById?.code === 'PGRST116' || !profileById) {
      console.log('⚠️ getOrCreateAdminProfile: Profile not found by id, trying user_id...');
      const { data: profileByUserId, error: errorByUserId } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      console.log('🔍 getOrCreateAdminProfile: Profile check by user_id:', {
        found: !!profileByUserId,
        error: errorByUserId ? {
          code: errorByUserId.code,
          message: errorByUserId.message
        } : null
      });
      
      if (profileByUserId) {
        console.log('✅ getOrCreateAdminProfile: Profile found by user_id:', {
          id: profileByUserId.id,
          user_id: profileByUserId.user_id,
          role: profileByUserId.role,
          is_admin: profileByUserId.is_admin
        });
        return { success: true, profile: profileByUserId };
      }
      
      // If both queries failed with non-PGRST116 errors, return error
      if (errorByUserId && errorByUserId.code !== 'PGRST116') {
        console.error('❌ getOrCreateAdminProfile: Error checking profile:', {
          code: errorByUserId.code,
          message: errorByUserId.message,
          details: errorByUserId.details,
          hint: errorByUserId.hint
        });
        return {
          success: false,
          error: {
            code: errorByUserId.code,
            message: `Failed to check profile: ${errorByUserId.message}`,
            details: errorByUserId.details,
            hint: errorByUserId.hint
          }
        };
      }
    } else if (errorById && errorById.code !== 'PGRST116') {
      console.error('❌ getOrCreateAdminProfile: Error checking profile by id:', {
        code: errorById.code,
        message: errorById.message,
        details: errorById.details,
        hint: errorById.hint
      });
      return {
        success: false,
        error: {
          code: errorById.code,
          message: `Failed to check profile: ${errorById.message}`,
          details: errorById.details,
          hint: errorById.hint
        }
      };
    }
    
    // Step 3: Profile doesn't exist, create it
    console.log('📝 getOrCreateAdminProfile: Step 3 - Profile not found, creating new profile...');
    
    // Try creating with both id and user_id (schema-compatible)
    console.log('📝 getOrCreateAdminProfile: Attempt 1 - Creating with id and user_id...');
    let { data: newProfile, error: createError } = await supabase
      .from('profiles')
      .insert({
        id: user.id,
        user_id: user.id,
        email: user.email || '',
        role: 'user', // Default role (admin can be set via database)
        is_admin: false, // Default to non-admin (admin can be set via database)
        is_active: true,
        full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
        phone: '',
        business_name: '',
        is_business_owner: false
      })
      .select()
      .single();
    
    console.log('🔍 getOrCreateAdminProfile: Creation attempt 1 result:', {
      success: !!newProfile,
      error: createError ? {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint
      } : null
    });
    
    // If that fails due to schema mismatch, try with just id
    if (createError && (createError.code === '42703' || createError.message?.includes('column') || createError.message?.includes('does not exist'))) {
      console.log('⚠️ getOrCreateAdminProfile: Attempt 2 - Retrying with id only...');
      const retryResult = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email || '',
          role: 'user',
          is_admin: false,
          is_active: true
        })
        .select()
        .single();
      
      newProfile = retryResult.data;
      createError = retryResult.error;
      
      console.log('🔍 getOrCreateAdminProfile: Creation attempt 2 result:', {
        success: !!newProfile,
        error: createError ? {
          code: createError.code,
          message: createError.message
        } : null
      });
    }
    
    // If still fails, try with just user_id
    if (createError && (createError.code === '42703' || createError.message?.includes('column') || createError.message?.includes('does not exist'))) {
      console.log('⚠️ getOrCreateAdminProfile: Attempt 3 - Retrying with user_id only...');
      const retryResult = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.user_metadata?.name || '',
          phone: '',
          business_name: '',
          is_business_owner: false,
          is_admin: false,
          role: 'user'
        })
        .select()
        .single();
      
      newProfile = retryResult.data;
      createError = retryResult.error;
      
      console.log('🔍 getOrCreateAdminProfile: Creation attempt 3 result:', {
        success: !!newProfile,
        error: createError ? {
          code: createError.code,
          message: createError.message
        } : null
      });
    }
    
    if (createError) {
      console.error('❌ getOrCreateAdminProfile: All creation attempts failed:', {
        code: createError.code,
        message: createError.message,
        details: createError.details,
        hint: createError.hint,
        status: createError.status
      });
      
      return {
        success: false,
        error: {
          code: createError.code,
          message: `Failed to create profile: ${createError.message}`,
          details: createError.details,
          hint: createError.hint
        }
      };
    }
    
    if (newProfile) {
      console.log('✅ getOrCreateAdminProfile: Profile created successfully:', {
        id: newProfile.id,
        user_id: newProfile.user_id,
        role: newProfile.role,
        is_admin: newProfile.is_admin
      });
      return { success: true, profile: newProfile };
    }
    
    return {
      success: false,
      error: {
        message: 'Profile creation returned no data and no error'
      }
    };
    
  } catch (err: any) {
    console.error('❌ getOrCreateAdminProfile: Unexpected error:', {
      message: err.message,
      stack: err.stack,
      name: err.name
    });
    return {
      success: false,
      error: {
        message: `Unexpected error: ${err.message}`,
        details: err.stack
      }
    };
  }
}

