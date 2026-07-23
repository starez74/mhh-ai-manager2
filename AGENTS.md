# AGENTS.md — MHH AI Business Manager

## Purpose

This file is the operating guide for coding agents working on **MHH AI Business Manager**.

The application is an internal business-management platform for **Ma's Helping Hand**, a furniture-removals business based in Nanango, Queensland, Australia. It supports enquiries, customers, quotes, jobs, marketing, Facebook publishing, service health checks, and future operations modules.

The current production application identifies itself as **v5.2.0**. The next integrated release is **v6.0**.

## Repository Facts

Verified from the current repository:

- Next.js App Router
- Next.js 15
- React 19
- TypeScript 5.8
- Supabase JS 2.x
- OpenAI JS 5.x
- Existing Git repository
- Existing Supabase migration history
- Existing API routes for AI generation, health checks, Meta/Facebook, quote generation, and reception submissions

Important existing paths:

```text
app/
  api/
    generate/route.ts
    health/route.ts
    meta/route.ts
    meta/publish/route.ts
    quotes/generate/route.ts
    reception/submit/route.ts
  dashboard/page.tsx
  login/page.tsx
  reception/page.tsx

components/
  dashboard/
    KPIGrid.tsx
    NeedsAttention.tsx
    QuickActions.tsx
    UpcomingJobs.tsx
  layout/
    Header.tsx
    Sidebar.tsx
  KPIGrid.tsx

lib/
  supabase.ts

supabase/
  schema.sql
  v3-migration.sql
  v4-migration.sql
  v5-migration.sql
  v5.1-migration.sql
```

Existing database domains include:

- campaigns
- customers
- enquiries
- quotes
- jobs
- activity_events

## Git Workflow

- `main` is the stable production branch.
- `develop` is the working branch for v6 development.
- Before editing, verify the current branch with `git branch --show-current`.
- Do not make v6 feature changes directly on `main`.
- Do not push, merge, rebase, reset, or force-update branches unless the user explicitly requests it.
- Keep each completed change commit-ready.
- Do not commit secrets, `.env` files, access tokens, generated build output, or dependency folders.

## Primary Goal

Build **MHH AI Business Manager v6.0** as one integrated release while preserving current behaviour.

The intended v6 scope is:

1. Architecture and service-layer foundation
2. Operations Centre
3. Dashboard redesign
4. CRM improvements
5. Crew Manager
6. Fleet Manager
7. Calendar and scheduling
8. AI Operations and dispatch assistance
9. Quote and job workflow improvements
10. Documentation, regression testing, and release preparation

Later releases may include customer portals, invoicing, route optimisation, and voice AI. Do not add these early unless explicitly requested.

## Non-Negotiable Principles

1. **Preserve existing functionality.** Refactor safely; do not replace working features without a documented reason.
2. **Do not rebuild the application from scratch.** Extend the existing Next.js/Supabase architecture.
3. **No placeholder implementations.** Avoid mock buttons, fake data, unfinished screens, and TODO-only features in production paths.
4. **No invented business facts.** Do not invent prices, reviews, qualifications, insurance claims, guarantees, staff, vehicles, or service areas.
5. **Use Australian English.**
6. **Protect secrets.** Never expose API keys, Supabase service-role keys, Facebook access tokens, or private environment values to the browser or logs.
7. **Use complete, coherent changes.** Update all affected types, services, APIs, components, migrations, documentation, and tests together.
8. **Avoid unnecessary dependencies.** Prefer the existing stack and platform APIs unless a new package clearly reduces risk or complexity.

## Business and Brand Facts

Use only these confirmed details when business context is required:

- Business: Ma's Helping Hand
- Primary service: furniture removals
- Secondary service: second-hand furniture sales
- Website: `https://mhhremoval.com.au`
- Phone: `0412 144 297`
- Address: `62 Drayton St, Nanango QLD 4615`
- ABN: `70 051 256 598`
- Tagline: `FROM OUR HANDS TO YOUR HOME`
- Primary contact: Mick

Confirmed brand colours:

- Deep navy: `#031529`
- Navy: `#071F37`
- Gold: `#D7A941`
- Pale gold: `#F1D370`

Never recolour or redesign the original truck logo. Resizing and placement changes are permitted when needed.

Never claim the business is insured unless the user explicitly confirms that status.

## Target Architecture

Evolve the repository towards:

```text
app/          # routes, pages, layouts, route handlers
components/   # reusable presentation components
features/     # optional module-specific UI and orchestration
services/     # server-side business logic and data operations
lib/          # shared infrastructure and utilities
hooks/        # reusable client hooks
types/        # shared domain and API types
supabase/     # schema and ordered migrations
docs/         # architecture, database, roadmap, testing, deployment
tests/        # automated tests
```

Do not create directories merely to match this diagram. Add them when real code requires them.

