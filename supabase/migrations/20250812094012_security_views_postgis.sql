-- BEGIN MIGRATION: Security Views and PostGIS Setup
-- This migration is fully idempotent - safe to run multiple times

-- ========================================
-- 1) Ensure PostGIS is available
-- ========================================
CREATE EXTENSION IF NOT EXISTS postgis WITH SCHEMA extensions;

-- ========================================
-- 2) Add geography column to listings
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'listings' AND column_name = 'location'
  ) THEN
    ALTER TABLE public.listings
      ADD COLUMN location geography(Point,4326);
  END IF;
END$$;

-- Backfill location from lat/lng where present
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='listings' AND column_name='lat'
  ) AND EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema='public' AND table_name='listings' AND column_name='lng'
  ) THEN
    UPDATE public.listings
    SET location = extensions.ST_SetSRID(extensions.ST_MakePoint(lng, lat), 4326)::extensions.geography
    WHERE location IS NULL AND lat IS NOT NULL AND lng IS NOT NULL;
  END IF;
END$$;

-- Create spatial index for efficient geographic queries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_class c
    JOIN pg_namespace n ON n.oid=c.relnamespace
    WHERE c.relname='listings_location_gix' AND n.nspname='public'
  ) THEN
    CREATE INDEX listings_location_gix ON public.listings USING GIST (location);
  END IF;
END$$;

-- ========================================
-- 3) Defense in depth: Revoke anon SELECT on base tables
-- ========================================
-- Safe to run even if no prior grants exist
REVOKE SELECT ON TABLE public.profiles       FROM anon;
REVOKE SELECT ON TABLE public.providers      FROM anon;
REVOKE SELECT ON TABLE public.listings       FROM anon;
REVOKE SELECT ON TABLE public.listing_slots  FROM anon;
REVOKE SELECT ON TABLE public.bookings       FROM anon;

-- ========================================
-- 4) Create/Replace public READ-ONLY views
-- ========================================

-- Public profiles view - no emails or sensitive data
CREATE OR REPLACE VIEW public.public_profiles AS
SELECT
  p.id,
  COALESCE(p.slug, p.id::text) AS slug,
  p.display_name,
  p.headline,
  p.city,
  p.region,
  p.country,
  p.avatar_url,
  p.banner_url,
  p.created_at
FROM public.profiles p;

COMMENT ON VIEW public.public_profiles IS 'Public-safe profile data for anonymous access';

-- Public listings view - only active listings with safe fields
-- Note: Using address_city, address_region, address_country from your schema
CREATE OR REPLACE VIEW public.public_listings AS
SELECT
  l.id,
  COALESCE(l.slug, l.id::text) AS slug,
  l.title,
  l.description,
  l.kind,
  l.pricing_unit,
  l.price_cents,
  l.currency,
  l.address_city AS city,
  l.address_region AS region,
  l.address_country AS country,
  l.lat,
  l.lng,
  (l.location IS NOT NULL) AS has_location,
  l.primary_photo_url,
  l.timezone,
  l.created_at,
  pr.slug AS provider_slug,
  pr.display_name AS provider_name,
  pr.avatar_url AS provider_avatar
FROM public.listings l
LEFT JOIN public.profiles pr ON pr.id = l.provider_id
WHERE COALESCE(l.is_active, true) = true;

COMMENT ON VIEW public.public_listings IS 'Public-safe listing data, only shows active listings';

-- Public listing slots view - only future slots for active listings
CREATE OR REPLACE VIEW public.public_listing_slots AS
SELECT
  s.listing_id,
  s.start_at,
  s.end_at
FROM public.listing_slots s
JOIN public.listings l ON l.id = s.listing_id
WHERE COALESCE(l.is_active, true) = true
  AND s.start_at > NOW();

COMMENT ON VIEW public.public_listing_slots IS 'Available future slots for active listings only';

-- ========================================
-- 5) Grant anon SELECT on public views only
-- ========================================
GRANT USAGE ON SCHEMA public TO anon;
GRANT SELECT ON public.public_profiles       TO anon;
GRANT SELECT ON public.public_listings       TO anon;
GRANT SELECT ON public.public_listing_slots  TO anon;

-- ========================================
-- 6) Ensure Storage bucket 'public' exists
-- ========================================
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public') THEN
    INSERT INTO storage.buckets (id, name, public)
    VALUES ('public', 'public', true);
  END IF;
END$$;

-- ========================================
-- 7) Storage RLS policies for public bucket
-- ========================================

-- Policy: Anyone can read files in public bucket
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
    AND tablename='objects' 
    AND policyname='Public read public bucket'
  ) THEN
    CREATE POLICY "Public read public bucket"
    ON storage.objects
    FOR SELECT
    TO anon
    USING (bucket_id = 'public');
  END IF;
END$$;

-- Policy: Authenticated users can write to their own folder
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
    AND tablename='objects' 
    AND policyname='Users write to their folder'
  ) THEN
    CREATE POLICY "Users write to their folder"
    ON storage.objects
    FOR INSERT
    TO authenticated
    WITH CHECK (
      bucket_id = 'public'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END$$;

-- Policy: Users can update/delete their own files
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname='storage' 
    AND tablename='objects' 
    AND policyname='Users update/delete their files'
  ) THEN
    CREATE POLICY "Users update/delete their files"
    ON storage.objects
    FOR ALL
    TO authenticated
    USING (
      bucket_id = 'public'
      AND (storage.foldername(name))[1] = auth.uid()::text
    );
  END IF;
END$$;

-- ========================================
-- 8) Optional: Create nearby listings RPC
-- ========================================
CREATE OR REPLACE FUNCTION public.nearby_listings(
  p_lat double precision,
  p_lng double precision,
  p_radius_km integer DEFAULT 10
)
RETURNS TABLE (
  id uuid,
  slug text,
  title text,
  distance_km numeric,
  city text,
  provider_name text
)
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT 
    l.id,
    l.slug,
    l.title,
    ROUND((extensions.ST_Distance(
      l_base.location,
      extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography
    ) / 1000)::numeric, 2) AS distance_km,
    l.city,
    l.provider_name
  FROM public.public_listings l
  JOIN public.listings l_base ON l.id = l_base.id
  WHERE l_base.location IS NOT NULL
  AND extensions.ST_DWithin(
    l_base.location,
    extensions.ST_SetSRID(extensions.ST_MakePoint(p_lng, p_lat), 4326)::extensions.geography,
    p_radius_km * 1000  -- Convert km to meters
  )
  ORDER BY distance_km
  LIMIT 100;
$$;

GRANT EXECUTE ON FUNCTION public.nearby_listings TO anon;
GRANT EXECUTE ON FUNCTION public.nearby_listings TO authenticated;

COMMENT ON FUNCTION public.nearby_listings IS 'Find listings within a radius of a geographic point';

-- ========================================
-- END MIGRATION
-- ========================================

-- Verification: Run scripts/sql_verify.sql after this migration