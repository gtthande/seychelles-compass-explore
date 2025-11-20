/**
 * Environment Variable Validation
 * Ensures all required environment variables are present before app starts
 */

const REQUIRED_ENV_VARS = {
  VITE_SUPABASE_URL: 'https://bwlmlniotyrjttglbjrl.supabase.co',
  VITE_SUPABASE_ANON_KEY: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI',
  VITE_GOOGLE_MAPS_API_KEY: 'AIzaSyByNrxUDO-dODXwTaT6RINSbAfASZ-eGfY',
  VITE_SITE_URL: 'http://localhost:5173'
} as const;

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
  const invalid: string[] = [];

  for (const [key, expectedValue] of Object.entries(REQUIRED_ENV_VARS)) {
    const actualValue = import.meta.env[key];
    
    if (!actualValue || actualValue.trim() === '') {
      missing.push(key);
      continue;
    }

    // Check if value matches expected (for critical vars)
    if (key === 'VITE_SUPABASE_URL' && actualValue !== expectedValue) {
      console.warn(`⚠️ ${key} does not match expected value`);
      console.warn(`   Expected: ${maskValue(expectedValue)}`);
      console.warn(`   Actual: ${maskValue(actualValue)}`);
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
  Object.keys(REQUIRED_ENV_VARS).forEach(key => {
    const value = import.meta.env[key];
    console.log(`   ${key}: ${maskValue(value)}`);
  });
}

/**
 * Get environment variable with validation
 */
export function getEnv(key: keyof typeof REQUIRED_ENV_VARS): string {
  const value = import.meta.env[key];
  if (!value || value.trim() === '') {
    throw new Error(`Environment variable ${key} is missing or empty`);
  }
  return value;
}

