-- 1.1 Stronger schema guarantees
alter table listings
  alter column title set not null,
  alter column price_cents set not null,
  alter column kind set not null,
  alter column pricing_unit set not null;

alter table listings
  add column if not exists currency text not null default 'cad'
  check (currency in ('cad','usd'));

alter table bookings
  alter column amount_cents set not null,
  add column if not exists currency text not null default 'cad'
  check (currency in ('cad','usd')),
  alter column status set default 'pending',
  add constraint chk_booking_amount_pos check (amount_cents > 0);

-- Keep existing unique index on (listing_id, start_at) for bookings with pending/paid.
create index if not exists idx_slots_listing_start on listing_slots(listing_id, start_at);
create index if not exists idx_bookings_provider_status on bookings(provider_id, status);
create index if not exists idx_listings_active_kind on listings(is_active, kind);

-- 1.2 Minimal Row Level Security (service role bypasses these, webhooks still work)
alter table profiles enable row level security;
alter table providers enable row level security;
alter table listings enable row level security;
alter table listing_slots enable row level security;
alter table bookings enable row level security;

create policy p_profiles_self_select on profiles for select using (auth.uid() = id);
create policy p_profiles_self_upsert on profiles for insert with check (auth.uid() = id);
create policy p_profiles_self_update on profiles for update using (auth.uid() = id);

create policy p_providers_self_select on providers for select using (auth.uid() = id);
create policy p_providers_self_upsert on providers for insert with check (auth.uid() = id);
create policy p_providers_self_update on providers for update using (auth.uid() = id);

create policy p_listings_select_all on listings for select using (true);
create policy p_listings_insert_owner on listings for insert with check (auth.uid() = provider_id);
create policy p_listings_update_owner on listings for update using (auth.uid() = provider_id);

create policy p_slots_select_all on listing_slots for select using (true);
create policy p_slots_write_owner on listing_slots
  for insert with check (
    exists (select 1 from listings l where l.id = listing_id and l.provider_id = auth.uid())
  );

create policy p_bookings_customer_select on bookings
  for select using (auth.uid() = customer_id or auth.uid() = provider_id);
create policy p_bookings_insert_customer on bookings
  for insert with check (auth.uid() = customer_id);

-- 1.3 Stripe event audit & idempotency
create table if not exists stripe_events(
  id text primary key,           -- evt_...
  type text not null,
  created_at timestamptz default now(),
  payload jsonb not null
);