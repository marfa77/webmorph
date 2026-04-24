-- =============================================================================
-- ogkit: применение схемы вручную (когда нет `supabase login` / db push)
-- 1) Supabase Dashboard → SQL Editor → New query
-- 2) Вставьте весь этот файл → Run
-- Если init уже накатан, не прогоняйте этот файл повторно.
-- Для точечных изменений запускайте отдельные migration SQL, например:
--   supabase/migrations/20250424130000_subscription_waitlist.sql
--   supabase/migrations/20260424130000_crypto_billing.sql
-- или готовый single-file вариант:
--   supabase/apply_crypto_billing_only.sql
-- =============================================================================

-- ogkit initial schema
-- depends on auth.users (provided by Supabase)

create type public.plan_tier as enum ('free', 'pro', 'scale');
create type public.subscription_status as enum (
  'trialing',
  'active',
  'past_due',
  'canceled',
  'incomplete'
);

-- 1. users (extends auth.users)
create table public.users (
  id uuid primary key references auth.users (id) on delete cascade,
  email text not null unique,
  plan public.plan_tier not null default 'free',
  lemon_customer_id text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_users_lemon_customer_id on public.users (lemon_customer_id);

-- 2. api_keys
create table public.api_keys (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  name text not null default 'default',
  prefix text not null, -- first part for fast lookup
  hash text not null, -- hash of full key
  last_used_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now()
);

create unique index idx_api_keys_prefix_active on public.api_keys (prefix)
where
  revoked_at is null;

create index idx_api_keys_user_id on public.api_keys (user_id);

-- 3. usage_events
create table public.usage_events (
  id bigserial primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  api_key_id uuid references public.api_keys (id) on delete set null,
  template text not null,
  cache_hit boolean not null default false,
  status smallint not null default 200,
  created_at timestamptz not null default now()
);

create index idx_usage_events_user_id_created_at on public.usage_events (user_id, created_at desc);

-- 4. subscriptions
create table public.subscriptions (
  id uuid primary key default gen_random_uuid (),
  user_id uuid not null references public.users (id) on delete cascade,
  lemon_subscription_id text not null unique,
  lemon_variant_id text not null,
  lemon_customer_id text not null,
  plan public.plan_tier not null,
  status public.subscription_status not null,
  current_period_start timestamptz not null,
  current_period_end timestamptz not null,
  cancel_at_period_end boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index idx_subscriptions_user_id on public.subscriptions (user_id);

-- RLS
alter table public.users enable row level security;

alter table public.api_keys enable row level security;

alter table public.usage_events enable row level security;

alter table public.subscriptions enable row level security;

create policy "users_self_select" on public.users for
select
  using (auth.uid () = id);

create policy "users_self_update" on public.users for
update using (auth.uid () = id);

create policy "api_keys_self_all" on public.api_keys for all
using (auth.uid () = user_id)
with
  check (auth.uid () = user_id);

create policy "usage_events_self_select" on public.usage_events for
select
  using (auth.uid () = user_id);

create policy "subscriptions_self_select" on public.subscriptions for
select
  using (auth.uid () = user_id);

-- Auto-create public.users row on auth.users insert
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path to public
as $func$
begin
  insert into public.users (id, email) values (new.id, new.email);
  return new;
end;
$func$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- updated_at auto-update
create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $func$
begin
  new.updated_at = now();
  return new;
end;
$func$;

create trigger users_set_updated_at
  before update on public.users
  for each row execute function public.set_updated_at();

create trigger subscriptions_set_updated_at
  before update on public.subscriptions
  for each row execute function public.set_updated_at();

-- === migration: subscription waitlist (can run alone if init exists) ===

-- Email waitlist for Pro / Scale when billing (Lemon) is not live yet
create table public.subscription_waitlist (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  plan_interest text not null check (plan_interest in ('pro', 'scale')),
  created_at timestamptz not null default now()
);

create unique index subscription_waitlist_email_plan on public.subscription_waitlist (email, plan_interest);

comment on table public.subscription_waitlist is 'Notify-me list before Lemon checkout is enabled';

alter table public.subscription_waitlist enable row level security;
