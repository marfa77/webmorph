-- Durable product funnel event stream for early sales and activation analysis.
create table if not exists public.funnel_events (
  id bigserial primary key,
  user_id uuid references public.users (id) on delete set null,
  email text,
  event_name text not null,
  source text not null default 'server',
  properties jsonb not null default '{}'::jsonb,
  notified_at timestamptz,
  created_at timestamptz not null default now()
);

create index if not exists idx_funnel_events_event_name_created_at
  on public.funnel_events (event_name, created_at desc);

create index if not exists idx_funnel_events_user_id_created_at
  on public.funnel_events (user_id, created_at desc);

create index if not exists idx_funnel_events_email_created_at
  on public.funnel_events (email, created_at desc);

create unique index if not exists idx_funnel_events_user_registered_once
  on public.funnel_events (user_id, event_name)
  where user_id is not null and event_name = 'user_registered';

create unique index if not exists idx_funnel_events_first_preview_once
  on public.funnel_events (user_id, event_name)
  where user_id is not null and event_name = 'first_preview_generated';

alter table public.funnel_events enable row level security;

drop policy if exists "funnel_events_self_select" on public.funnel_events;

create policy "funnel_events_self_select" on public.funnel_events for
select
  using (auth.uid () = user_id);

create or replace function public.track_new_user_funnel_event()
returns trigger
language plpgsql
security definer
set search_path to public
as $func$
begin
  insert into public.funnel_events (user_id, email, event_name, source, properties)
  values (
    new.id,
    new.email,
    'user_registered',
    'supabase_trigger',
    jsonb_build_object('plan', new.plan)
  )
  on conflict do nothing;
  return new;
end;
$func$;

drop trigger if exists users_track_funnel_registration on public.users;

create trigger users_track_funnel_registration
  after insert on public.users
  for each row execute function public.track_new_user_funnel_event();
