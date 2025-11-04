-- Add image_url column to reviews table for optional image uploads
ALTER TABLE public.reviews 
ADD COLUMN IF NOT EXISTS image_url TEXT;

-- Add comment to the column
COMMENT ON COLUMN public.reviews.image_url IS 'Optional image URL for review photos uploaded to review-images bucket';

