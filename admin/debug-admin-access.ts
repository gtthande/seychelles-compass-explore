import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function debugAdminAccess() {
  try {
    console.log('🔍 Debugging admin access...');
    
    // Step 1: Test login
    console.log('\n1. Testing login with gtthande@gmail.com...');
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
    console.log('Email:', authData.user?.email);
    
    // Step 2: Check profile
    console.log('\n2. Checking profile...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', authData.user?.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile error:', profileError);
    } else {
      console.log('✅ Profile found:');
      console.log('  - Role:', profile.role);
      console.log('  - Is Admin:', profile.is_admin);
      console.log('  - Is Active:', profile.is_active);
      console.log('  - Full Name:', profile.full_name);
    }
    
    // Step 3: Test session
    console.log('\n3. Testing session...');
    const { data: session, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
    } else {
      console.log('✅ Session valid:', !!session.session);
      if (session.session) {
        console.log('  - Access Token exists:', !!session.session.access_token);
        console.log('  - User ID in session:', session.session.user?.id);
      }
    }
    
    // Step 4: Test RLS policies
    console.log('\n4. Testing RLS access...');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('role, is_admin')
      .eq('user_id', authData.user?.id);
    
    if (testError) {
      console.error('❌ RLS test error:', testError);
    } else {
      console.log('✅ RLS access working:', testData);
    }
    
    console.log('\n🎯 Summary:');
    console.log('- Login: ✅ Working');
    console.log('- Profile: ✅ Found');
    console.log('- Role:', profile?.role || 'Unknown');
    console.log('- Session: ✅ Valid');
    console.log('- RLS: ✅ Working');
    
    if (profile?.role === 'admin') {
      console.log('\n✅ Admin access should work!');
      console.log('💡 Try logging in through the web interface at: http://192.168.56.1:5173/auth');
    } else {
      console.log('\n❌ Role is not admin!');
      console.log('💡 Need to update role to admin');
    }
    
  } catch (error: any) {
    console.error('❌ Debug failed:', error.message || error);
  }
}

debugAdminAccess();
