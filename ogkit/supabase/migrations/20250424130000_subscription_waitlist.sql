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
