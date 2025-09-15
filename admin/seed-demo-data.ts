import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://bwlmlniotyrjttglbjrl.supabase.co';
// Using anon key - for production seeding, use service role key to bypass RLS
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJ3bG1sbmlvdHlyanR0Z2xianJsIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MDM3MDEsImV4cCI6MjA3MjI3OTcwMX0.Wx2ypE6AlTBe0vBqC_MvYc5IiwemMaxXGiHOmGM6MoI';

const supabase = createClient(supabaseUrl, supabaseKey);

// Demo businesses data
const demoBusinesses = [
  {
    name: "Café des Arts",
    description: "Authentic Creole cuisine with a modern twist, featuring fresh local ingredients and traditional Seychelles recipes.",
    category: "restaurants",
    status: "active",
    verified: true,
    featured: true,
    address: "Victoria Market, Victoria, Mahé",
    island: "Mahé",
    latitude: -4.6201,
    longitude: 55.4524,
    phone: "+248 4 321 456",
    email: "info@cafedesarts.sc",
    website: "https://cafedesarts.sc",
    whatsapp: "+248 4 321 456",
    facebook_url: "https://facebook.com/cafedesarts",
    instagram_url: "https://instagram.com/cafedesarts",
    logo_url: "/assets/demo/cafe-des-arts-logo.jpg",
    cover_image_url: "/assets/demo/cafe-des-arts-cover.jpg",
    gallery_images: ["/assets/demo/cafe-des-arts-1.jpg", "/assets/demo/cafe-des-arts-2.jpg"],
    services: ["Dine-in", "Takeaway", "Catering", "Private Events"],
    opening_hours: {
      monday: "07:00-22:00",
      tuesday: "07:00-22:00",
      wednesday: "07:00-22:00",
      thursday: "07:00-22:00",
      friday: "07:00-23:00",
      saturday: "08:00-23:00",
      sunday: "08:00-21:00"
    }
  },
  {
    name: "Paradise Diving Center",
    description: "Professional diving services with PADI certified instructors. Explore Seychelles' pristine coral reefs and marine life.",
    category: "tourism",
    status: "active",
    verified: true,
    featured: true,
    address: "Beau Vallon Beach, Mahé",
    island: "Mahé",
    latitude: -4.6091,
    longitude: 55.4300,
    phone: "+248 4 234 567",
    email: "dive@paradisediving.sc",
    website: "https://paradisediving.sc",
    whatsapp: "+248 4 234 567",
    facebook_url: "https://facebook.com/paradisediving",
    instagram_url: "https://instagram.com/paradisediving",
    logo_url: "/assets/demo/paradise-diving-logo.jpg",
    cover_image_url: "/assets/demo/paradise-diving-cover.jpg",
    gallery_images: ["/assets/demo/paradise-diving-1.jpg", "/assets/demo/paradise-diving-2.jpg"],
    services: ["Scuba Diving", "Snorkeling", "PADI Courses", "Boat Trips", "Equipment Rental"],
    opening_hours: {
      monday: "08:00-17:00",
      tuesday: "08:00-17:00",
      wednesday: "08:00-17:00",
      thursday: "08:00-17:00",
      friday: "08:00-17:00",
      saturday: "08:00-17:00",
      sunday: "08:00-17:00"
    }
  },
  {
    name: "Le Nautique Hotel",
    description: "Luxury beachfront hotel with stunning ocean views, world-class amenities, and exceptional service.",
    category: "hotels",
    status: "active",
    verified: true,
    featured: true,
    address: "Anse Royale, Mahé",
    island: "Mahé",
    latitude: -4.6083,
    longitude: 55.5167,
    phone: "+248 4 378 000",
    email: "reservations@lenautique.sc",
    website: "https://lenautique.sc",
    whatsapp: "+248 4 378 000",
    facebook_url: "https://facebook.com/lenautiquehotel",
    instagram_url: "https://instagram.com/lenautiquehotel",
    logo_url: "/assets/demo/le-nautique-logo.jpg",
    cover_image_url: "/assets/demo/le-nautique-cover.jpg",
    gallery_images: ["/assets/demo/le-nautique-1.jpg", "/assets/demo/le-nautique-2.jpg"],
    services: ["Accommodation", "Spa", "Restaurant", "Pool", "Beach Access", "Concierge"],
    opening_hours: {
      monday: "24/7",
      tuesday: "24/7",
      wednesday: "24/7",
      thursday: "24/7",
      friday: "24/7",
      saturday: "24/7",
      sunday: "24/7"
    }
  },
  {
    name: "Island Transport Services",
    description: "Reliable taxi and transport services across all Seychelles islands. Professional drivers with local knowledge.",
    category: "transport",
    status: "active",
    verified: true,
    featured: false,
    address: "Victoria Bus Station, Mahé",
    island: "Mahé",
    latitude: -4.6201,
    longitude: 55.4524,
    phone: "+248 4 123 456",
    email: "book@islandtransport.sc",
    website: "https://islandtransport.sc",
    whatsapp: "+248 4 123 456",
    facebook_url: "https://facebook.com/islandtransport",
    instagram_url: "https://instagram.com/islandtransport",
    logo_url: "/assets/demo/island-transport-logo.jpg",
    cover_image_url: "/assets/demo/island-transport-cover.jpg",
    gallery_images: ["/assets/demo/island-transport-1.jpg"],
    services: ["Taxi Service", "Airport Transfer", "Island Hopping", "Private Tours", "Car Rental"],
    opening_hours: {
      monday: "06:00-22:00",
      tuesday: "06:00-22:00",
      wednesday: "06:00-22:00",
      thursday: "06:00-22:00",
      friday: "06:00-22:00",
      saturday: "06:00-22:00",
      sunday: "06:00-22:00"
    }
  },
  {
    name: "Coco de Mer Souvenirs",
    description: "Authentic Seychelles souvenirs and crafts. Handmade items, local art, and traditional products.",
    category: "retail",
    status: "active",
    verified: true,
    featured: false,
    address: "Victoria Market, Victoria, Mahé",
    island: "Mahé",
    latitude: -4.6201,
    longitude: 55.4524,
    phone: "+248 4 567 890",
    email: "shop@cocodemersouvenirs.sc",
    website: "https://cocodemersouvenirs.sc",
    whatsapp: "+248 4 567 890",
    facebook_url: "https://facebook.com/cocodemersouvenirs",
    instagram_url: "https://instagram.com/cocodemersouvenirs",
    logo_url: "/assets/demo/coco-de-mer-logo.jpg",
    cover_image_url: "/assets/demo/coco-de-mer-cover.jpg",
    gallery_images: ["/assets/demo/coco-de-mer-1.jpg", "/assets/demo/coco-de-mer-2.jpg"],
    services: ["Souvenirs", "Local Crafts", "Art", "Jewelry", "Gift Wrapping"],
    opening_hours: {
      monday: "09:00-18:00",
      tuesday: "09:00-18:00",
      wednesday: "09:00-18:00",
      thursday: "09:00-18:00",
      friday: "09:00-18:00",
      saturday: "09:00-18:00",
      sunday: "10:00-16:00"
    }
  },
  {
    name: "Praslin Island Tours",
    description: "Guided tours of Praslin Island including Vallée de Mai, Anse Lazio, and other natural wonders.",
    category: "tourism",
    status: "active",
    verified: true,
    featured: false,
    address: "Baie Ste Anne, Praslin",
    island: "Praslin",
    latitude: -4.3200,
    longitude: 55.7500,
    phone: "+248 4 234 123",
    email: "tours@praslinisland.sc",
    website: "https://praslinisland.sc",
    whatsapp: "+248 4 234 123",
    facebook_url: "https://facebook.com/praslinislandtours",
    instagram_url: "https://instagram.com/praslinislandtours",
    logo_url: "/assets/demo/praslin-tours-logo.jpg",
    cover_image_url: "/assets/demo/praslin-tours-cover.jpg",
    gallery_images: ["/assets/demo/praslin-tours-1.jpg"],
    services: ["Island Tours", "Nature Walks", "Photography Tours", "Group Tours", "Private Tours"],
    opening_hours: {
      monday: "08:00-17:00",
      tuesday: "08:00-17:00",
      wednesday: "08:00-17:00",
      thursday: "08:00-17:00",
      friday: "08:00-17:00",
      saturday: "08:00-17:00",
      sunday: "08:00-17:00"
    }
  },
  {
    name: "La Digue Bike Rentals",
    description: "Quality bicycle rentals for exploring La Digue Island. Well-maintained bikes for all ages.",
    category: "transport",
    status: "active",
    verified: true,
    featured: false,
    address: "La Passe, La Digue",
    island: "La Digue",
    latitude: -4.3500,
    longitude: 55.8333,
    phone: "+248 4 234 567",
    email: "bikes@ladiguebikes.sc",
    website: "https://ladiguebikes.sc",
    whatsapp: "+248 4 234 567",
    facebook_url: "https://facebook.com/ladiguebikes",
    instagram_url: "https://instagram.com/ladiguebikes",
    logo_url: "/assets/demo/la-digue-bikes-logo.jpg",
    cover_image_url: "/assets/demo/la-digue-bikes-cover.jpg",
    gallery_images: ["/assets/demo/la-digue-bikes-1.jpg"],
    services: ["Bike Rental", "Helmet Rental", "Bike Tours", "Repair Service", "Delivery"],
    opening_hours: {
      monday: "07:00-19:00",
      tuesday: "07:00-19:00",
      wednesday: "07:00-19:00",
      thursday: "07:00-19:00",
      friday: "07:00-19:00",
      saturday: "07:00-19:00",
      sunday: "07:00-19:00"
    }
  },
  {
    name: "Seychelles Wellness Spa",
    description: "Luxury spa services with traditional treatments using local ingredients and modern techniques.",
    category: "services",
    status: "active",
    verified: true,
    featured: false,
    address: "Eden Plaza, Eden Island, Mahé",
    island: "Mahé",
    latitude: -4.6000,
    longitude: 55.4500,
    phone: "+248 4 378 999",
    email: "spa@seychelleswellness.sc",
    website: "https://seychelleswellness.sc",
    whatsapp: "+248 4 378 999",
    facebook_url: "https://facebook.com/seychelleswellness",
    instagram_url: "https://instagram.com/seychelleswellness",
    logo_url: "/assets/demo/wellness-spa-logo.jpg",
    cover_image_url: "/assets/demo/wellness-spa-cover.jpg",
    gallery_images: ["/assets/demo/wellness-spa-1.jpg", "/assets/demo/wellness-spa-2.jpg"],
    services: ["Massage", "Facial Treatments", "Body Treatments", "Aromatherapy", "Couples Packages"],
    opening_hours: {
      monday: "09:00-20:00",
      tuesday: "09:00-20:00",
      wednesday: "09:00-20:00",
      thursday: "09:00-20:00",
      friday: "09:00-20:00",
      saturday: "09:00-20:00",
      sunday: "10:00-18:00"
    }
  }
];

