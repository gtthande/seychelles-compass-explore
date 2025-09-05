-- Update existing profiles to be business owners
UPDATE profiles SET is_business_owner = true, business_name = 'Sample Business' WHERE user_id IN (
  SELECT user_id FROM profiles LIMIT 2
);

-- Insert sample businesses using existing profile IDs
WITH sample_profiles AS (
  SELECT id, user_id FROM profiles WHERE is_business_owner = true LIMIT 2
)
INSERT INTO businesses (
  owner_id, name, description, category, status, address, island, 
  phone, whatsapp, email, latitude, longitude, verified, featured
) 
SELECT 
  p.id,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Paradise Resort & Spa'
    ELSE 'Seychelles Adventures Tours'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Luxury beachfront resort with world-class amenities'
    ELSE 'Exciting island tours and water sports activities'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'hotels'::business_category
    ELSE 'tourism'::business_category
  END,
  'active'::business_status,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Beau Vallon Beach, Mahé'
    ELSE 'Victoria, Mahé'
  END,
  'Mahé',
  CASE 
    WHEN row_number() OVER() = 1 THEN '+248 4 123 456'
    ELSE '+248 4 234 567'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN '+248 4 123 456'
    ELSE '+248 4 234 567'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'info@paradiseresort.sc'
    ELSE 'tours@seyadventures.sc'
  END,
  -4.6199,
  55.4344,
  true,
  CASE 
    WHEN row_number() OVER() = 1 THEN true
    ELSE false
  END
FROM sample_profiles p;

-- Insert sample products
WITH sample_businesses AS (
  SELECT id, name, category FROM businesses WHERE status = 'active' LIMIT 2
)
INSERT INTO products (
  business_id, name, description, category, price, currency, status, in_stock, featured
)
SELECT 
  b.id,
  CASE 
    WHEN b.category = 'hotels' THEN 'Deluxe Ocean View Room'
    ELSE 'Full Day Island Hopping'
  END,
  CASE 
    WHEN b.category = 'hotels' THEN 'Spacious room with stunning ocean views and private balcony'
    ELSE 'Visit 3 beautiful islands with snorkeling and lunch included'
  END,
  CASE 
    WHEN b.category = 'hotels' THEN 'accommodation'
    ELSE 'tours'
  END,
  CASE 
    WHEN b.category = 'hotels' THEN 350.00
    ELSE 95.00
  END,
  'SCR',
  'active'::listing_status,
  true,
  true
FROM sample_businesses b;

-- Insert sample reviews using proper profile IDs
WITH sample_data AS (
  SELECT 
    b.id as business_id,
    p.id as profile_id
  FROM businesses b
  CROSS JOIN profiles p 
  WHERE b.status = 'active'
  LIMIT 2
)
INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT 
  business_id,
  profile_id,
  5,
  'Amazing experience! Highly recommended.'
FROM sample_data;