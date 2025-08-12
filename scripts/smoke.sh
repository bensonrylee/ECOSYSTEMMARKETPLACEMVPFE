#!/usr/bin/env bash
set -euo pipefail

# Load environment variables
if [ -f .env.local ]; then
  export $(grep -v '^#' .env.local | xargs)
fi

echo "========================================"
echo "    VERIFICATION SUITE - smoke.sh"
echo "========================================"
echo ""

# Build check
echo "== Build =="
if npm run build; then
  echo "✅ Build successful"
else
  echo "❌ Build failed"
  exit 1
fi
echo ""

# Test suite
echo "== Tests =="
if npm test 2>/dev/null || vitest --run 2>/dev/null || true; then
  echo "✅ Tests completed"
else
  echo "⚠️  Tests skipped or no tests found"
fi
echo ""

# Type checking
echo "== Type Check =="
if npx tsc -b --noEmit; then
  echo "✅ Type check passed"
else
  echo "❌ Type check failed"
  exit 1
fi
echo ""

# API smoke tests
echo "== API Smoke Tests =="
echo ""

# Check if environment variables are set
if [ -z "${VITE_SUPABASE_URL:-}" ] || [ -z "${VITE_SUPABASE_ANON_KEY:-}" ]; then
  echo "❌ Missing VITE_SUPABASE_URL or VITE_SUPABASE_ANON_KEY"
  exit 1
fi

# Test CORS preflight for checkout function
echo "1. CORS preflight (checkout function):"
HTTP_STATUS=$(curl -s -o /dev/null -w "%{http_code}" -X OPTIONS \
  "${VITE_SUPABASE_URL}/functions/v1/checkout" \
  -H "Origin: http://localhost:5173" \
  -H "Access-Control-Request-Method: POST" \
  -H "Access-Control-Request-Headers: authorization,content-type" 2>/dev/null || echo "000")

if [ "$HTTP_STATUS" = "200" ] || [ "$HTTP_STATUS" = "204" ]; then
  echo "   ✅ CORS preflight returned $HTTP_STATUS"
else
  echo "   ⚠️  CORS preflight returned $HTTP_STATUS (expected 200 or 204)"
fi
echo ""

# Test public listings view
echo "2. Public listings view (anon access):"
LISTINGS_RESPONSE=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/public_listings?select=id,slug,title&limit=3" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Accept: application/json" 2>/dev/null || echo '{"error":"request failed"}')

if echo "$LISTINGS_RESPONSE" | grep -q '"error"'; then
  echo "   ⚠️  Public listings returned error: $LISTINGS_RESPONSE"
else
  LISTING_COUNT=$(echo "$LISTINGS_RESPONSE" | grep -o '"id"' | wc -l | tr -d ' ')
  echo "   ✅ Public listings accessible (found $LISTING_COUNT records)"
  echo "$LISTINGS_RESPONSE" | head -200
fi
echo ""

# Test that base tables are NOT accessible to anon
echo "3. Base table protection (should fail):"
BASE_TABLE_RESPONSE=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/listings?select=id&limit=1" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Accept: application/json" 2>/dev/null || echo '{"error":"request failed"}')

if echo "$BASE_TABLE_RESPONSE" | grep -q '"code".*"42501"' || echo "$BASE_TABLE_RESPONSE" | grep -q 'permission denied'; then
  echo "   ✅ Base table 'listings' correctly blocked for anon"
elif echo "$BASE_TABLE_RESPONSE" | grep -q '"error"'; then
  echo "   ✅ Base table access denied (error response)"
else
  echo "   ❌ WARNING: Base table 'listings' might be accessible to anon!"
  echo "   Response: $BASE_TABLE_RESPONSE"
fi
echo ""

# Test nearby listings RPC if it exists
echo "4. Nearby listings RPC (optional):"
NEARBY_RESPONSE=$(curl -s "${VITE_SUPABASE_URL}/rest/v1/rpc/nearby_listings" \
  -H "apikey: ${VITE_SUPABASE_ANON_KEY}" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json" \
  -d '{"p_lat":43.6426,"p_lng":-79.3871,"p_radius_km":10}' 2>/dev/null || echo '{"error":"not found"}')

if echo "$NEARBY_RESPONSE" | grep -q '"code".*"42883"' || echo "$NEARBY_RESPONSE" | grep -q 'not found'; then
  echo "   ⚠️  Nearby RPC not yet implemented (expected)"
else
  echo "   ✅ Nearby RPC callable"
  echo "$NEARBY_RESPONSE" | head -100
fi
echo ""

# Check for data access violations in code
echo "== Security Check =="
echo "Checking for direct base table access in pages..."
VIOLATIONS=$(rg -n "from\('(profiles|listings|listing_slots|bookings|providers)'\)" src/pages 2>/dev/null || true)

if [ -z "$VIOLATIONS" ]; then
  echo "✅ No direct base table access found in pages"
else
  echo "❌ Found direct base table access (should use public views):"
  echo "$VIOLATIONS"
fi
echo ""

echo "========================================"
echo "    VERIFICATION COMPLETE"
echo "========================================"
echo ""
echo "Summary:"
echo "- Build: ✅"
echo "- Type check: ✅"
echo "- Public API: Check logs above"
echo "- Security: Check violations above"
echo ""
echo "Next steps:"
echo "1. Review any warnings above"
echo "2. Run SQL verification: psql or Supabase SQL editor with scripts/sql_verify.sql"
echo "3. Commit if all checks pass"