### Layer Rules

#### Presentation

React components should:

- render UI;
- collect user input;
- manage local interaction state;
- call typed APIs or approved data hooks;
- display loading, empty, success, and error states.

React components should not contain complex business rules or duplicated Supabase query logic.

#### API Routes

Route handlers should:

- authenticate and authorise;
- validate and normalise input;
- call services;
- map known errors to appropriate HTTP responses;
- return a stable, typed JSON contract.

Keep route handlers thin. Do not place large prompts, complex database workflows, or domain orchestration directly in route files when they can live in a service or dedicated prompt module.

#### Services

Services own:

- business rules;
- database access;
- orchestration across tables or external providers;
- domain-level validation;
- audit/activity recording where appropriate.

Expected services may include:

```text
services/customerService.ts
services/enquiryService.ts
services/quoteService.ts
services/jobService.ts
services/dashboardService.ts
services/crewService.ts
services/fleetService.ts
services/calendarService.ts
services/taskService.ts
services/notificationService.ts
services/aiService.ts
services/facebookService.ts
services/reportingService.ts
```

Only add a service when it has a real responsibility. Do not create empty shells.

#### Data Access

- Centralise Supabase client creation.
- Explicitly distinguish browser, authenticated server, and privileged server clients.
- Never import a service-role credential into client-side code.
- Prefer explicit column selections over `select('*')` in stable production queries.
- Handle Supabase errors; do not silently discard them.
- Ensure every user-owned record is scoped by the authenticated user and protected by Row Level Security.

## Module Ownership

- **CRM** owns customers, customer notes, tags, contact history, and customer-level activity.
- **Reception** owns incoming enquiries and initial lead capture.
- **Quotes** owns quote generation, pricing state, revisions, acceptance, expiry, and conversion.
- **Jobs** owns scheduled work, execution status, assignments, checklists, photos, and completion.
- **Crew** owns worker records, availability, leave, qualifications, licences, and job assignments.
- **Fleet** owns vehicles, registration, servicing, maintenance, documents, and vehicle assignments.
- **Calendar** presents and coordinates jobs, tasks, leave, maintenance, and manually entered events.
- **Dashboard / Operations Centre** aggregates module data but does not own source records.
- **AI Operations** recommends and assists; it must not silently perform consequential actions without explicit approval.
- **Marketing / Facebook** owns campaign drafts, publishing workflows, and provider connection state.

## Database and Migration Rules

- Preserve the existing migration files unchanged unless correcting a proven migration defect.
- Add v6 changes in a new ordered migration, preferably:

```text
supabase/v6-migration.sql
```

Use the repository's existing naming convention unless the project is deliberately migrated to a timestamped migration system.

Every new table should normally include:

- UUID primary key
- `user_id uuid not null`
- `created_at timestamptz not null default now()`
- `updated_at timestamptz not null default now()` where records are mutable
- appropriate foreign keys
- useful indexes
- Row Level Security enabled
- explicit policies for the allowed operations

Additional rules:

- Use `if not exists` where it safely supports repeatable setup.
- Avoid destructive migrations unless the user has approved a migration and rollback plan.
- Do not drop or rename populated columns casually.
- Document data backfills and compatibility steps.
- Add indexes for frequent ownership, status, foreign-key, and date-range queries.
- Keep status values consistent. Prefer documented check constraints or enums when the lifecycle is stable.
- Verify foreign-key delete behaviour deliberately; do not default everything to cascade.

## TypeScript Standards

- Keep TypeScript strict.
- Avoid `any`; use `unknown` with narrowing when input is untrusted.
- Export reusable domain types from `types/` or a clearly owned module.
- Define stable request and response types for APIs.
- Use discriminated unions for finite workflow states where useful.
- Do not suppress type errors with `@ts-ignore` unless there is a documented, temporary reason.
- Use descriptive names; avoid unexplained abbreviations.
- Prefer small pure helpers over repeated inline transformation logic.

## Next.js Standards

- Respect server and client component boundaries.
- Add `"use client"` only where browser APIs, hooks, or interactive state require it.
- Keep secrets and privileged operations in server-only modules or route handlers.
- Avoid fetching protected business data during static generation.
- Use route handlers for provider callbacks, authenticated mutations, and protected integrations.
- Return useful status codes: 400 validation, 401 unauthenticated, 403 unauthorised, 404 missing, 409 conflict, 422 invalid state, 500 unexpected failure.
- Do not leak stack traces, provider tokens, or internal configuration in user-facing API responses.

## Authentication and Authorisation

- Verify the authenticated Supabase user on protected server endpoints.
- Do not trust a browser-supplied `user_id`.
- Use the authenticated user's ID as the ownership source.
- RLS is mandatory but is not a substitute for server-side authorisation checks.
- Public reception submission endpoints must accept only the required fields and must not permit arbitrary ownership or status assignment.
- Rate limiting, bot protection, and abuse controls should be considered for public endpoints before production release.

