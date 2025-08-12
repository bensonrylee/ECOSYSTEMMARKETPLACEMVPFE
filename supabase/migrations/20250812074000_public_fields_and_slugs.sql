-- Add profile public fields and slugs
alter table profiles add column if not exists slug text unique;
alter table profiles add column if not exists headline text;
alter table profiles add column if not exists city text;
alter table profiles add column if not exists region text;
alter table profiles add column if not exists country text default 'Canada';
alter table profiles add column if not exists avatar_url text;
alter table profiles add column if not exists banner_url text;

-- Add listing public fields and slugs
alter table listings add column if not exists slug text unique;
alter table listings add column if not exists primary_photo_url text;
alter table listings add column if not exists address_city text;
alter table listings add column if not exists address_region text;
alter table listings add column if not exists address_country text default 'Canada';
alter table listings add column if not exists timezone text default 'America/Toronto';

-- Add provider capability fields (for Stripe account status)
alter table providers add column if not exists payouts_enabled boolean default false;
alter table providers add column if not exists details_submitted boolean default false;

-- Indexes for efficient browsing and filtering
create index if not exists idx_listings_browse on listings(is_active, kind, address_city, price_cents);
create index if not exists idx_listings_slug on listings(slug) where slug is not null;
create index if not exists idx_profiles_slug on profiles(slug) where slug is not null;

-- RLS policies for public read access
-- Allow anonymous users to read public profile fields
create policy "Public can view basic profile info" on profiles
  for select
  using (true);

-- Allow anonymous users to view active listings
create policy "Public can view active listings" on listings
  for select
  using (is_active = true);

-- Allow anonymous users to view available slots for active listings
create policy "Public can view slots for active listings" on listing_slots
  for select
  using (
    exists (
      select 1 from listings 
      where listings.id = listing_slots.listing_id 
      and listings.is_active = true
    )
  );

-- Function to generate slug from text
create or replace function generate_slug(input_text text)
returns text as $$
begin
  return lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special characters
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Replace multiple hyphens with single hyphen
    )
  );
end;
$$ language plpgsql immutable;

-- Trigger to auto-generate profile slug from display_name
create or replace function generate_profile_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Only generate if slug is null and display_name exists
  if new.slug is null and new.display_name is not null then
    base_slug := generate_slug(new.display_name);
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    while exists(select 1 from profiles where slug = final_slug and id != new.id) loop
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    
    new.slug := final_slug;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Trigger to auto-generate listing slug from title
create or replace function generate_listing_slug()
returns trigger as $$
declare
  base_slug text;
  final_slug text;
  counter int := 0;
begin
  -- Only generate if slug is null and title exists
  if new.slug is null and new.title is not null then
    base_slug := generate_slug(new.title);
    final_slug := base_slug;
    
    -- Check for uniqueness and append number if needed
    while exists(select 1 from listings where slug = final_slug and id != new.id) loop
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    end loop;
    
    new.slug := final_slug;
  end if;
  
  return new;
end;
$$ language plpgsql;

-- Create triggers
drop trigger if exists auto_generate_profile_slug on profiles;
create trigger auto_generate_profile_slug
  before insert or update on profiles
  for each row
  execute function generate_profile_slug();

drop trigger if exists auto_generate_listing_slug on listings;
create trigger auto_generate_listing_slug
  before insert or update on listings
  for each row
  execute function generate_listing_slug();

-- Generate slugs for existing records
update profiles set slug = null where slug is null;
update listings set slug = null where slug is null;

-- Comments for documentation
comment on column profiles.slug is 'URL-friendly unique identifier for public profile pages';
comment on column profiles.headline is 'Short professional headline or tagline';
comment on column listings.slug is 'URL-friendly unique identifier for public listing pages';
comment on column listings.timezone is 'IANA timezone for proper slot display (e.g., America/Toronto)';
comment on column providers.payouts_enabled is 'Whether Stripe account can receive payouts';
comment on column providers.details_submitted is 'Whether all required Stripe account details are submitted';