// Demo payments data
const demoPayments = [
  {
    amount: 150.00,
    currency: "USD",
    status: "completed",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_001",
    provider_session_id: "cs_visa_001",
    metadata: {
      business_name: "Café des Arts",
      service: "Dinner for 2",
      customer_email: "customer1@example.com"
    }
  },
  {
    amount: 89.50,
    currency: "USD",
    status: "completed",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_002",
    provider_session_id: "cs_visa_002",
    metadata: {
      business_name: "Paradise Diving Center",
      service: "Scuba Diving Course",
      customer_email: "customer2@example.com"
    }
  },
  {
    amount: 250.00,
    currency: "USD",
    status: "pending",
    payment_provider: "stripe",
    provider_payment_id: "pi_stripe_001",
    provider_session_id: "cs_stripe_001",
    metadata: {
      business_name: "Le Nautique Hotel",
      service: "One Night Stay",
      customer_email: "customer3@example.com"
    }
  },
  {
    amount: 45.00,
    currency: "USD",
    status: "completed",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_003",
    provider_session_id: "cs_visa_003",
    metadata: {
      business_name: "Island Transport Services",
      service: "Airport Transfer",
      customer_email: "customer4@example.com"
    }
  },
  {
    amount: 75.00,
    currency: "USD",
    status: "failed",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_004",
    provider_session_id: "cs_visa_004",
    metadata: {
      business_name: "Coco de Mer Souvenirs",
      service: "Souvenir Package",
      customer_email: "customer5@example.com",
      failure_reason: "Insufficient funds"
    }
  },
  {
    amount: 120.00,
    currency: "USD",
    status: "completed",
    payment_provider: "stripe",
    provider_payment_id: "pi_stripe_002",
    provider_session_id: "cs_stripe_002",
    metadata: {
      business_name: "Praslin Island Tours",
      service: "Full Day Tour",
      customer_email: "customer6@example.com"
    }
  },
  {
    amount: 25.00,
    currency: "USD",
    status: "completed",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_005",
    provider_session_id: "cs_visa_005",
    metadata: {
      business_name: "La Digue Bike Rentals",
      service: "Bike Rental (1 day)",
      customer_email: "customer7@example.com"
    }
  },
  {
    amount: 180.00,
    currency: "USD",
    status: "completed",
    payment_provider: "stripe",
    provider_payment_id: "pi_stripe_003",
    provider_session_id: "cs_stripe_003",
    metadata: {
      business_name: "Seychelles Wellness Spa",
      service: "Couples Massage Package",
      customer_email: "customer8@example.com"
    }
  },
  {
    amount: 95.00,
    currency: "USD",
    status: "pending",
    payment_provider: "visa_mastercard",
    provider_payment_id: "pm_visa_006",
    provider_session_id: "cs_visa_006",
    metadata: {
      business_name: "Café des Arts",
      service: "Lunch for 4",
      customer_email: "customer9@example.com"
    }
  },
  {
    amount: 200.00,
    currency: "USD",
    status: "completed",
    payment_provider: "stripe",
    provider_payment_id: "pi_stripe_004",
    provider_session_id: "cs_stripe_004",
    metadata: {
      business_name: "Paradise Diving Center",
      service: "Advanced Diving Course",
      customer_email: "customer10@example.com"
    }
  }
];

