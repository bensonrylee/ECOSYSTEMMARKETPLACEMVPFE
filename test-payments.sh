#!/bin/bash

# Payment System End-to-End Test Script
# Run this after starting:
# 1. supabase functions serve --env-file .env.local --no-verify-jwt
# 2. stripe listen --forward-to http://localhost:54321/functions/v1/stripe-webhook

echo "🚀 Payment System Verification Tests"
echo "===================================="
echo ""

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Base URL
BASE_URL="http://localhost:54321/functions/v1"

# Test A: CORS Options
echo "Test A: CORS Preflight Check"
echo "-----------------------------"
CORS_RESPONSE=$(curl -s -I -X OPTIONS $BASE_URL/checkout 2>/dev/null | grep -i "access-control-allow-origin")
if [[ $CORS_RESPONSE == *"*"* ]]; then
    echo -e "${GREEN}✅ CORS headers present${NC}"
    echo "   $CORS_RESPONSE"
else
    echo -e "${RED}❌ CORS headers missing${NC}"
fi
echo ""

# Test B: Connect Link Creation
echo "Test B: Stripe Connect Link"
echo "----------------------------"
CONNECT_RESPONSE=$(curl -s -X POST $BASE_URL/stripe-connect-link \
  -H "content-type: application/json" \
  -d '{"returnUrl":"http://localhost:5173/onboarding/provider"}')

if [[ $CONNECT_RESPONSE == *"url"* ]] && [[ $CONNECT_RESPONSE == *"accountId"* ]]; then
    echo -e "${GREEN}✅ Connect link created${NC}"
    echo "   Response: $CONNECT_RESPONSE" | head -c 100
    echo "..."
    
    # Extract account ID for later use
    ACCOUNT_ID=$(echo $CONNECT_RESPONSE | grep -o '"accountId":"[^"]*' | cut -d'"' -f4)
    echo "   Account ID: $ACCOUNT_ID"
else
    echo -e "${RED}❌ Connect link failed${NC}"
    echo "   Response: $CONNECT_RESPONSE"
fi
echo ""

# Test C: Checkout (requires a real booking ID)
echo "Test C: Checkout Session"
echo "------------------------"
echo "⚠️  Note: You need to create a test booking in Supabase first"
echo "   Run this SQL in Supabase:"
echo ""
echo "   INSERT INTO bookings (listing_id, customer_id, provider_id, amount_cents, status)"
echo "   VALUES ("
echo "     '00000000-0000-0000-0000-000000000001'::uuid,"
echo "     '00000000-0000-0000-0000-000000000002'::uuid,"
echo "     '00000000-0000-0000-0000-000000000003'::uuid,"
echo "     5000,"
echo "     'pending'"
echo "   ) RETURNING id;"
echo ""
echo "   Then replace BOOKING_ID and CONNECT_ID below:"
echo ""
echo "   curl -s -X POST $BASE_URL/checkout \\"
echo "     -H \"content-type: application/json\" \\"
echo "     -d '{\"amount_cents\":5000,\"currency\":\"cad\",\"provider_connect_id\":\"acct_XXX\",\"booking_id\":\"XXX\",\"success_url\":\"http://localhost:5173/success\",\"cancel_url\":\"http://localhost:5173/cancel\"}'"
echo ""

# Test D: Webhook endpoint exists
echo "Test D: Webhook Endpoint"
echo "------------------------"
WEBHOOK_RESPONSE=$(curl -s -o /dev/null -w "%{http_code}" -X POST $BASE_URL/stripe-webhook \
  -H "stripe-signature: test" \
  -d '{}')

if [[ $WEBHOOK_RESPONSE == "400" ]]; then
    echo -e "${GREEN}✅ Webhook endpoint responding (400 expected for invalid signature)${NC}"
else
    echo -e "${RED}❌ Webhook endpoint not responding properly${NC}"
    echo "   HTTP Status: $WEBHOOK_RESPONSE"
fi
echo ""

echo "===================================="
echo "📋 Manual Steps Required:"
echo ""
echo "1. Enable Stripe Connect:"
echo "   - Go to https://dashboard.stripe.com/test/settings/connect"
echo "   - Click 'Enable as platform'"
echo ""
echo "2. Update webhook secret:"
echo "   - Copy whsec_... from stripe listen output"
echo "   - Update STRIPE_WEBHOOK_SECRET in .env.local"
echo "   - Restart supabase functions serve"
echo ""
echo "3. Test full flow:"
echo "   - Complete provider onboarding with the Connect link URL"
echo "   - Create a test booking and checkout"
echo "   - Pay with test card: 4242 4242 4242 4242"
echo "   - Verify booking status changes to 'paid'"
echo ""