# MHH AI Business Manager

Internal business-management application for Ma's Helping Hand.

Current application version: **5.2.0**  
Foundation target: **6.0**

## Stack

- Next.js 15 App Router
- React 19
- TypeScript
- Supabase
- OpenAI API
- Meta Graph API

## Local setup

Use Node.js 20 or 22 and npm.

```bash
npm install
cp .env.example .env.local
npm run dev
```

Populate `.env.local` with the required Supabase and provider values. Never commit `.env.local` or production credentials.

## Required environment variables

```text
NEXT_PUBLIC_SUPABASE_URL
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
OPENAI_API_KEY
```

## Optional environment variables

```text
OPENAI_MODEL
META_PAGE_ID
META_PAGE_ACCESS_TOKEN
META_GRAPH_API_VERSION
META_PUBLISHING_ENABLED
NEXT_PUBLIC_BUSINESS_WEBSITE
```

`META_PUBLISHING_ENABLED` must be exactly `true` before the publish endpoint will send approved campaign content to Facebook.

## Database

The repository contains the baseline schema and ordered migrations under `supabase/`:

```text
schema.sql
v3-migration.sql
v4-migration.sql
v5-migration.sql
v5.1-migration.sql
```

Review the SQL before applying it. Do not reapply migrations blindly to a populated production database.

## Verification

```bash
npm run build
```

This repository snapshot does not include `node_modules` or a lockfile. Run `npm install` in a network-enabled environment before building. Commit the generated `package-lock.json` to establish reproducible installs.

## Vercel deployment

1. Import the GitHub repository into Vercel.
2. Add the required environment variables for Production, Preview, and Development as appropriate.
3. Keep the framework preset set to Next.js.
4. Use the default install command (`npm install`) and build command (`npm run build`).
5. Deploy first to a preview environment and verify login, reception submission, dashboard loading, quote generation, health checks, and Meta connection state.

## Repository operating guide

Read `AGENTS.md` before making changes. It defines the branch workflow, security rules, architecture direction, and verification expectations.