## AI and External Provider Rules

- Centralise reusable system instructions and business facts.
- Validate model output before saving or acting on it.
- AI output should be treated as a draft or recommendation unless an explicitly approved workflow says otherwise.
- Never let AI silently publish a campaign, accept a quote, schedule a job, message a customer, or change financial data.
- Record enough metadata to troubleshoot provider failures without storing secrets.
- Use environment variables for model names and provider configuration where appropriate.
- Provide graceful states for not configured, healthy, and needs attention.

## UI and Accessibility

- Keep the existing navy-and-gold visual identity.
- Build responsive layouts for desktop and practical tablet/mobile use.
- Use semantic HTML, labels, keyboard-accessible controls, visible focus states, and adequate contrast.
- Every data view must handle loading, empty, error, and success states.
- Confirm destructive actions.
- Do not rely on colour alone to communicate status.
- Use Australian date and currency conventions where appropriate.

## Dashboard and Operations Centre

The v6 home experience should prioritise actionable business state rather than a menu-first design.

Likely sections include:

- today's jobs;
- upcoming work;
- quotes needing follow-up;
- new enquiries;
- crew availability;
- fleet readiness;
- overdue tasks;
- alerts and expiring documents;
- recent activity;
- revenue and conversion summaries;
- AI morning briefing and recommendations.

Dashboard data should come from an aggregation service. Avoid many unrelated client-side queries scattered through dashboard components.

## Testing Expectations

Before v6 is considered release-ready, protect at least these workflows:

1. Login and protected-route access
2. Public enquiry submission
3. Customer creation or linking
4. Quote generation
5. Quote lifecycle transition
6. Job creation from a quote
7. Crew assignment
8. Vehicle assignment
9. Dashboard / Operations Centre loading
10. AI and provider endpoints returning controlled success and error responses

For each implementation task:

- run TypeScript checks;
- run the production build;
- run relevant automated tests;
- manually verify affected critical paths;
- record known limitations.

The repository currently has no dedicated test scripts in `package.json`. Propose a minimal testing setup before adding large test suites, and explain any new dependencies.

## Required Verification Commands

Use the package manager implied by the existing lockfile. Do not create or replace a lockfile casually.

At minimum, run the available equivalent of:

```bash
npm run build
```

If linting, type checking, or tests are added, run their project scripts as well.

Do not claim a command passed unless it was actually run successfully. Report exact failures and whether they are caused by the change or by an existing repository problem.

## Documentation

Maintain these documents as the project evolves:

```text
docs/ARCHITECTURE.md
docs/DATABASE.md
docs/ROADMAP.md
docs/CHANGELOG.md
docs/TESTING.md
docs/DEPLOYMENT.md
```

Documentation must describe the code that exists, not aspirational features presented as completed.

Update `README.md` when setup, environment variables, deployment, or user-facing capabilities change.

## Change Procedure

For every meaningful task:

1. Inspect the relevant current code, schema, and Git state.
2. Summarise the verified current behaviour.
3. State the proposed change and affected files.
4. Identify migration, security, and regression risks.
5. Implement the smallest coherent production-quality change.
6. Run applicable verification commands.
7. Review the diff for secrets, dead code, duplicated logic, and accidental unrelated changes.
8. Update documentation and changelog when appropriate.
9. Give the user a concise completion report:
   - completed;
   - files changed;
   - database changes;
   - checks run and results;
   - remaining risks or blockers;
   - suggested commit message.

## First v6 Task

Do not immediately build every requested module.

Begin with a repository-wide audit and produce grounded documentation:

1. Verify the active branch and working tree.
2. Inventory pages, API routes, components, Supabase clients, environment variables, database tables, RLS policies, and external integrations.
3. Identify duplicated or unused code, including the two visible `KPIGrid.tsx` files.
4. Map the existing enquiry → customer → quote → job lifecycle.
5. Create or update:
   - `docs/ARCHITECTURE.md`
   - `docs/DATABASE.md`
   - `docs/ROADMAP.md`
   - `docs/CHANGELOG.md`
6. Propose the exact v6 migration and service-layer sequence before changing the database.
7. Run the current production build and document baseline failures before refactoring.

Do not describe unverified assumptions as audit findings.

## Definition of Done for v6.0

Version 6 is complete only when:

- agreed v6 modules are implemented without placeholder behaviour;
- existing v5.2 workflows still work;
- migrations can be applied safely;
- RLS and server authorisation are reviewed;
- secrets remain server-side;
- the production build passes;
- critical workflows have automated or documented regression coverage;
- documentation matches the implementation;
- the release is reviewed on `develop` before merging to `main`.
