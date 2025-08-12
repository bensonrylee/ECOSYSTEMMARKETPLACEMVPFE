-- Create a scheduled function to refresh provider capabilities daily
-- This ensures we have accurate Stripe account status

-- Function to refresh all provider capabilities
create or replace function public.refresh_all_provider_capabilities()
returns void
language plpgsql
security definer
as $$
declare
  provider_record record;
begin
  -- Loop through all providers with Stripe accounts
  for provider_record in 
    select id, stripe_connect_id 
    from public.providers 
    where stripe_connect_id is not null
  loop
    -- Log the refresh attempt
    raise notice 'Refreshing capabilities for provider % with account %', 
      provider_record.id, provider_record.stripe_connect_id;
    
    -- Note: The actual API call happens via Edge Function
    -- This just marks providers that need refresh
    update public.providers
    set updated_at = now()
    where id = provider_record.id;
  end loop;
end;
$$;

-- Create a table to track refresh jobs (for observability)
create table if not exists public.capability_refresh_logs (
  id uuid primary key default gen_random_uuid(),
  provider_id uuid references public.providers(id) on delete cascade,
  stripe_account_id text,
  charges_enabled_before boolean,
  charges_enabled_after boolean,
  payouts_enabled_before boolean,
  payouts_enabled_after boolean,
  error text,
  created_at timestamptz default now()
);

-- Index for quick lookups
create index if not exists idx_capability_refresh_logs_provider 
  on public.capability_refresh_logs(provider_id, created_at desc);

-- Grant service role access
grant all on public.capability_refresh_logs to service_role;

-- Comment for documentation
comment on table public.capability_refresh_logs is 'Audit log of provider capability refreshes from Stripe';
comment on function public.refresh_all_provider_capabilities is 'Marks providers for capability refresh (actual API call via Edge Function)';

-- Note: To set up the actual cron job in Supabase:
-- 1. Go to Database > Extensions and enable pg_cron
-- 2. Go to SQL Editor and run:
-- select cron.schedule(
--   'refresh-provider-capabilities',
--   '0 2 * * *', -- Daily at 2 AM
--   $$select public.refresh_all_provider_capabilities();$$
-- );