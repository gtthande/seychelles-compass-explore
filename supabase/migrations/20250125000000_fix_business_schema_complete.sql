-- Complete Business Schema Fix Migration
-- Adds all missing fields required by frontend
-- Ensures coordinate fields are properly synchronized

-- 1. Add missing coordinate fields (lat, lng, location_lat, location_lng, coords)
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS lat NUMERIC(10,8),
  ADD COLUMN IF NOT EXISTS lng NUMERIC(11,8),
  ADD COLUMN IF NOT EXISTS location_lat NUMERIC(10,8),
  ADD COLUMN IF NOT EXISTS location_lng NUMERIC(11,8),
  ADD COLUMN IF NOT EXISTS coords JSONB;

-- 2. Add missing slug fields
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS category_slug TEXT,
  ADD COLUMN IF NOT EXISTS island_slug TEXT;

-- 3. Ensure services column exists (may have been added in previous migration)
ALTER TABLE public.businesses 
  ADD COLUMN IF NOT EXISTS services TEXT[];

-- 4. Sync existing latitude/longitude to new fields
-- Priority: lat/lng > location_lat/location_lng > coords
UPDATE public.businesses 
SET 
  lat = COALESCE(lat, latitude),
  lng = COALESCE(lng, longitude),
  location_lat = COALESCE(location_lat, latitude),
  location_lng = COALESCE(location_lng, longitude),
  coords = CASE 
    WHEN coords IS NULL AND latitude IS NOT NULL AND longitude IS NOT NULL 
    THEN jsonb_build_object('lat', latitude::numeric, 'lng', longitude::numeric)
    ELSE coords
  END
WHERE latitude IS NOT NULL OR longitude IS NOT NULL;

-- 5. Sync from coords to lat/lng if lat/lng are null
UPDATE public.businesses 
SET 
  lat = (coords->>'lat')::numeric,
  lng = (coords->>'lng')::numeric,
  location_lat = (coords->>'lat')::numeric,
  location_lng = (coords->>'lng')::numeric
WHERE (lat IS NULL OR lng IS NULL) 
  AND coords IS NOT NULL 
  AND coords->>'lat' IS NOT NULL 
  AND coords->>'lng' IS NOT NULL;

-- 6. Generate category_slug from category if missing
UPDATE public.businesses 
SET category_slug = LOWER(REPLACE(category, ' ', '-'))
WHERE category_slug IS NULL AND category IS NOT NULL;

-- 7. Generate island_slug from island if missing
UPDATE public.businesses 
SET island_slug = LOWER(REPLACE(island, ' ', '-'))
WHERE island_slug IS NULL AND island IS NOT NULL;

-- 8. Create function to sync coordinates automatically
CREATE OR REPLACE FUNCTION sync_business_coordinates()
RETURNS TRIGGER AS $$
BEGIN
  -- Priority: lat/lng are the source of truth
  -- If lat/lng change, update location_lat/location_lng and coords
  IF NEW.lat IS DISTINCT FROM OLD.lat OR NEW.lng IS DISTINCT FROM OLD.lng THEN
    NEW.location_lat := NEW.lat;
    NEW.location_lng := NEW.lng;
    IF NEW.lat IS NOT NULL AND NEW.lng IS NOT NULL THEN
      NEW.coords := jsonb_build_object('lat', NEW.lat, 'lng', NEW.lng);
    END IF;
  -- If location_lat/location_lng change, sync to lat/lng
  ELSIF NEW.location_lat IS DISTINCT FROM OLD.location_lat OR NEW.location_lng IS DISTINCT FROM OLD.location_lng THEN
    NEW.lat := NEW.location_lat;
    NEW.lng := NEW.location_lng;
    IF NEW.location_lat IS NOT NULL AND NEW.location_lng IS NOT NULL THEN
      NEW.coords := jsonb_build_object('lat', NEW.location_lat, 'lng', NEW.location_lng);
    END IF;
  -- If coords change, sync to lat/lng and location_lat/location_lng
  ELSIF NEW.coords IS DISTINCT FROM OLD.coords THEN
    IF NEW.coords IS NOT NULL AND NEW.coords->>'lat' IS NOT NULL AND NEW.coords->>'lng' IS NOT NULL THEN
      NEW.lat := (NEW.coords->>'lat')::numeric;
      NEW.lng := (NEW.coords->>'lng')::numeric;
      NEW.location_lat := (NEW.coords->>'lat')::numeric;
      NEW.location_lng := (NEW.coords->>'lng')::numeric;
    END IF;
  -- Legacy: sync from latitude/longitude if lat/lng are null
  ELSIF (NEW.lat IS NULL OR NEW.lng IS NULL) AND NEW.latitude IS NOT NULL AND NEW.longitude IS NOT NULL THEN
    NEW.lat := NEW.latitude;
    NEW.lng := NEW.longitude;
    NEW.location_lat := NEW.latitude;
    NEW.location_lng := NEW.longitude;
    NEW.coords := jsonb_build_object('lat', NEW.latitude, 'lng', NEW.longitude);
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 9. Create trigger to auto-sync coordinates
DROP TRIGGER IF EXISTS sync_business_coordinates_trigger ON public.businesses;
CREATE TRIGGER sync_business_coordinates_trigger
  BEFORE INSERT OR UPDATE ON public.businesses
  FOR EACH ROW
  EXECUTE FUNCTION sync_business_coordinates();

-- 10. Create indexes for new fields
CREATE INDEX IF NOT EXISTS idx_businesses_lat_lng ON public.businesses(lat, lng);
CREATE INDEX IF NOT EXISTS idx_businesses_category_slug ON public.businesses(category_slug);
CREATE INDEX IF NOT EXISTS idx_businesses_island_slug ON public.businesses(island_slug);

-- 11. Add comments for documentation
COMMENT ON COLUMN public.businesses.lat IS 'Primary latitude coordinate (source of truth)';
COMMENT ON COLUMN public.businesses.lng IS 'Primary longitude coordinate (source of truth)';
COMMENT ON COLUMN public.businesses.location_lat IS 'Mirror of lat for compatibility';
COMMENT ON COLUMN public.businesses.location_lng IS 'Mirror of lng for compatibility';
COMMENT ON COLUMN public.businesses.coords IS 'JSONB object with lat/lng: {"lat": number, "lng": number}';
COMMENT ON COLUMN public.businesses.category_slug IS 'URL-friendly category identifier';
COMMENT ON COLUMN public.businesses.island_slug IS 'URL-friendly island identifier';

