-- MHH AI Business Manager v6.1 dispatch resource integration
-- Links jobs to managed crew and vehicle records while preserving legacy name fields.

alter table public.jobs
  add column if not exists crew_id uuid references public.crews(id) on delete set null;

alter table public.jobs
  add column if not exists vehicle_id uuid references public.vehicles(id) on delete set null;

create index if not exists jobs_user_crew_schedule_idx
  on public.jobs(user_id, crew_id, scheduled_start, scheduled_end)
  where archived_at is null and crew_id is not null;

create index if not exists jobs_user_vehicle_schedule_idx
  on public.jobs(user_id, vehicle_id, scheduled_start, scheduled_end)
  where archived_at is null and vehicle_id is not null;

comment on column public.jobs.crew_id is
  'Managed crew assignment. Legacy crew text is retained for display and compatibility.';

comment on column public.jobs.vehicle_id is
  'Managed vehicle assignment. Legacy vehicle text is retained for display and compatibility.';
