# Codex Handoff — MHH AI Business Manager v6.0

Open the local MHH AI Business Manager repository in Codex, make sure the Git working branch is `develop`, and place the accompanying `AGENTS.md` file in the repository root.

Then give Codex this instruction:

```text
Read AGENTS.md completely and follow it as the project operating manual.

Begin the MHH AI Business Manager v6.0 foundation sprint.

Do not implement new feature modules yet. First perform a grounded repository audit using the files that actually exist.

Tasks:
1. Verify the active Git branch and working-tree status. Stop and tell me if the branch is not develop.
2. Inspect package.json, README.md, app/, components/, lib/, supabase/, environment-variable usage, and all API routes.
3. Run the current production build to establish a baseline. Do not alter code merely to hide a failure.
4. Map the existing enquiry → customer → quote → job workflow.
5. Identify duplicated, unused, tightly coupled, or security-sensitive code. Specifically verify whether both KPIGrid.tsx files are used.
6. Create these grounded documents:
   - docs/ARCHITECTURE.md
   - docs/DATABASE.md
   - docs/ROADMAP.md
   - docs/CHANGELOG.md
7. Propose, but do not yet apply, the v6 database migration and service-layer implementation sequence.
8. Show me the audit summary, files created, build result, risks, and proposed next task before making database changes.

Preserve all current working functionality. Do not rebuild the project, invent completed features, expose secrets, or push/merge without explicit approval.
```

## Working Agreement

- `main` remains production-stable.
- `develop` is the v6 working branch.
- Codex edits and verifies the local repository.
- Important design decisions should be reviewed before large migrations or broad refactors.
- Each completed unit should be commit-ready and include a suggested commit message.
