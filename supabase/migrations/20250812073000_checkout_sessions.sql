-- Create checkout_sessions table for persistent session tracking
create table if not exists checkout_sessions (
  booking_id uuid primary key references bookings(id) on delete cascade,
  session_id text not null,
  created_at timestamptz default now()
);

-- Index for quick lookups
create index if not exists idx_checkout_sessions_created_at on checkout_sessions(created_at);

-- RLS policies
alter table checkout_sessions enable row level security;

-- Service role can manage all sessions (for Edge Functions)
create policy "Service role manages checkout sessions" on checkout_sessions
  for all using (auth.role() = 'service_role');

-- Add cleanup for old sessions (optional, for housekeeping)
comment on table checkout_sessions is 'Tracks Stripe Checkout sessions to prevent duplicates and enable idempotent checkout creation';