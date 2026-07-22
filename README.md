# MHH AI Business Manager v5

This release adds the Quote & Job Engine.

## New workflow

1. Website receptionist creates an enquiry.
2. Open the enquiry and click **Generate quote**.
3. The AI drafts the scope, risk flags, missing information and customer message.
4. Mick enters the final price, deposit and validity date.
5. Save and approve the quote.
6. Convert the quote to a scheduled job.
7. Update the job through booked, confirmed, in progress and completed.
8. Every important change appears in the activity timeline.

## Installation

1. Open Supabase SQL Editor.
2. Run `supabase/v5-migration.sql`.
3. Replace the existing project files with this release.
4. Commit and push to GitHub.
5. Wait for Vercel to deploy.

Suggested commit message:

`Add quote and job engine`

## Important safety behaviour

The AI does not set or promise a final price. Pricing remains owner-controlled.
It does not claim the business is insured and does not promise availability.
