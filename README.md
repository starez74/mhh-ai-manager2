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
