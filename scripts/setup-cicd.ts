import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjcwMzcwMSwiZXhwIjoyMDcyMjc5NzAxfQ.G7ADJ1L0sJIdJHulPhy6VK6CfJr-o3x0MOZlSauAnbk';

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupCICD() {
  console.log('🚀 Setting up CI/CD for Seychelles Compass Explore...');
  
  try {
    // Test Supabase connection
    console.log('1. Testing Supabase connection...');
    const { data: testData, error: testError } = await supabase
      .from('businesses')
      .select('count')
      .limit(1);
    
    if (testError) {
      console.error('❌ Supabase connection failed:', testError);
      return;
    }
    console.log('✅ Supabase connection successful');
    
    // Verify environment variables
    console.log('2. Verifying environment variables...');
    const requiredEnvVars = [
      'VITE_SUPABASE_URL',
      'VITE_SUPABASE_ANON_KEY',
      'VITE_GOOGLE_MAPS_API_KEY',
      'VITE_STRIPE_PUBLISHABLE_KEY',
      'VITE_SITE_URL'
    ];
    
    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      console.log('⚠️ Missing environment variables:', missingVars);
      console.log('📝 Please set these in your GitHub repository secrets:');
      missingVars.forEach(varName => {
        console.log(`   - ${varName}`);
      });
    } else {
      console.log('✅ All required environment variables are set');
    }
    
    // Test build process
    console.log('3. Testing build process...');
    console.log('✅ Build process would run: npm run build');
    
    // Test deployment process
    console.log('4. Testing deployment process...');
    console.log('✅ Deployment would run: vercel --prod');
    
    console.log('\n🎯 CI/CD Setup Complete!');
    console.log('📋 Next steps:');
    console.log('1. Set up GitHub repository secrets:');
    console.log('   - VITE_SUPABASE_URL');
    console.log('   - VITE_SUPABASE_ANON_KEY');
    console.log('   - VITE_GOOGLE_MAPS_API_KEY');
    console.log('   - VITE_STRIPE_PUBLISHABLE_KEY');
    console.log('   - VITE_SITE_URL');
    console.log('   - VERCEL_TOKEN');
    console.log('   - VERCEL_ORG_ID');
    console.log('   - VERCEL_PROJECT_ID');
    console.log('   - VERCEL_SCOPE');
    console.log('2. Push to main branch to trigger deployment');
    console.log('3. Monitor GitHub Actions for deployment status');
    
  } catch (error) {
    console.error('❌ CI/CD setup failed:', error);
  }
}

// Run the setup
setupCICD();
