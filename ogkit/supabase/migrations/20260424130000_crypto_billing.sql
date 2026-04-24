-- Crypto (Cryptomus) one-time subscriptions: 30-day access per successful payment
-- order records + optional crypto_paid_until on users (Lemon is separate; see app logic)

alter table public.users
add column if not exists crypto_paid_until timestamptz;

create table if not exists public.crypto_billing_orders (
  order_id text primary key,
  user_id uuid not null references public.users (id) on delete cascade,
  plan public.plan_tier not null
    check (plan in ('pro', 'scale')),
  status text not null
    check (status in ('pending', 'paid')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists idx_crypto_billing_orders_user_id
  on public.crypto_billing_orders (user_id);

alter table public.crypto_billing_orders enable row level security;

drop trigger if exists crypto_billing_orders_set_updated_at on public.crypto_billing_orders;

create trigger crypto_billing_orders_set_updated_at
  before update on public.crypto_billing_orders
  for each row execute function public.set_updated_at ();
