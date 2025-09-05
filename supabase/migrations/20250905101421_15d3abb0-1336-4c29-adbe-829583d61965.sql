-- Create sample businesses and products for testing
INSERT INTO profiles (user_id, full_name, is_business_owner) VALUES 
(gen_random_uuid(), 'Sample Business Owner 1', true),
(gen_random_uuid(), 'Sample Business Owner 2', true),
(gen_random_uuid(), 'Sample Business Owner 3', true);

-- Insert sample businesses using the profile IDs we just created
WITH sample_profiles AS (
  SELECT id, user_id FROM profiles WHERE is_business_owner = true LIMIT 3
)
INSERT INTO businesses (
  owner_id, name, description, category, status, address, island, 
  phone, whatsapp, email, latitude, longitude, verified, featured
) 
SELECT 
  p.id,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Paradise Resort & Spa'
    WHEN row_number() OVER() = 2 THEN 'Seychelles Adventures Tours'
    ELSE 'Creole Delights Restaurant'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Luxury beachfront resort with world-class amenities'
    WHEN row_number() OVER() = 2 THEN 'Exciting island tours and water sports activities'
    ELSE 'Authentic Creole cuisine in the heart of Victoria'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'accommodation'
    WHEN row_number() OVER() = 2 THEN 'tours'
    ELSE 'food'
  END,
  'active',
  CASE 
    WHEN row_number() OVER() = 1 THEN 'Beau Vallon Beach, Mahé'
    WHEN row_number() OVER() = 2 THEN 'Victoria, Mahé'
    ELSE 'Victoria Market Street, Mahé'
  END,
  'Mahé',
  CASE 
    WHEN row_number() OVER() = 1 THEN '+248 4 123 456'
    WHEN row_number() OVER() = 2 THEN '+248 4 234 567'
    ELSE '+248 4 345 678'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN '+248 4 123 456'
    WHEN row_number() OVER() = 2 THEN '+248 4 234 567'
    ELSE '+248 4 345 678'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 'info@paradiseresort.sc'
    WHEN row_number() OVER() = 2 THEN 'tours@seyadventures.sc'
    ELSE 'info@creoledelights.sc'
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN -4.6199
    WHEN row_number() OVER() = 2 THEN -4.6191
    ELSE -4.6197
  END,
  CASE 
    WHEN row_number() OVER() = 1 THEN 55.4344
    WHEN row_number() OVER() = 2 THEN 55.4513
    ELSE 55.4516
  END,
  true,
  CASE 
    WHEN row_number() OVER() = 1 THEN true
    ELSE false
  END
FROM sample_profiles p;

-- Insert sample products
WITH sample_businesses AS (
  SELECT id, name, category FROM businesses WHERE status = 'active' LIMIT 3
)
INSERT INTO products (
  business_id, name, description, category, price, currency, status, in_stock, featured
)
SELECT 
  b.id,
  CASE 
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Deluxe Ocean View Room'
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 'Presidential Suite'
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Full Day Island Hopping'
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 'Sunset Catamaran Cruise'
    WHEN b.category = 'food' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Grilled Fish with Creole Rice'
    ELSE 'Coconut Curry Chicken'
  END,
  CASE 
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Spacious room with stunning ocean views and private balcony'
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 'Ultimate luxury suite with panoramic views'
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Visit 3 beautiful islands with snorkeling and lunch included'
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 'Romantic sunset cruise with cocktails and canapés'
    WHEN b.category = 'food' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 'Fresh catch of the day with traditional Creole seasonings'
    ELSE 'Tender chicken in rich coconut curry sauce'
  END,
  b.category,
  CASE 
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 350.00
    WHEN b.category = 'accommodation' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 750.00
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 95.00
    WHEN b.category = 'tours' AND row_number() OVER(PARTITION BY b.id) = 2 THEN 65.00
    WHEN b.category = 'food' AND row_number() OVER(PARTITION BY b.id) = 1 THEN 25.00
    ELSE 22.00
  END,
  'SCR',
  'active',
  true,
  CASE 
    WHEN row_number() OVER() <= 2 THEN true
    ELSE false
  END
FROM sample_businesses b
CROSS JOIN generate_series(1, 2) AS series;

-- Insert sample reviews
WITH sample_data AS (
  SELECT 
    b.id as business_id,
    p.user_id
  FROM businesses b
  CROSS JOIN profiles p 
  WHERE b.status = 'active' AND NOT p.is_business_owner
  LIMIT 6
)
INSERT INTO reviews (business_id, user_id, rating, comment)
SELECT 
  business_id,
  user_id,
  CASE 
    WHEN row_number() OVER() % 3 = 1 THEN 5
    WHEN row_number() OVER() % 3 = 2 THEN 4
    ELSE 5
  END,
  CASE 
    WHEN row_number() OVER() % 3 = 1 THEN 'Amazing experience! Highly recommended.'
    WHEN row_number() OVER() % 3 = 2 THEN 'Great service and beautiful location.'
    ELSE 'Fantastic! Will definitely come back.'
  END
FROM sample_data;