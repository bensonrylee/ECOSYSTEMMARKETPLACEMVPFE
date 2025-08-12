-- SQL Verification Script
-- Run this in Supabase SQL Editor after migration

-- ========================================
-- 1. Check if views exist
-- ========================================
SELECT 
  'public_profiles' as view_name,
  CASE 
    WHEN to_regclass('public.public_profiles') IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'public_listings' as view_name,
  CASE 
    WHEN to_regclass('public.public_listings') IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status
UNION ALL
SELECT 
  'public_listing_slots' as view_name,
  CASE 
    WHEN to_regclass('public.public_listing_slots') IS NOT NULL 
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- ========================================
-- 2. Check PostGIS extension
-- ========================================
SELECT 
  'PostGIS Extension' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'postgis')
    THEN '✅ INSTALLED' 
    ELSE '❌ NOT INSTALLED' 
  END as status;

-- ========================================
-- 3. Check spatial index
-- ========================================
SELECT 
  'Spatial Index (listings_location_gix)' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM pg_indexes 
      WHERE schemaname='public' 
      AND tablename='listings' 
      AND indexname='listings_location_gix'
    )
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- ========================================
-- 4. Check location column
-- ========================================
SELECT 
  'Location Column' as component,
  CASE 
    WHEN EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' 
      AND table_name = 'listings' 
      AND column_name = 'location'
    )
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- ========================================
-- 5. Verify view data counts
-- ========================================
SELECT 
  'public_profiles' as view_name,
  COUNT(*) as record_count
FROM public.public_profiles
UNION ALL
SELECT 
  'public_listings' as view_name,
  COUNT(*) as record_count
FROM public.public_listings
UNION ALL
SELECT 
  'public_listing_slots' as view_name,
  COUNT(*) as record_count
FROM public.public_listing_slots;

-- ========================================
-- 6. Check that slots are future-only
-- ========================================
SELECT 
  'Future Slots Check' as test,
  CASE 
    WHEN COUNT(*) = 0 
    THEN '✅ PASS: No past slots in view' 
    ELSE '❌ FAIL: Found ' || COUNT(*) || ' past slots' 
  END as result
FROM public.public_listing_slots
WHERE start_at <= NOW();

-- ========================================
-- 7. Check storage bucket
-- ========================================
SELECT 
  'Storage Bucket (public)' as component,
  CASE 
    WHEN EXISTS (SELECT 1 FROM storage.buckets WHERE id = 'public')
    THEN '✅ EXISTS' 
    ELSE '❌ MISSING' 
  END as status;

-- ========================================
-- 8. Check RLS policies on storage
-- ========================================
SELECT 
  policyname,
  CASE cmd
    WHEN 'SELECT' THEN 'READ'
    WHEN 'INSERT' THEN 'WRITE'
    WHEN 'UPDATE' THEN 'UPDATE'
    WHEN 'DELETE' THEN 'DELETE'
    ELSE cmd::text
  END as operation,
  CASE roles::text
    WHEN '{anon}' THEN 'anon'
    WHEN '{authenticated}' THEN 'authenticated'
    ELSE roles::text
  END as role
FROM pg_policies 
WHERE schemaname='storage' 
AND tablename='objects'
AND policyname IN (
  'Public read public bucket',
  'Users write to their folder',
  'Users update/delete their files'
)
ORDER BY policyname;

-- ========================================
-- 9. Test anon permissions (should fail)
-- ========================================
-- This query tests if anon can see base tables
-- Run this with the anon role to verify it fails
-- SET ROLE anon;
-- SELECT COUNT(*) FROM public.profiles; -- Should error
-- RESET ROLE;

-- ========================================
-- 10. Sample nearby query (if location data exists)
-- ========================================
SELECT 
  'Sample Nearby Query' as test_name,
  COUNT(*) as listings_within_10km
FROM public.public_listings l
JOIN public.listings l_base ON l.id = l_base.id
WHERE l_base.location IS NOT NULL
AND extensions.ST_DWithin(
  l_base.location::extensions.geography,
  extensions.ST_SetSRID(extensions.ST_MakePoint(-79.3871, 43.6426), 4326)::extensions.geography,
  10000  -- 10km in meters
);

-- ========================================
-- Summary Report
-- ========================================
SELECT 
  '===================' as line
UNION ALL
SELECT 'VERIFICATION SUMMARY'
UNION ALL
SELECT '==================='
UNION ALL
SELECT '✅ = Working | ❌ = Needs attention | ⚠️ = Warning'
UNION ALL
SELECT 'Run each section above to see detailed results'
UNION ALL
SELECT 'All components should show ✅ for production readiness';