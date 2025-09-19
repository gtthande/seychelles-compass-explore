import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testWebAuth() {
  try {
    console.log('🌐 Testing web authentication flow...');
    
    // Step 1: Test login
    console.log('\n1. Testing login...');
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: 'gtthande@gmail.com',
      password: 'Admin123!'
    });
    
    if (authError) {
      console.error('❌ Login failed:', authError.message);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User ID:', authData.user?.id);
    
    // Step 2: Test profile fetch (this is what RouteGuard does)
    console.log('\n2. Testing profile fetch (RouteGuard logic)...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('user_id', authData.user?.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError);
      return;
    }
    
    console.log('✅ Profile fetched successfully:');
    console.log('  - Role:', profile.role);
    console.log('  - Is Admin:', profile.is_admin);
    
    // Step 3: Test role permission check
    console.log('\n3. Testing role permission...');
    const hasAdminPermission = profile.role === 'admin' && profile.is_admin === true;
    console.log('✅ Has admin permission:', hasAdminPermission);
    
    if (hasAdminPermission) {
      console.log('\n🎉 SUCCESS! Admin access should work!');
      console.log('\n📋 Next steps:');
      console.log('1. Go to: http://192.168.56.1:5173/auth');
      console.log('2. Enter email: gtthande@gmail.com');
      console.log('3. Enter password: Admin123!');
      console.log('4. Click "Sign In"');
      console.log('5. Then go to: http://192.168.56.1:5173/admin');
    } else {
      console.log('\n❌ Admin permission check failed!');
    }
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
  }
}

testWebAuth();
