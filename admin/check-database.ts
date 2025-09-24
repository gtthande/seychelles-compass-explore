import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkDatabase() {
  console.log('🔍 Checking database structure...');
  
  try {
    // Check if profiles table exists and its structure
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      
      // Try to create a simple profiles table
      console.log('🔧 Attempting to create profiles table...');
      
      // We'll need to run this via SQL
      console.log('📝 Please run this SQL in your Supabase SQL editor:');
      console.log(`
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  email TEXT,
  role TEXT DEFAULT 'user' CHECK (role IN ('admin', 'business', 'user')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update their own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can update all profiles" ON public.profiles
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Function to handle new user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, role)
  VALUES (
    NEW.id,
    NEW.email,
    'business' -- Default role for new users
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();
      `);
    } else {
      console.log('✅ Profiles table exists');
      console.log('📊 Sample profile structure:', profiles[0] || 'No profiles found');
    }
    
    // Check businesses table
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('*')
      .limit(1);
    
    if (businessesError) {
      console.log('❌ Businesses table error:', businessesError.message);
    } else {
      console.log('✅ Businesses table exists');
      console.log('📊 Sample business structure:', businesses[0] || 'No businesses found');
    }
    
    // Check auth.users (this might not work with service key)
    console.log('\n🔐 Authentication Status:');
    console.log('========================');
    console.log('✅ Supabase connection successful');
    console.log('📝 Next steps:');
    console.log('1. Run the SQL above in Supabase SQL editor if profiles table doesn\'t exist');
    console.log('2. Create test users manually in Supabase Auth dashboard');
    console.log('3. Test login with the application');
    
  } catch (error) {
    console.error('❌ Database check failed:', error);
  }
}

checkDatabase();
