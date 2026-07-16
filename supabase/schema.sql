-- Run this in Supabase SQL Editor
create table if not exists public.campaigns (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  title text not null,
  objective text not null,
  audience text not null,
  offer text not null default '',
  content text not null,
  status text not null default 'draft' check (status in ('draft','approved','published','archived'))
);

alter table public.campaigns enable row level security;

drop policy if exists "Users can read own campaigns" on public.campaigns;
create policy "Users can read own campaigns" on public.campaigns for select using (auth.uid() = user_id);

drop policy if exists "Users can insert own campaigns" on public.campaigns;
create policy "Users can insert own campaigns" on public.campaigns for insert with check (auth.uid() = user_id);

drop policy if exists "Users can update own campaigns" on public.campaigns;
create policy "Users can update own campaigns" on public.campaigns for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

drop policy if exists "Users can delete own campaigns" on public.campaigns;
create policy "Users can delete own campaigns" on public.campaigns for delete using (auth.uid() = user_id);
