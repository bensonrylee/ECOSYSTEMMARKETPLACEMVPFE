-- CRITICAL SECURITY FIX: Remove direct anon access to base tables
-- and expose only safe columns through views

-- First, drop the overly permissive policies we created earlier
drop policy if exists "Public can view basic profile info" on profiles;
drop policy if exists "Public can view active listings" on listings;
drop policy if exists "Public can view slots for active listings" on listing_slots;

-- Revoke anon select on base tables (if it was granted)
revoke select on table public.profiles from anon;
revoke select on table public.listings from anon;
revoke select on table public.listing_slots from anon;
revoke select on table public.bookings from anon;
revoke select on table public.providers from anon;

-- Create secure views with only public-safe columns
create or replace view public.public_profiles as
select 
  id, 
  slug, 
  display_name, 
  headline, 
  city, 
  region, 
  country, 
  avatar_url, 
  banner_url, 
  created_at
from public.profiles;

comment on view public.public_profiles is 'Public-safe profile data for browsing and SEO';

create or replace view public.public_listings as
select 
  id, 
  slug, 
  provider_id, 
  title, 
  description, 
  kind, 
  price_cents, 
  currency, 
  pricing_unit,
  address_city, 
  address_region, 
  address_country, 
  primary_photo_url, 
  timezone, 
  is_active, 
  created_at
from public.listings
where is_active = true;

comment on view public.public_listings is 'Public-safe listing data, only shows active listings';

create or replace view public.public_listing_slots as
select 
  ls.listing_id, 
  ls.start_at, 
  ls.end_at
from public.listing_slots ls
join public.listings l on l.id = ls.listing_id
where l.is_active = true
  and ls.start_at > now(); -- Only future slots

comment on view public.public_listing_slots is 'Available future slots for active listings only';

-- Grant anon SELECT only on the safe views
grant select on public.public_profiles to anon;
grant select on public.public_listings to anon;
grant select on public.public_listing_slots to anon;

-- Add currency column to bookings with proper default
alter table public.bookings
  add column if not exists currency text not null default 'cad'
  check (currency in ('cad', 'usd', 'eur', 'gbp'));

comment on column public.bookings.currency is 'Currency for this booking, inherited from listing';

-- Function to set booking currency from listing
create or replace function public.set_booking_currency_from_listing()
returns trigger language plpgsql as $$
begin
  -- Only set if currency is null (shouldn't happen with default, but safe)
  if NEW.currency is null then
    select coalesce(l.currency, 'cad') into NEW.currency
    from public.listings l 
    where l.id = NEW.listing_id;
  end if;
  return NEW;
end;
$$;

-- Trigger to auto-set currency
drop trigger if exists trg_set_booking_currency on public.bookings;
create trigger trg_set_booking_currency
  before insert on public.bookings
  for each row 
  execute function public.set_booking_currency_from_listing();

-- Backfill existing bookings (if any)
update public.bookings b
set currency = coalesce(
  (select l.currency from public.listings l where l.id = b.listing_id),
  'cad'
)
where currency is null or currency = '';

-- Better slug generation functions
create or replace function public.slugify(input_text text) 
returns text 
language sql 
immutable 
as $$
  select lower(
    regexp_replace(
      regexp_replace(
        regexp_replace(
          trim(input_text),
          '[^a-zA-Z0-9\s-]', '', 'g'  -- Remove special chars
        ),
        '\s+', '-', 'g'  -- Replace spaces with hyphens
      ),
      '-+', '-', 'g'  -- Collapse multiple hyphens
    )
  )
$$;

create or replace function public.ensure_unique_slug(
  base_text text, 
  table_name text, 
  record_id uuid
)
returns text 
language plpgsql 
as $$
declare 
  base_slug text := slugify(base_text);
  final_slug text;
  suffix int := 0;
  candidate text;
begin
  -- Handle empty base case
  if base_slug is null or base_slug = '' then
    base_slug := 'item';
  end if;
  
  loop
    candidate := case 
      when suffix = 0 then base_slug 
      else base_slug || '-' || suffix 
    end;
    
    if table_name = 'profiles' then
      exit when not exists (
        select 1 from profiles 
        where slug = candidate 
        and (record_id is null or id != record_id)
      );
    elsif table_name = 'listings' then
      exit when not exists (
        select 1 from listings 
        where slug = candidate 
        and (record_id is null or id != record_id)
      );
    else
      raise exception 'Unknown table name: %', table_name;
    end if;
    
    suffix := suffix + 1;
    
    -- Safety valve to prevent infinite loops
    if suffix > 1000 then
      raise exception 'Could not generate unique slug after 1000 attempts';
    end if;
  end loop;
  
  return candidate;
end;
$$;

-- Improved profile slug trigger
create or replace function public.set_profile_slug() 
returns trigger 
language plpgsql 
as $$
begin
  -- Generate slug if empty or if display_name changed
  if (new.slug is null or new.slug = '') then
    new.slug := public.ensure_unique_slug(
      coalesce(new.display_name, 'user-' || left(new.id::text, 8)),
      'profiles',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_profile_slug on public.profiles;
create trigger trg_set_profile_slug 
  before insert or update of display_name, slug
  on public.profiles 
  for each row 
  execute function public.set_profile_slug();

-- Improved listing slug trigger
create or replace function public.set_listing_slug() 
returns trigger 
language plpgsql 
as $$
begin
  -- Generate slug if empty or if title changed
  if (new.slug is null or new.slug = '') then
    new.slug := public.ensure_unique_slug(
      coalesce(new.title, 'listing-' || left(new.id::text, 8)),
      'listings',
      new.id
    );
  end if;
  return new;
end;
$$;

drop trigger if exists trg_set_listing_slug on public.listings;
create trigger trg_set_listing_slug 
  before insert or update of title, slug
  on public.listings 
  for each row 
  execute function public.set_listing_slug();

-- Re-generate slugs for any records missing them
update profiles set slug = null where slug is null or slug = '';
update listings set slug = null where slug is null or slug = '';