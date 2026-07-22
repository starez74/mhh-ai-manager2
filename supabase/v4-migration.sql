-- MHH AI Business Manager v4 migration
-- Run after the v3 migration in Supabase SQL Editor.

create table if not exists public.customers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  phone text not null default '',
  email text not null default '',
  preferred_contact text not null default 'phone' check (preferred_contact in ('phone','sms','email','facebook')),
  address text not null default '',
  notes text not null default '',
  status text not null default 'active' check (status in ('active','inactive'))
);

create table if not exists public.enquiries (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  customer_id uuid references public.customers(id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'website',
  status text not null default 'new' check (status in ('new','contacted','quoted','booked','closed','declined')),
  customer_name text not null,
  phone text not null,
  email text not null default '',
  preferred_contact text not null default 'phone',
  pickup_suburb text not null,
  delivery_suburb text not null,
  preferred_date text not null default '',
  property_size text not null default '',
  stairs text not null default 'No',
  steep_driveway text not null default 'No',
  heavy_items text not null default '',
  item_summary text not null default '',
  extra_notes text not null default '',
  ai_summary text not null default '',
  follow_up_at timestamptz,
  converted_at timestamptz
);

alter table public.customers enable row level security;
alter table public.enquiries enable row level security;

drop policy if exists "Users manage own customers" on public.customers;
create policy "Users manage own customers" on public.customers
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Owners read assigned and public enquiries" on public.enquiries;
create policy "Owners read assigned and public enquiries" on public.enquiries
  for select to authenticated using (user_id = auth.uid() or user_id is null);

drop policy if exists "Owners insert enquiries" on public.enquiries;
create policy "Owners insert enquiries" on public.enquiries
  for insert to authenticated with check (user_id = auth.uid());

drop policy if exists "Owners update assigned and public enquiries" on public.enquiries;
create policy "Owners update assigned and public enquiries" on public.enquiries
  for update to authenticated using (user_id = auth.uid() or user_id is null)
  with check (user_id = auth.uid() or user_id is null);

drop policy if exists "Owners delete assigned and public enquiries" on public.enquiries;
create policy "Owners delete assigned and public enquiries" on public.enquiries
  for delete to authenticated using (user_id = auth.uid() or user_id is null);

drop policy if exists "Public can submit enquiries" on public.enquiries;
create policy "Public can submit enquiries" on public.enquiries
  for insert to anon with check (user_id is null and source = 'website');

create index if not exists customers_user_name_idx on public.customers(user_id, name);
create index if not exists enquiries_status_created_idx on public.enquiries(status, created_at desc);
create index if not exists enquiries_user_created_idx on public.enquiries(user_id, created_at desc);
