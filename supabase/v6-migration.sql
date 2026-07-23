-- MHH AI Business Manager v6 migration
-- Introduces database-backed crew and vehicle resources.

create table if not exists public.crews (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  contact_name text not null default '',
  phone text not null default '',
  email text not null default '',
  skills text[] not null default '{}',
  availability_status text not null default 'available'
    check (availability_status in ('available', 'busy', 'leave')),
  is_active boolean not null default true
);

create table if not exists public.vehicles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  name text not null,
  registration text not null default '',
  vehicle_type text not null default '',
  capacity_notes text not null default '',
  service_due_at date,
  inspection_due_at date,
  availability_status text not null default 'available'
    check (availability_status in ('available', 'busy', 'maintenance')),
  is_active boolean not null default true
);

create index if not exists crews_user_active_name_idx
  on public.crews(user_id, is_active, name);

create index if not exists crews_user_availability_idx
  on public.crews(user_id, availability_status);

create index if not exists vehicles_user_active_name_idx
  on public.vehicles(user_id, is_active, name);

create index if not exists vehicles_user_availability_idx
  on public.vehicles(user_id, availability_status);

alter table public.crews enable row level security;
alter table public.vehicles enable row level security;

drop policy if exists "Users manage their crews" on public.crews;
create policy "Users manage their crews"
  on public.crews
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "Users manage their vehicles" on public.vehicles;
create policy "Users manage their vehicles"
  on public.vehicles
  for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);
