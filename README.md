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
