-- MHH AI Business Manager v5.1 migration
-- Adds reversible archiving to operational records.

alter table public.enquiries add column if not exists archived_at timestamptz;
alter table public.customers add column if not exists archived_at timestamptz;
alter table public.quotes add column if not exists archived_at timestamptz;
alter table public.jobs add column if not exists archived_at timestamptz;

create index if not exists enquiries_user_archived_idx
  on public.enquiries(user_id, archived_at, created_at desc);

create index if not exists customers_user_archived_idx
  on public.customers(user_id, archived_at, created_at desc);

create index if not exists quotes_user_archived_idx
  on public.quotes(user_id, archived_at, created_at desc);

create index if not exists jobs_user_archived_idx
  on public.jobs(user_id, archived_at, scheduled_start);
