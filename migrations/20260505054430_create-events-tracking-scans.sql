-- Checkpoint 4: events, tracking_links, scans + RLS + indexes
-- Schema owned by users via auth.uid(). Scan inserts happen server-side
-- with the admin API key, so there is no public INSERT policy on scans.

create extension if not exists pgcrypto;

-- events
create table public.events (
  id           uuid        primary key default gen_random_uuid(),
  user_id      uuid        not null references auth.users(id) on delete cascade,
  name         text        not null check (length(btrim(name)) > 0),
  luma_url     text        not null check (luma_url ~* '^https?://'),
  created_at   timestamptz not null default now(),
  archived_at  timestamptz
);

create index events_user_id_idx         on public.events(user_id);
create index events_user_active_idx     on public.events(user_id, created_at desc)
  where archived_at is null;

alter table public.events enable row level security;

create policy "events_owner_select"
  on public.events for select
  using (user_id = auth.uid());

create policy "events_owner_insert"
  on public.events for insert
  with check (user_id = auth.uid());

create policy "events_owner_update"
  on public.events for update
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "events_owner_delete"
  on public.events for delete
  using (user_id = auth.uid());

-- tracking_links
create table public.tracking_links (
  id              uuid        primary key default gen_random_uuid(),
  event_id        uuid        not null references public.events(id) on delete cascade,
  short_code      text        not null unique check (short_code ~ '^[0-9A-Za-z]{6,12}$'),
  label           text        not null check (length(btrim(label)) > 0),
  placement_type  text        not null default 'other'
                                check (placement_type in ('physical','digital','print','other')),
  notes           text,
  metadata        jsonb       not null default '{}'::jsonb,
  created_at      timestamptz not null default now(),
  archived_at     timestamptz
);

create index tracking_links_event_idx           on public.tracking_links(event_id);
create index tracking_links_event_active_idx    on public.tracking_links(event_id, created_at desc)
  where archived_at is null;

alter table public.tracking_links enable row level security;

create policy "tracking_links_owner_select"
  on public.tracking_links for select
  using (exists (
    select 1 from public.events e
     where e.id = tracking_links.event_id and e.user_id = auth.uid()
  ));

create policy "tracking_links_owner_insert"
  on public.tracking_links for insert
  with check (exists (
    select 1 from public.events e
     where e.id = tracking_links.event_id and e.user_id = auth.uid()
  ));

create policy "tracking_links_owner_update"
  on public.tracking_links for update
  using (exists (
    select 1 from public.events e
     where e.id = tracking_links.event_id and e.user_id = auth.uid()
  ))
  with check (exists (
    select 1 from public.events e
     where e.id = tracking_links.event_id and e.user_id = auth.uid()
  ));

create policy "tracking_links_owner_delete"
  on public.tracking_links for delete
  using (exists (
    select 1 from public.events e
     where e.id = tracking_links.event_id and e.user_id = auth.uid()
  ));

-- scans
create table public.scans (
  id                bigserial    primary key,
  tracking_link_id  uuid         not null references public.tracking_links(id) on delete cascade,
  scanned_at        timestamptz  not null default now(),
  ip_hash           text,
  ua_hash           text,
  user_agent        text,
  device_type       text         check (device_type in ('mobile','tablet','desktop','bot','unknown')),
  os                text,
  browser           text,
  browser_version   text,
  language          text,
  country           text,
  region            text,
  city              text,
  referrer          text
);

create index scans_link_time_idx    on public.scans(tracking_link_id, scanned_at desc);
create index scans_time_idx         on public.scans(scanned_at desc);
create index scans_unique_dedup_idx on public.scans(tracking_link_id, ip_hash, ua_hash, scanned_at);

alter table public.scans enable row level security;

create policy "scans_owner_select"
  on public.scans for select
  using (exists (
    select 1
      from public.tracking_links t
      join public.events e on e.id = t.event_id
     where t.id = scans.tracking_link_id
       and e.user_id = auth.uid()
  ));

-- RPC: unique-scan count within a rolling interval
create or replace function public.unique_scans_since(
  link_id    uuid,
  since_ago  interval
) returns bigint
language sql
stable
security definer
set search_path = public
as $$
  select count(distinct (coalesce(ip_hash, ''), coalesce(ua_hash, '')))
    from public.scans
   where tracking_link_id = link_id
     and scanned_at >= now() - since_ago
$$;

grant execute on function public.unique_scans_since(uuid, interval) to authenticated, anon;
