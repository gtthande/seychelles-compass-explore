/**
 * Environment Variable Validation
 * Ensures all required environment variables are present before app starts
 */

// Expected values for validation (URLs only - never store API keys here)
const EXPECTED_URLS = {
  VITE_SUPABASE_URL: 'https://bwlmlniotyrjttglbjrl.supabase.co',
  VITE_SITE_URL: 'http://localhost:5173'
} as const;

// List of required environment variable keys (without values)
const REQUIRED_ENV_VARS = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY',
  'VITE_GOOGLE_MAPS_API_KEY',
  'VITE_SITE_URL'
] as const;

/**
 * Mask a value showing only first 3 and last 3 characters
 */
function maskValue(value: string): string {
  if (value.length <= 6) return '****';
  return `${value.slice(0, 3)}...${value.slice(-3)}`;
}

/**
 * Validate all required environment variables
 * Throws error if any are missing
 */
export function validateEnv(): void {
  const missing: string[] = [];

  // Check that all required environment variables are present
  for (const key of REQUIRED_ENV_VARS) {
    const actualValue = import.meta.env[key];
    
    if (!actualValue || actualValue.trim() === '') {
      missing.push(key);
      continue;
    }

    // Only validate URL format/structure, not exact values (except for known URLs)
    if (key === 'VITE_SUPABASE_URL') {
      const expectedUrl = EXPECTED_URLS.VITE_SUPABASE_URL;
      if (actualValue !== expectedUrl) {
        console.warn(`⚠️ ${key} does not match expected value`);
        console.warn(`   Expected: ${maskValue(expectedUrl)}`);
        console.warn(`   Actual: ${maskValue(actualValue)}`);
        console.warn(`   This may indicate a configuration issue.`);
      }
    }

    // Validate API keys exist but don't check their values (security best practice)
    if (key === 'VITE_SUPABASE_ANON_KEY' || key === 'VITE_GOOGLE_MAPS_API_KEY') {
      // Just verify it's not a placeholder
      if (actualValue.includes('[YOUR_') || actualValue.includes('your-')) {
        missing.push(key);
        console.error(`❌ ${key} appears to be a placeholder. Please set a real value.`);
      }
    }
  }

  if (missing.length > 0) {
    console.error('❌ Missing required environment variables:');
    missing.forEach(key => {
      console.error(`   - ${key}`);
    });
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`);
  }

  // Log masked values for verification
  console.log('✅ Environment variables validated:');
  REQUIRED_ENV_VARS.forEach(key => {
    const value = import.meta.env[key];
    console.log(`   ${key}: ${maskValue(value)}`);
  });
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: typeof REQUIRED_ENV_VARS[number]): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${key} is missing or empty`);
  }
  // Check for placeholder values
  if (value.includes('[YOUR_') || value.includes('your-')) {
    throw new Error(`Environment variable ${key} appears to be a placeholder. Please set a real value.`);
  }
  return value;
}

