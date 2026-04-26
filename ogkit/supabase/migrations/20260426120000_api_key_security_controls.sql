-- Optional production controls for paid teams.
-- Domain allowlists are advisory for crawlers: pass `domain=example.com` in signed URLs.

alter table public.api_keys
add column if not exists allowed_domains text[] not null default '{}',
add column if not exists require_signed_urls boolean not null default false;
