-- Create test booking for production testing
INSERT INTO bookings (
  id,
  listing_id, 
  customer_id, 
  provider_id, 
  amount_cents, 
  status, 
  start_at, 
  end_at
) VALUES (
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  '11111111-1111-1111-1111-111111111111'::uuid,
  5000,
  'pending',
  now() + interval '1 hour',
  now() + interval '2 hours'
) ON CONFLICT (id) DO UPDATE SET status = 'pending';

SELECT id, status, amount_cents FROM bookings WHERE id = '11111111-1111-1111-1111-111111111111';
EOF < /dev/null