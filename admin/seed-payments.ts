import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://bwlmlniotyrjttglbjrl.supabase.co";
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || "your-service-role-key-here";

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

async function seedPayments() {
  console.log('🌱 Seeding demo payments data...');

  try {
    // First, create demo users if they don't exist
    const demoUsers = [
      {
        id: 'demo-user-1',
        email: 'demo1@seychelles-compass.com',
        full_name: 'John Smith',
        business_name: 'Paradise Tours',
        is_business_owner: true,
        is_admin: false
      },
      {
        id: 'demo-user-2', 
        email: 'demo2@seychelles-compass.com',
        full_name: 'Marie Dubois',
        business_name: 'Coral Restaurant',
        is_business_owner: true,
        is_admin: false
      }
    ];

    // Insert demo users into profiles
    for (const user of demoUsers) {
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: user.id,
          user_id: user.id,
          full_name: user.full_name,
          business_name: user.business_name,
          is_business_owner: user.is_business_owner,
          is_admin: user.is_admin,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (profileError) {
        console.log(`⚠️  Profile ${user.email} might already exist:`, profileError.message);
      } else {
        console.log(`✅ Created profile for ${user.email}`);
      }
    }

    // Create demo payments
    const demoPayments = [
      {
        id: 'demo-payment-1',
        user_id: 'demo-user-1',
        amount: 150.00,
        currency: 'USD',
        status: 'paid',
        payment_provider: 'visa_mastercard',
        provider_payment_id: 'pm_demo_visa_123456',
        provider_session_id: 'cs_demo_session_123456',
        metadata: {
          business_name: 'Paradise Tours',
          service: 'Business Registration Premium',
          payment_method: 'Visa ending in 4242',
          customer_email: 'demo1@seychelles-compass.com'
        },
        created_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2 days ago
        updated_at: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-payment-2',
        user_id: 'demo-user-2',
        amount: 75.00,
        currency: 'USD',
        status: 'pending',
        payment_provider: 'visa_mastercard',
        provider_payment_id: null,
        provider_session_id: 'cs_demo_session_789012',
        metadata: {
          business_name: 'Coral Restaurant',
          service: 'Business Registration Standard',
          payment_method: 'Mastercard ending in 5555',
          customer_email: 'demo2@seychelles-compass.com'
        },
        created_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        updated_at: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'demo-payment-3',
        user_id: 'demo-user-1',
        amount: 200.00,
        currency: 'USD',
        status: 'failed',
        payment_provider: 'stripe',
        provider_payment_id: 'pi_demo_stripe_failed',
        provider_session_id: 'cs_demo_stripe_session',
        metadata: {
          business_name: 'Paradise Tours',
          service: 'Business Registration Premium + Featured Listing',
          payment_method: 'Visa ending in 0000',
          customer_email: 'demo1@seychelles-compass.com',
          failure_reason: 'Insufficient funds'
        },
        created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3 days ago
        updated_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
      }
    ];

    // Insert demo payments
    for (const payment of demoPayments) {
      const { error: paymentError } = await supabase
        .from('payments')
        .upsert(payment);

      if (paymentError) {
        console.log(`⚠️  Payment ${payment.id} might already exist:`, paymentError.message);
      } else {
        console.log(`✅ Created payment ${payment.id} - ${payment.status} - $${payment.amount}`);
      }
    }

    // Seed app_settings for payment providers
    const appSettings = [
      {
        key: 'PAYMENT_PROVIDER',
        value: 'visa_mastercard'
      },
      {
        key: 'STRIPE_PUBLISHABLE_KEY',
        value: 'pk_test_demo_stripe_key'
      },
      {
        key: 'STRIPE_SECRET_KEY',
        value: 'sk_test_demo_stripe_secret'
      },
      {
        key: 'CARD_GATEWAY_API_KEY',
        value: 'demo_card_gateway_key'
      },
      {
        key: 'CARD_GATEWAY_ENDPOINT',
        value: 'https://api.demo-card-gateway.com'
      }
    ];

    for (const setting of appSettings) {
      const { error: settingError } = await supabase
        .from('app_settings')
        .upsert({
          key: setting.key,
          value: setting.value,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });

      if (settingError) {
        console.log(`⚠️  Setting ${setting.key} might already exist:`, settingError.message);
      } else {
        console.log(`✅ Created setting ${setting.key}`);
      }
    }

    console.log('🎉 Demo payments data seeded successfully!');
    console.log('📊 You can now view the Payments Dashboard in the admin panel');
    console.log('🔗 Access admin panel at: http://localhost:5173/admin');

  } catch (error) {
    console.error('❌ Error seeding payments data:', error);
  }
}

// Run the seeding function
seedPayments();
