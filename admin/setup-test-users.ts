import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

// Create Supabase client with service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface TestUser {
  email: string;
  password: string;
  role: 'admin' | 'business';
  name: string;
  id: string; // We'll generate UUIDs for the test users
}

const testUsers: TestUser[] = [
  {
    id: '550e8400-e29b-41d4-a716-446655440001', // Fixed UUID for admin
    email: 'gtthande@gmail.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Admin User'
  },
  {
    id: '550e8400-e29b-41d4-a716-446655440002', // Fixed UUID for business
    email: 'testbusiness@seychellescompass.com',
    password: 'TestBusiness123!',
    role: 'business',
    name: 'Test Business User'
  }
];

async function setupTestUsers() {
  console.log('🚀 Setting up test user profiles...');
  
  try {
    // Test database connection
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Database connection failed:', testError);
      return;
    }
    
    console.log('✅ Database connection successful');
    
    // Create/update profiles for test users
    for (const user of testUsers) {
      console.log(`🔐 Setting up profile for: ${user.email} with role: ${user.role}`);
      
      const { data: profile, error } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          email: user.email,
          role: user.role,
          is_active: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) {
        console.error(`❌ Error setting up profile for ${user.email}:`, error);
      } else {
        console.log(`✅ Profile setup complete for ${user.email}`);
      }
    }
    
    // Verify all profiles exist
    console.log('\n🔍 Verification:');
    console.log('================');
    
    for (const user of testUsers) {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('email', user.email)
        .single();
      
      if (error || !profile) {
        console.log(`❌ ${user.email} - Profile not found`);
      } else {
        console.log(`✅ ${user.email} - Role: ${profile.role}, Active: ${profile.is_active}`);
      }
    }
    
    console.log('\n🎯 Test Credentials:');
    console.log('===================');
    console.log('Admin User:');
    console.log('  Email: gtthande@gmail.com');
    console.log('  Password: Admin123!');
    console.log('  Role: admin');
    console.log('  UUID: 550e8400-e29b-41d4-a716-446655440001');
    console.log('');
    console.log('Business User:');
    console.log('  Email: testbusiness@seychellescompass.com');
    console.log('  Password: TestBusiness123!');
    console.log('  Role: business');
    console.log('  UUID: 550e8400-e29b-41d4-a716-446655440002');
    console.log('');
    console.log('📝 IMPORTANT: You need to manually create these users in Supabase Auth:');
    console.log('1. Go to your Supabase dashboard');
    console.log('2. Navigate to Authentication > Users');
    console.log('3. Click "Add user" and create each user with the credentials above');
    console.log('4. Make sure to use the exact UUIDs provided for each user');
    console.log('');
    console.log('✅ Profile setup completed successfully!');
    
  } catch (error) {
    console.error('❌ Setup failed:', error);
  }
}

// Run the setup
setupTestUsers();
