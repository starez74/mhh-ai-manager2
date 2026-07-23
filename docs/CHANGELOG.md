# Changelog

## Unreleased — v6 foundation

### Implemented

- Added shared domain and API types.
- Added customer, enquiry, quote, job, dashboard, authentication and activity services.
- Added explicit browser and server Supabase client creation.
- Added central environment configuration validation.
- Added shared API authentication, error, logging and response helpers.
- Refactored marketing, health and Meta routes into thin coordinators backed by services.
- Split the dashboard summary into reusable components.
- Removed the duplicate root KPI grid and retained one authoritative dashboard implementation.
- Refactored quote generation and public reception routes to use services.
- Added architecture, database and roadmap documentation.

### Database

- No schema or migration changes.

- Consolidated reusable service input/editable-field types under `lib/types`, removed the unused duplicate root KPI grid, and eliminated an unnecessary dashboard date cast.

## Operations Centre foundation

- Added a live Operations Centre using existing job records.
- Added daily, seven-day, unscheduled and readiness views.
- Added direct navigation from an operations card to the existing job editor.
- Added reusable operations types and aggregation service functions.

## Operations Centre scheduling and dispatch

- Added schedule groups for unscheduled, today, tomorrow and this week.
- Added assignment, attention and status filters.
- Added dispatch summaries for due-today, overdue, crew and vehicle allocation.
- Kept scheduling and dispatch calculations in the operations service layer.

- Added an interactive dispatch assignment workflow for crew, vehicle and schedule updates.

## Operations calendar and timeline

- Added day, week and month scheduling views.
- Added drag-and-drop day scheduling, duration controls and crew/vehicle conflict prevention.
- Added an unscheduled job lane and overdue schedule indicators.


## Resource management foundation

- Added database-backed crew and vehicle resource models with ownership-scoped RLS policies.
- Added typed crew, vehicle and resource services.
- Added a Resources dashboard view with availability summaries and empty, loading and error states.
- Existing job crew and vehicle fields remain unchanged until scheduling integration is completed.
