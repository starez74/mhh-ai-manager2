# MHH AI Business Manager v5.1.1

Facebook connection diagnostic update.

## What changed

- Verifies that the configured Page ID and token can identify the Page.
- Displays the exact connected Page name.
- Separately verifies recent-post access.
- Shows Meta's real error message, error code and subcode when available.
- Shows the configured Graph API version.
- Adds links to the connected Page and individual posts.
- Does not display or expose the Page access token.

## Deployment

No Supabase migration is required.

Replace the existing project files, commit and push to GitHub.

Suggested commit message:

`Add Facebook connection diagnostics`

After deployment:

1. Sign in.
2. Open **Facebook**.
3. Click **Run Facebook Connection Check**.
4. A successful result will show:
   - Overall connection: Connected
   - Recent-post access: Working
   - Configured Page: Ma's Helping Hand
   - Recent posts loaded
