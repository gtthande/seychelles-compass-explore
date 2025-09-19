import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || 'https://bwlmlniotyrjttglbjrl.supabase.co';
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAdminLogin() {
  try {
    console.log('Testing admin login credentials...');
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: 'gtthande@gmail.com',
      password: 'Admin123!'
    });
    
    if (error) {
      console.error('❌ Login failed:', error.message);
      console.log('Error details:', error);
      return;
    }
    
    console.log('✅ Login successful!');
    console.log('User ID:', data.user?.id);
    console.log('Email:', data.user?.email);
    console.log('Email confirmed:', data.user?.email_confirmed_at);
    
    // Check profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', data.user?.id)
      .single();
    
    if (profileError) {
      console.error('❌ Profile fetch failed:', profileError);
    } else {
      console.log('✅ Profile found:');
      console.log('Role:', profile.role);
      console.log('Is Admin:', profile.is_admin);
      console.log('Full Name:', profile.full_name);
    }
    
    // Sign out
    await supabase.auth.signOut();
    console.log('✅ Signed out successfully');
    
  } catch (error: any) {
    console.error('❌ Test failed:', error.message || error);
  }
}

testAdminLogin();
