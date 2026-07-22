# MHH AI Manager v2

## Included
- Secure email/password login using Supabase Auth
- Permanent campaign database
- Row Level Security so users can only see their own campaigns
- Authenticated OpenAI campaign generation
- Draft/approved workflow
- Delete and restore-to-draft controls
- Vercel-ready Next.js application

## Deploy

### 1. Create Supabase project
Create a project at Supabase, then open SQL Editor and run:
`supabase/schema.sql`

### 2. Authentication
In Supabase:
- Authentication → Providers → Email
- Keep Email enabled
- For easiest first setup, you may temporarily disable email confirmation, or confirm the signup email normally
- After creating your own account, disable public signups if you want owner-only access

### 3. Replace existing GitHub project files
Extract this ZIP into the root of the existing `mhh-ai-manager` repository.
Commit and push.

### 4. Vercel environment variables
Add:
- OPENAI_API_KEY
- OPENAI_MODEL = gpt-5-mini
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Get the Supabase URL and publishable key from the Supabase project Connect/API settings.

### 5. Redeploy
Redeploy in Vercel after adding the variables.

## Important
Do not expose the Supabase service-role key.
Do not place API keys in GitHub.
Facebook publishing and GitHub editing remain disabled until separately authorised.


# v2.1 Facebook Integration

## Features
- Test Facebook Page connection
- Read the ten most recent Page posts
- Display recent content in the dashboard
- Publish only campaigns marked Approved
- Publishing disabled by default
- Page token remains server-side in Vercel

## Required Meta variables
- META_PAGE_ID
- META_PAGE_ACCESS_TOKEN
- META_GRAPH_API_VERSION = v25.0
- META_PUBLISHING_ENABLED = false

Leave META_PUBLISHING_ENABLED set to false until:
1. the connection test works,
2. recent posts load,
3. you have reviewed the permissions,
4. you deliberately decide to enable publishing.

## Meta permissions generally required
For Page reading and publishing, the Meta app/token normally needs the relevant Page permissions such as:
- pages_show_list
- pages_read_engagement
- pages_manage_posts

Meta may require app review and business verification for production use.


# v2.2 Facebook-aware generation

- The AI now reads up to 15 recent Ma's Helping Hand Page posts before drafting.
- Every campaign includes a duplicate-content check.
- The Facebook publish endpoint extracts and publishes only section 4, Primary Facebook copy, rather than the internal campaign plan.
- Keep META_PUBLISHING_ENABLED=false until several campaigns have been reviewed.
