# Architecture

## Verified

MHH AI Business Manager uses Next.js App Router, React, TypeScript, Supabase and OpenAI. The browser application currently manages enquiries, customers, quotes, jobs, campaigns and activity records.

## Implemented

The v6 foundation introduces:

- `lib/services/` for domain and orchestration logic;
- `lib/types/` for shared domain and API types;
- `lib/supabase/browser.ts` and `lib/supabase/server.ts` for explicit client boundaries;
- `lib/config.ts` for environment validation;
- reusable dashboard components under `components/dashboard/`;
- shared API response helpers under `lib/api/`.

The dashboard remains a client component, but its data loading, activity recording, authentication session access and KPI calculation now use shared services.

## Proposed

Further extraction should move the remaining customer, enquiry, quote and job mutations from the dashboard page into their owning services. Meta, marketing and health routes should then use the same authentication, configuration and response helpers.
