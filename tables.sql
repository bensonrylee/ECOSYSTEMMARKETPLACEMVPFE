create table if not exists profiles(
  id uuid primary key references auth.users on delete cascade,
  role text check (role in ('customer','provider')) not null,
  display_name text,
  created_at timestamptz default now()
);

create table if not exists providers(
  id uuid primary key references profiles(id) on delete cascade,
  stripe_connect_id text,
  charges_enabled boolean default false
);

create table if not exists listings(
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references providers(id),
  title text not null,
  description text,
  kind text check (kind in ('service','event','space')) not null,
  price_cents int not null,
  pricing_unit text check (pricing_unit in ('hour','fixed')) not null,
  lat double precision, lng double precision,
  is_active boolean default true,
  created_at timestamptz default now()
);

create table if not exists listing_slots(
  listing_id uuid references listings(id) on delete cascade,
  start_at timestamptz,
  end_at timestamptz,
  primary key (listing_id, start_at)
);

create table if not exists bookings(
  id uuid primary key default gen_random_uuid(),
  listing_id uuid references listings(id),
  customer_id uuid references profiles(id),
  provider_id uuid references providers(id),
  start_at timestamptz,
  end_at timestamptz,
  amount_cents int not null,
  status text check (status in ('pending','paid','canceled')) default 'pending',
  stripe_payment_intent_id text,
  created_at timestamptz default now()
);

create unique index if not exists uniq_booking_slot
on bookings(listing_id, start_at) where status in ('pending','paid');