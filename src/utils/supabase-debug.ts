import { supabase } from '@/integrations/supabase/client';

export const debugSupabaseConnection = async () => {
  console.log('🔍 Supabase Debug Information:');
  console.log('================================');
  
  // Check environment variables
  console.log('Environment Variables:');
  console.log('- VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);
  console.log('- VITE_SUPABASE_ANON_KEY:', import.meta.env.VITE_SUPABASE_ANON_KEY ? 'Present' : 'Missing');
  console.log('- Key length:', import.meta.env.VITE_SUPABASE_ANON_KEY?.length || 0);
  
  // Check Supabase client configuration
  console.log('\nSupabase Client Configuration:');
  console.log('- URL:', supabase.supabaseUrl);
  console.log('- Has anon key:', !!supabase.supabaseKey);
  console.log('- Key length:', supabase.supabaseKey?.length || 0);
  
  // Test basic connection
  console.log('\nTesting Basic Connection:');
  try {
    const { data, error } = await supabase.from('businesses').select('id').limit(1);
    
    if (error) {
      console.error('❌ Supabase Error:', error);
      console.error('Error Code:', error.code);
      console.error('Error Message:', error.message);
      console.error('Error Details:', error.details);
      console.error('Error Hint:', error.hint);
      return { success: false, error };
    } else {
      console.log('✅ Supabase Connection Successful');
      console.log('Data:', data);
      return { success: true, data };
    }
  } catch (err) {
    console.error('❌ Connection Exception:', err);
    return { success: false, error: err };
  }
};

// Test RPC function
export const debugRPCConnection = async () => {
  console.log('\n🔍 Testing RPC Function:');
  console.log('========================');
  
  try {
    const { data, error } = await supabase.rpc('get_live_counters');
    
    if (error) {
      console.error('❌ RPC Error:', error);
      console.error('RPC Error Code:', error.code);
      console.error('RPC Error Message:', error.message);
      console.error('RPC Error Details:', error.details);
      return { success: false, error };
    } else {
      console.log('✅ RPC Function Successful');
      console.log('RPC Data:', data);
      return { success: true, data };
    }
  } catch (err) {
    console.error('❌ RPC Exception:', err);
    return { success: false, error: err };
  }
};

// Test authentication
export const debugAuth = async () => {
  console.log('\n🔍 Testing Authentication:');
  console.log('==========================');
  
  try {
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error) {
      console.error('❌ Auth Error:', error);
      return { success: false, error };
    } else {
      console.log('✅ Auth Check Successful');
      console.log('User:', user ? 'Logged in' : 'Not logged in');
      if (user) {
        console.log('User ID:', user.id);
        console.log('User Email:', user.email);
      }
      return { success: true, user };
    }
  } catch (err) {
    console.error('❌ Auth Exception:', err);
    return { success: false, error: err };
  }
};

// Run all debug tests
export const runSupabaseDebug = async () => {
  console.log('🚀 Starting Supabase Debug Session');
  console.log('===================================');
  
  const connectionResult = await debugSupabaseConnection();
  const rpcResult = await debugRPCConnection();
  const authResult = await debugAuth();
  
  console.log('\n📊 Debug Summary:');
  console.log('==================');
  console.log('Connection:', connectionResult.success ? '✅' : '❌');
  console.log('RPC Function:', rpcResult.success ? '✅' : '❌');
  console.log('Authentication:', authResult.success ? '✅' : '❌');
  
  return {
    connection: connectionResult,
    rpc: rpcResult,
    auth: authResult
  };
};