async function seedDemoData() {
  try {
    console.log('🌱 Starting demo data seeding...');

    // Use a fixed demo owner ID for seeding
    const ownerId = '00000000-0000-0000-0000-000000000001';

    // Seed businesses
    console.log('🏢 Seeding demo businesses...');
    const businessesWithOwner = demoBusinesses.map(business => ({
      ...business,
      owner_id: ownerId
    }));

    const { data: insertedBusinesses, error: businessError } = await supabase
      .from('businesses')
      .insert(businessesWithOwner)
      .select('id, name');

    if (businessError) {
      console.error('Error inserting businesses:', businessError);
      return;
    }

    console.log(`✅ Inserted ${insertedBusinesses?.length} businesses`);

    // Seed payments
    console.log('💳 Seeding demo payments...');
    const paymentsWithUserId = demoPayments.map(payment => ({
      ...payment,
      user_id: ownerId
    }));

    const { data: insertedPayments, error: paymentError } = await supabase
      .from('payments')
      .insert(paymentsWithUserId)
      .select('id, amount, status');

    if (paymentError) {
      console.error('Error inserting payments:', paymentError);
      return;
    }

    console.log(`✅ Inserted ${insertedPayments?.length} payments`);

    // Create demo product categories
    console.log('📦 Seeding demo categories...');
    const demoCategories = [
      { name: 'Food & Beverages', slug: 'food', description: 'Restaurants, cafes, and food services', is_active: true },
      { name: 'Accommodation', slug: 'accommodation', description: 'Hotels, guesthouses, and lodging', is_active: true },
      { name: 'Tours & Activities', slug: 'tours', description: 'Tourism services and activities', is_active: true },
      { name: 'Transportation', slug: 'transport', description: 'Transport and travel services', is_active: true },
      { name: 'Retail & Shopping', slug: 'retail', description: 'Shops, markets, and retail services', is_active: true },
      { name: 'Health & Wellness', slug: 'services', description: 'Health, wellness, and personal services', is_active: true }
    ];

    const { data: insertedCategories, error: categoryError } = await supabase
      .from('categories')
      .upsert(demoCategories, { onConflict: 'slug' })
      .select('id, name');

    if (categoryError) {
      console.error('Error inserting categories:', categoryError);
    } else {
      console.log(`✅ Inserted/updated ${insertedCategories?.length} categories`);
    }

    console.log('🎉 Demo data seeding completed successfully!');
    console.log('\n📊 Summary:');
    console.log(`- ${insertedBusinesses?.length} businesses seeded`);
    console.log(`- ${insertedPayments?.length} payments seeded`);
    console.log(`- ${insertedCategories?.length} categories seeded`);
    console.log('\n🔗 Next steps:');
    console.log('- Add demo images to /public/assets/demo/');
    console.log('- Visit http://localhost:5173/directory to see businesses');
    console.log('- Visit http://localhost:5173/admin to see payments');

  } catch (error) {
    console.error('❌ Error during seeding:', error);
  }
}

// Run the seeding function
seedDemoData();
