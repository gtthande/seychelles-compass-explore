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
}

const testUsers: TestUser[] = [
  {
    email: 'gtthande@gmail.com',
    password: 'Admin123!',
    role: 'admin',
    name: 'Admin User'
  },
  {
    email: 'testbusiness@seychellescompass.com',
    password: 'TestBusiness123!',
    role: 'business',
    name: 'Test Business User'
  }
];

async function createUser(user: TestUser) {
  console.log(`🔐 Creating user: ${user.email} with role: ${user.role}`);
  
  try {
    // Check if user already exists by looking in profiles table
    const { data: existingProfile, error: checkError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', user.email)
      .single();
    
    if (existingProfile && !checkError) {
      console.log(`✅ User ${user.email} already exists`);
      
      // Update the profile role if needed
      const { error: profileError } = await supabase
        .from('profiles')
        .update({ 
          role: user.role,
          is_active: true,
          updated_at: new Date().toISOString()
        })
        .eq('id', existingProfile.id);
      
      if (profileError) {
        console.error(`❌ Error updating profile for ${user.email}:`, profileError);
      } else {
        console.log(`✅ Updated profile role for ${user.email} to ${user.role}`);
      }
      
      return existingProfile;
    }
    
    // Create new user
    const { data: authData, error: authError } = await supabase.auth.admin.createUser({
      email: user.email,
      password: user.password,
      email_confirm: true, // Auto-confirm email
      user_metadata: {
        name: user.name,
        role: user.role
      }
    });
    
    if (authError) {
      console.error(`❌ Error creating user ${user.email}:`, authError);
      return null;
    }
    
    console.log(`✅ Created user: ${user.email} with ID: ${authData.user?.id}`);
    
    // Ensure profile exists with correct role
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        id: authData.user!.id,
        email: user.email,
        role: user.role,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      });
    
    if (profileError) {
      console.error(`❌ Error creating/updating profile for ${user.email}:`, profileError);
    } else {
      console.log(`✅ Created/updated profile for ${user.email} with role: ${user.role}`);
    }
    
    return authData.user;
    
  } catch (error) {
    console.error(`❌ Unexpected error creating user ${user.email}:`, error);
    return null;
  }
}

async function seedAuthUsers() {
  console.log('🚀 Starting authentication user seeding...');
  
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
    
    // Create all test users
    const results = [];
    for (const user of testUsers) {
      const result = await createUser(user);
      results.push({ user, result });
    }
    
    // Summary
    console.log('\n📊 Seeding Summary:');
    console.log('==================');
    
    results.forEach(({ user, result }) => {
      if (result) {
        console.log(`✅ ${user.email} (${user.role}) - Ready`);
      } else {
        console.log(`❌ ${user.email} (${user.role}) - Failed`);
      }
    });
    
    // Verify all users exist
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
    console.log('');
    console.log('Business User:');
    console.log('  Email: testbusiness@seychellescompass.com');
    console.log('  Password: TestBusiness123!');
    console.log('  Role: business');
    console.log('');
    console.log('✅ Authentication seeding completed successfully!');
    
  } catch (error) {
    console.error('❌ Seeding failed:', error);
  }
}

// Run the seeding
seedAuthUsers();
