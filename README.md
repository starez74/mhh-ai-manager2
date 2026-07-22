# MHH AI Business Manager v5.2

This release adds the Connection Centre.

## New features

- Unified health checks for Facebook, Supabase, OpenAI and the MHH website.
- Clear Healthy, Not configured and Needs attention states.
- Facebook Page name, Graph API version and last-check time.
- One-click Run all checks control.
- Instagram and email-delivery readiness indicators.
- API keys and access tokens are never displayed.

## Deployment

No Supabase migration is required.

Replace the existing project files, commit and push to GitHub.

Suggested commit message:

`Add connection centre and service health checks`

## Optional environment variable

The website check defaults to `https://mhhremoval.com.au`.

To check a different site, add:

`NEXT_PUBLIC_BUSINESS_WEBSITE`
