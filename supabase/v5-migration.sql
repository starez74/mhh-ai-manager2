-- MHH AI Business Manager v5 migration
-- Run after v4-migration.sql.

create table if not exists public.quotes (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  quote_number text not null unique,
  status text not null default 'draft'
    check (status in ('draft','approved','sent','accepted','declined','expired')),
  customer_name text not null,
  phone text not null default '',
  email text not null default '',
  pickup_suburb text not null default '',
  delivery_suburb text not null default '',
  preferred_date text not null default '',
  scope_summary text not null default '',
  risk_flags text not null default '',
  missing_information text not null default '',
  draft_message text not null default '',
  price_amount numeric(12,2),
  deposit_amount numeric(12,2),
  valid_until date,
  internal_notes text not null default ''
);

create table if not exists public.jobs (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enquiry_id uuid references public.enquiries(id) on delete set null,
  quote_id uuid references public.quotes(id) on delete set null,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  job_number text not null unique,
  status text not null default 'booked'
    check (status in ('booked','confirmed','in_progress','completed','cancelled')),
  customer_name text not null,
  phone text not null default '',
  email text not null default '',
  scheduled_start timestamptz,
  scheduled_end timestamptz,
  pickup_address text not null default '',
  delivery_address text not null default '',
  pickup_suburb text not null default '',
  delivery_suburb text not null default '',
  crew text not null default '',
  vehicle text not null default '',
  scope_summary text not null default '',
  special_instructions text not null default '',
  quoted_amount numeric(12,2),
  paid_amount numeric(12,2) not null default 0
);

create table if not exists public.activity_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  enquiry_id uuid references public.enquiries(id) on delete cascade,
  quote_id uuid references public.quotes(id) on delete cascade,
  job_id uuid references public.jobs(id) on delete cascade,
  created_at timestamptz not null default now(),
  event_type text not null,
  title text not null,
  details text not null default ''
);

alter table public.quotes enable row level security;
alter table public.jobs enable row level security;
alter table public.activity_events enable row level security;

drop policy if exists "Users manage own quotes" on public.quotes;
create policy "Users manage own quotes" on public.quotes
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own jobs" on public.jobs;
create policy "Users manage own jobs" on public.jobs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users manage own activity" on public.activity_events;
create policy "Users manage own activity" on public.activity_events
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create index if not exists quotes_user_created_idx on public.quotes(user_id, created_at desc);
create index if not exists quotes_enquiry_idx on public.quotes(enquiry_id);
create index if not exists jobs_user_schedule_idx on public.jobs(user_id, scheduled_start);
create index if not exists jobs_quote_idx on public.jobs(quote_id);
create index if not exists activity_enquiry_created_idx on public.activity_events(enquiry_id, created_at desc);
create index if not exists activity_quote_created_idx on public.activity_events(quote_id, created_at desc);
create index if not exists activity_job_created_idx on public.activity_events(job_id, created_at desc);
