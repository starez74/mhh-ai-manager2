# Roadmap

## Verified

The production application identifies as v5.2.0 and the working branch for v6 is `develop`.

## Implemented

The first v6 architectural foundation is in place: shared types, service boundaries, Supabase client separation, configuration validation and reusable dashboard presentation components.

## Implemented next

The first Operations Centre unit uses existing job data to show today's work, the next seven days, unscheduled jobs and records needing operational attention.

## Implemented scheduling and dispatch

The Operations Centre now includes schedule groups, operational filters and dispatch allocation summaries using existing job data.

## Proposed

Continue Operations Centre in small units, then proceed to dashboard redesign, CRM, crew, fleet and calendar work. Database migrations should only be introduced when a completed feature requires new persisted fields.

- [x] Interactive dispatch assignment workflow

## Implemented calendar and timeline scheduling

The Operations Centre now provides day, week and month calendar views, drag-and-drop day scheduling, duration adjustment and assignment conflict checks using existing job records.


## Resource management

- [x] Resource foundation: crew and vehicle tables, shared types, services and dashboard summary.
- [ ] Crew and vehicle CRUD.
- [ ] Structured scheduling assignments.
- [ ] Availability and workload engine.
- [ ] Resource conflict validation using stable resource IDs.

- [x] Crew and vehicle CRUD
- [ ] Structured dispatch selectors and resource conflict detection
