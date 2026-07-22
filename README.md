# MHH AI Business Manager v4

Version 4 adds the first operational business modules to the existing marketing manager.

## New modules

- Customer database
- Website enquiry pipeline
- Guided public removal quote receptionist at `/reception`
- Lead status workflow: new, contacted, quoted, booked, closed or declined
- Lead-to-customer conversion
- Follow-up date tracking
- Click-to-call and click-to-SMS actions
- Dashboard alerts for new enquiries and follow-ups
- Existing Facebook connection and campaign records retained

## Upgrade steps

1. Back up the existing GitHub repository.
2. In Supabase, open SQL Editor.
3. Run `supabase/v4-migration.sql` once.
4. Replace the existing repository files with this package.
5. Commit and push to GitHub.
6. Allow Vercel to deploy.
7. Open `/reception` and submit a test enquiry.
8. Sign into the manager and confirm the test appears under Enquiries.

## Important

The receptionist does not automatically calculate or promise a price. It collects the information required for Mick to review and prepare a quote.

No additional environment variables are required beyond the v3 configuration.
