# Crew and Vehicle CRUD

Extract this archive into the repository root on the `develop` branch.

No new Supabase migration is required. The existing `supabase/v6-migration.sql`
tables are used.

Run:

```cmd
npm run build
npm run dev
git diff --check
git status --short
```

Verify in Resources:
- Add, edit, archive and restore a crew.
- Add, edit, archive and restore a vehicle.
- Confirm counts refresh automatically.

Suggested commit:

```cmd
git add .
git commit -m "Add crew and vehicle management"
git push origin develop
```
