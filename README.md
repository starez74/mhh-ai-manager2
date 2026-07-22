# MHH AI Manager v3

## New in v3
- Visible version number
- Automatic Facebook sync after login
- Refresh Facebook Posts button
- Last sync timestamp
- Recent Facebook posts and saved campaigns used as generation memory
- Duplicate-content warning
- Exact Facebook caption stored separately from internal strategy
- Approval-gated publishing posts only the approved caption

## Before deployment
Run `supabase/v3-migration.sql` in Supabase SQL Editor.

## Deploy
Replace your existing repository files with this package, commit and push. Vercel will deploy automatically. Keep `META_PUBLISHING_ENABLED=false` until you intentionally test publishing.


## v4.1 submission fix

This release removes the anonymous `.select("id")` call after a public enquiry insert.
The v4 Row Level Security policy permits anonymous inserts but intentionally does not
permit anonymous visitors to read enquiry records.

No additional SQL migration is required when `v4-migration.sql` has already run.
