-- Switch scans.id from bigserial to uuid so scan inserts don't depend on
-- the InsForge admin role having USAGE on scans_id_seq (it doesn't).
-- Safe to drop because scans has no rows in any environment yet.

alter table public.scans drop constraint if exists scans_pkey;
alter table public.scans drop column id;
drop sequence if exists public.scans_id_seq;

alter table public.scans
  add column id uuid primary key default gen_random_uuid();
