# MHH AI Business Manager v5.1

This release adds safe record removal throughout the operational workflow.

## New controls

- Archive enquiries, quotes, jobs and customers.
- View archived records separately.
- Restore archived records.
- Permanently delete records after typing `DELETE`.
- Quote deletion is blocked while a linked job exists.
- Deleting a job leaves its quote and enquiry intact.
- Deleting an enquiry does not automatically delete its quote or job.
- Completed jobs can be archived while preserving history.

## Upgrade

1. Run `supabase/v5.1-migration.sql` in Supabase SQL Editor.
2. Replace the existing project files with this release.
3. Commit and push to GitHub.
4. Wait for Vercel deployment.

Suggested commit message:

`Add archive restore and permanent delete controls`
