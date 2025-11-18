/**
 * Sanitizes business payload to ensure all fields comply with database constraints.
 * - Removes undefined values
 * - Converts null to empty strings for NOT NULL fields
 * - Ensures all required fields have safe defaults
 * - Handles lat/lng conversion properly
 * - Validates category enum values
 */

export interface BusinessPayload {
  name?: string | null;
  description?: string | null;
  category?: string | null;
  status?: string | null;
  phone?: string | null;
  email?: string | null;
  website?: string | null;
  address?: string | null;
  island?: string | null;
  latitude?: number | string | null;
  longitude?: number | string | null;
  logo_url?: string | null;
  cover_image_url?: string | null;
  owner_id?: string | null;
  verification_notes?: string | null;
  updated_at?: string;
  [key: string]: any;
}

/**
 * Valid business_category enum values from database schema
 */
const VALID_CATEGORIES = [
  'restaurants',
  'hotels',
  'tourism',
  'retail',
  'services',
  'entertainment',
  'health',
  'education',
  'finance',
  'transport',
  'real_estate',
  'technology'
] as const;

/**
 * Valid business_status enum values from database schema
 */
const VALID_STATUSES = [
  'active',
  'pending',
  'suspended',
  'closed'
] as const;

/**
 * Maps UI category labels to database enum values (lowercase slug)
 * If the value is already a valid enum, returns it as-is
 */
export const normalizeCategory = (value: any): string => {
  if (!value) return 'tourism'; // Default fallback
  
  const str = String(value).trim().toLowerCase();
  
  // If already a valid enum value, return it
  if (VALID_CATEGORIES.includes(str as any)) {
    return str;
  }
  
  // Try to map common variations
  const categoryMap: Record<string, string> = {
    'service': 'services',
    'accommodation': 'hotels',
    'food': 'restaurants',
    'tour': 'tourism',
    'tours': 'tourism',
    'shopping': 'retail',
    'tech': 'technology',
    'real estate': 'real_estate',
  };
  
  if (categoryMap[str]) {
    return categoryMap[str];
  }
  
  // Default fallback
  console.warn(`[sanitizeBusinessPayload] Invalid category "${value}", defaulting to "tourism"`);
  return 'tourism';
};

/**
 * Sanitizes a business payload for Supabase update/insert operations.
 * Ensures all NOT NULL fields have safe defaults and removes undefined values.
 */
export const sanitizeBusinessPayload = (payload: BusinessPayload): Record<string, any> => {
  const sanitized: Record<string, any> = {};

  // Helper to convert null/undefined to empty string for NOT NULL fields
  const toSafeString = (value: any): string => {
    if (value === null || value === undefined) return '';
    return String(value).trim();
  };

  // Helper to convert to null for nullable fields
  const toNullableString = (value: any): string | null => {
    if (value === null || value === undefined || value === '') return null;
    const trimmed = String(value).trim();
    return trimmed || null;
  };

  // Helper to convert to number or null
  const toNullableNumber = (value: any): number | null => {
    if (value === null || value === undefined || value === '') return null;
    const num = typeof value === 'number' ? value : Number(value);
    return isNaN(num) ? null : num;
  };

  // Only include fields that are explicitly provided (not undefined)
  // This prevents accidentally clearing fields that weren't meant to be updated

  if ('name' in payload) {
    const name = toSafeString(payload.name);
    sanitized.name = name || 'Unnamed Business';
  }

  if ('description' in payload) {
    // CRITICAL: description must be a string, never null (NOT NULL constraint)
    sanitized.description = toSafeString(payload.description);
  }

  if ('category' in payload) {
    // CRITICAL: category must be a valid enum value (NOT NULL constraint)
    sanitized.category = normalizeCategory(payload.category);
  }

  if ('status' in payload) {
    const status = toSafeString(payload.status);
    // Validate status is one of the allowed enum values
    const validStatus = VALID_STATUSES.includes(status as any) ? status : 'pending';
    sanitized.status = validStatus;
  }

  if ('phone' in payload) {
    // phone is nullable, but we'll use empty string for consistency
    sanitized.phone = toSafeString(payload.phone);
  }

  if ('email' in payload) {
    // email is nullable, but we'll use empty string for consistency
    sanitized.email = toSafeString(payload.email);
  }

  if ('website' in payload) {
    // website is nullable, but we'll use empty string for consistency
    sanitized.website = toSafeString(payload.website);
  }

  if ('address' in payload) {
    // address is nullable, but we'll use empty string for consistency
    sanitized.address = toSafeString(payload.address);
  }

  if ('island' in payload) {
    // island is nullable
    sanitized.island = toSafeString(payload.island);
  }

  if ('latitude' in payload) {
    sanitized.latitude = toNullableNumber(payload.latitude);
  }

  if ('longitude' in payload) {
    sanitized.longitude = toNullableNumber(payload.longitude);
  }

  if ('logo_url' in payload) {
    sanitized.logo_url = toNullableString(payload.logo_url);
  }

  if ('cover_image_url' in payload) {
    sanitized.cover_image_url = toNullableString(payload.cover_image_url);
  }

  if ('owner_id' in payload) {
    sanitized.owner_id = payload.owner_id ? String(payload.owner_id) : null;
  }

  if ('verification_notes' in payload) {
    sanitized.verification_notes = toNullableString(payload.verification_notes);
  }

  if ('updated_at' in payload) {
    sanitized.updated_at = payload.updated_at || new Date().toISOString();
  }

  // CRITICAL: Remove any undefined values that might have slipped through
  // Supabase will reject updates with undefined values
  Object.keys(sanitized).forEach(key => {
    if (sanitized[key] === undefined) {
      delete sanitized[key];
    }
  });

  return sanitized;
};

