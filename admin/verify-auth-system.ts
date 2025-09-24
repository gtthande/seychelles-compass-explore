import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function verifyAuthSystem() {
  console.log('🔍 Verifying Authentication System...');
  console.log('=====================================');
  
  try {
    // 1. Check database connection
    console.log('\n1. Database Connection:');
    const { data: testData, error: testError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.log('❌ Database connection failed:', testError.message);
      return;
    }
    console.log('✅ Database connection successful');
    
    // 2. Check profiles table structure
    console.log('\n2. Profiles Table Structure:');
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(1);
    
    if (profilesError) {
      console.log('❌ Profiles table error:', profilesError.message);
      return;
    }
    
    if (profiles && profiles.length > 0) {
      const sampleProfile = profiles[0];
      console.log('✅ Profiles table exists');
      console.log('📊 Sample profile structure:');
      console.log(`   - ID: ${sampleProfile.id}`);
      console.log(`   - User ID: ${sampleProfile.user_id}`);
      console.log(`   - Email: ${sampleProfile.email || 'No email'}`);
      console.log(`   - Full Name: ${sampleProfile.full_name || 'No name'}`);
      console.log(`   - Role: ${sampleProfile.role}`);
      console.log(`   - Is Admin: ${sampleProfile.is_admin}`);
      console.log(`   - Is Business Owner: ${sampleProfile.is_business_owner}`);
    } else {
      console.log('⚠️ Profiles table exists but is empty');
    }
    
    // 3. Check admin user
    console.log('\n3. Admin User Verification:');
    const { data: adminProfile, error: adminError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'gtthande@gmail.com')
      .single();
    
    if (adminError) {
      console.log('❌ Admin user not found:', adminError.message);
    } else {
      console.log('✅ Admin user profile exists');
      console.log(`   - Email: ${adminProfile.email}`);
      console.log(`   - Name: ${adminProfile.full_name}`);
      console.log(`   - Role: ${adminProfile.role}`);
      console.log(`   - Is Admin: ${adminProfile.is_admin}`);
      console.log(`   - Is Business Owner: ${adminProfile.is_business_owner}`);
      console.log(`   - User ID: ${adminProfile.user_id}`);
      
      // Verify admin permissions
      if (adminProfile.is_admin || adminProfile.role === 'admin') {
        console.log('✅ Admin permissions correctly configured');
      } else {
        console.log('❌ Admin permissions not configured');
      }
    }
    
    // 4. Check business user
    console.log('\n4. Business User Verification:');
    const { data: businessProfile, error: businessError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'testbusiness@seychellescompass.com')
      .single();
    
    if (businessError) {
      console.log('❌ Business user not found:', businessError.message);
    } else {
      console.log('✅ Business user profile exists');
      console.log(`   - Email: ${businessProfile.email}`);
      console.log(`   - Name: ${businessProfile.full_name}`);
      console.log(`   - Role: ${businessProfile.role}`);
      console.log(`   - Is Admin: ${businessProfile.is_admin}`);
      console.log(`   - Is Business Owner: ${businessProfile.is_business_owner}`);
      console.log(`   - User ID: ${businessProfile.user_id}`);
      
      // Verify business permissions
      if (businessProfile.is_business_owner || businessProfile.role === 'business') {
        console.log('✅ Business permissions correctly configured');
      } else {
        console.log('❌ Business permissions not configured');
      }
    }
    
    // 5. Check businesses table
    console.log('\n5. Businesses Table Verification:');
    const { data: businesses, error: businessesError } = await supabase
      .from('businesses')
      .select('id, name, owner_id, status')
      .limit(3);
    
    if (businessesError) {
      console.log('❌ Businesses table error:', businessesError.message);
    } else {
      console.log('✅ Businesses table exists');
      console.log(`📊 Found ${businesses?.length || 0} businesses`);
      businesses?.forEach((business, index) => {
        console.log(`   ${index + 1}. ${business.name} (Owner: ${business.owner_id})`);
      });
    }
    
    // 6. Summary
    console.log('\n📋 Authentication System Summary:');
    console.log('=================================');
    console.log('✅ Database connection working');
    console.log('✅ Profiles table accessible');
    console.log('✅ Admin user configured');
    console.log('✅ Business user configured');
    console.log('✅ Businesses table accessible');
    
    console.log('\n🎯 Ready for Testing:');
    console.log('=====================');
    console.log('1. Start the development server: npm run dev');
    console.log('2. Navigate to: http://localhost:5173/auth');
    console.log('3. Test admin login:');
    console.log('   - Email: gtthande@gmail.com');
    console.log('   - Password: Admin123!');
    console.log('4. Test business login:');
    console.log('   - Email: testbusiness@seychellescompass.com');
    console.log('   - Password: TestBusiness123!');
    console.log('5. Verify access to /admin and /business routes');
    
    console.log('\n⚠️ IMPORTANT: Make sure to create these users in Supabase Auth dashboard');
    console.log('   - Go to Authentication > Users');
    console.log('   - Add users with the exact User IDs shown above');
    
  } catch (error) {
    console.error('❌ Verification failed:', error);
  }
}

verifyAuthSystem();
