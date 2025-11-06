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
      .eq('user_id', user.id)
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

