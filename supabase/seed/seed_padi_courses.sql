-- ============================
-- Seed PADI Diving Courses
-- ============================
-- This script inserts PADI courses extracted from https://store.padi.com/en-gb/courses/
-- into the products table and associates them with a dive business.
--
-- Prerequisites:
-- 1. Migration 20250210000001_data_preserving_schema_align.sql must be applied
-- 2. At least one business must exist in the businesses table (preferably a dive/tourism business)
-- ============================

BEGIN;

-- Step 1: Find or create a dive business
-- First, try to find an existing dive/tourism business
DO $$
DECLARE
    dive_business_id UUID;
    tourism_category_id UUID;
BEGIN
    -- Find tourism category
    SELECT id INTO tourism_category_id 
    FROM public.categories 
    WHERE title ILIKE '%tourism%' OR title ILIKE '%dive%' OR slug = 'tourism'
    LIMIT 1;
    
    -- If no tourism category exists, create one
    IF tourism_category_id IS NULL THEN
        INSERT INTO public.categories (title, description, slug, is_active)
        VALUES ('Tourism', 'Tour and travel services including diving', 'tourism', true)
        RETURNING id INTO tourism_category_id;
    END IF;
    
    -- Find existing dive business
    SELECT id INTO dive_business_id
    FROM public.businesses
    WHERE (title ILIKE '%dive%' OR title ILIKE '%scuba%' OR description ILIKE '%dive%')
      AND is_active = true
    LIMIT 1;
    
    -- If no dive business exists, create one
    IF dive_business_id IS NULL THEN
        INSERT INTO public.businesses (
            title,
            description,
            category_id,
            is_active,
            is_verified,
            searchable,
            slug
        )
        VALUES (
            'Seychelles Dive Center',
            'Professional PADI dive center offering courses and dive trips in the Seychelles',
            tourism_category_id,
            true,
            true,
            true,
            'seychelles-dive-center'
        )
        RETURNING id INTO dive_business_id;
    END IF;
    
    -- Store business_id in a temporary table for use in product inserts
    CREATE TEMP TABLE IF NOT EXISTS temp_dive_business (id UUID);
    DELETE FROM temp_dive_business;
    INSERT INTO temp_dive_business VALUES (dive_business_id);
END $$;

-- Step 2: Insert PADI courses as products
-- Note: Prices are in GBP (£) - convert to USD or local currency as needed
INSERT INTO public.products (
    title,
    description,
    price,
    duration,
    is_active,
    searchable,
    stock,
    slug,
    business_id
)
SELECT 
    course_data.title,
    course_data.description,
    course_data.price,
    course_data.duration,
    true,
    true,
    0, -- Unlimited stock
    course_data.slug,
    (SELECT id FROM temp_dive_business LIMIT 1)
FROM (VALUES
    (
        'Open Water Diver',
        'Learn how to safely explore and protect the underwater world, perform basic dive skills and set up scuba equipment.',
        203.00,
        '3-4 days',
        'open-water-diver'
    ),
    (
        'Advanced Open Water Diver',
        'Experience new adventures with an instructor by your side. Designed for novice divers who want to improve their skills.',
        203.00,
        '2-3 days',
        'advanced-open-water-diver'
    ),
    (
        'Rescue Diver',
        'Improve your confidence and become a better dive buddy through fun role-playing and skill practice.',
        203.00,
        '3-4 days',
        'rescue-diver'
    ),
    (
        'Enriched Air (Nitrox) Diver',
        'Extend your bottom time, shorten your surface intervals and dive deeper on repetitive dives.',
        203.00,
        '1 day',
        'enriched-air-nitrox-diver'
    ),
    (
        'Wreck Diver',
        'Learn how to survey and explore wrecks responsibly with special finning techniques, lines and reels, and avoid common problems.',
        148.00,
        '2 days',
        'wreck-diver'
    ),
    (
        'Night Diver',
        'See the underwater world after sundown and learn how to navigate, ascend and descend, and use your dive light to communicate at night.',
        148.00,
        '1 day',
        'night-diver'
    ),
    (
        'Peak Performance Buoyancy',
        'Find the perfect balance: Dive with less weight, and improve your buoyancy control and air consumption.',
        148.00,
        '1 day',
        'peak-performance-buoyancy'
    ),
    (
        'Digital Underwater Photographer',
        'Share your adventures and learn how to use underwater strobes, reduce backscatter, safely photograph marine life, and choose photo equipment.',
        148.00,
        '1 day',
        'digital-underwater-photographer'
    ),
    (
        'ReActivate Scuba Refresher Program',
        'Haven''t been diving in awhile? Renew your scuba skills and move quickly through topics you know well to build confidence for your next underwater adventure.',
        70.00,
        'Half day',
        'reactivate-scuba-refresher-program'
    )
) AS course_data(title, description, price, duration, slug)
WHERE NOT EXISTS (
    SELECT 1 FROM public.products 
    WHERE slug = course_data.slug
);

-- Step 3: Link products to business via business_products join table
INSERT INTO public.business_products (
    business_id,
    product_id,
    featured,
    created_at
)
SELECT 
    (SELECT id FROM temp_dive_business LIMIT 1),
    p.id,
    CASE 
        WHEN p.title IN ('Open Water Diver', 'Advanced Open Water Diver') THEN true
        ELSE false
    END,
    NOW()
FROM public.products p
WHERE p.business_id = (SELECT id FROM temp_dive_business LIMIT 1)
  AND NOT EXISTS (
    SELECT 1 FROM public.business_products bp
    WHERE bp.business_id = (SELECT id FROM temp_dive_business LIMIT 1)
      AND bp.product_id = p.id
  );

-- Clean up temporary table
DROP TABLE IF EXISTS temp_dive_business;

COMMIT;

-- ============================
-- Verification Queries
-- ============================
-- Run these to verify the data was inserted correctly:

-- Check products were created:
-- SELECT id, title, price, duration FROM public.products WHERE business_id IN (
--     SELECT id FROM public.businesses WHERE title ILIKE '%dive%'
-- ) ORDER BY price DESC;

-- Check business_products links:
-- SELECT bp.*, p.title, b.title as business_title
-- FROM public.business_products bp
-- JOIN public.products p ON bp.product_id = p.id
-- JOIN public.businesses b ON bp.business_id = b.id
-- WHERE b.title ILIKE '%dive%';

