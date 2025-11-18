/**
 * Browser-based Supabase connection test
 * Run this in the browser console to diagnose connection issues
 */

export const testSupabaseConnection = async () => {
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

  console.log('🔍 Testing Supabase Connection...');
  console.log('URL:', url);
  console.log('Has Key:', !!key && key.length > 0);

  if (!url || !key) {
    console.error('❌ Missing environment variables');
    return { success: false, error: 'Missing environment variables' };
  }

  // Test 1: Basic connectivity (bypass timeout wrapper for cleaner error)
  try {
    console.log('Test 1: Testing basic connectivity...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s for test
    
    const response = await fetch(`${url}/rest/v1/`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    console.log('Response headers:', Object.fromEntries(response.headers.entries()));

    if (!response.ok) {
      const text = await response.text();
      console.error('❌ Test 1 failed:', text);
      return { success: false, error: `HTTP ${response.status}: ${text}` };
    }

    console.log('✅ Test 1 passed: Basic connectivity works');
  } catch (error: any) {
    console.error('❌ Test 1 failed:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Connection timeout (15s). This is likely a CORS issue. Check Supabase dashboard CORS settings.' };
    }
    if (error.message?.includes('Failed to fetch')) {
      return { success: false, error: 'Network error: CORS is likely blocking the request. Add your URL to Supabase CORS settings.' };
    }
    return { success: false, error: error.message || 'Unknown error' };
  }

  // Test 2: Query businesses table (bypass timeout wrapper for cleaner error)
  try {
    console.log('Test 2: Testing businesses query...');
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s for test
    
    const response = await fetch(`${url}/rest/v1/businesses?select=id&limit=1`, {
      method: 'GET',
      headers: {
        'apikey': key,
        'Authorization': `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      signal: controller.signal,
    });
    
    clearTimeout(timeoutId);

    console.log('Response status:', response.status);
    const data = await response.json();
    console.log('Response data:', data);

    if (!response.ok) {
      console.error('❌ Test 2 failed:', data);
      return { success: false, error: `HTTP ${response.status}: ${JSON.stringify(data)}` };
    }

    console.log('✅ Test 2 passed: Businesses query works');
    return { success: true, data };
  } catch (error: any) {
    console.error('❌ Test 2 failed:', error);
    if (error.name === 'AbortError') {
      return { success: false, error: 'Query timeout (15s). This is likely a CORS issue. Check Supabase dashboard CORS settings.' };
    }
    if (error.message?.includes('Failed to fetch')) {
      return { success: false, error: 'Network error: CORS is likely blocking the request. Add your URL to Supabase CORS settings.' };
    }
    return { success: false, error: error.message || 'Unknown error' };
  }
};

// Make it available globally for browser console
if (typeof window !== 'undefined') {
  (window as any).testSupabaseConnection = testSupabaseConnection;
  console.log('💡 Run testSupabaseConnection() in the console to test your connection');
}

