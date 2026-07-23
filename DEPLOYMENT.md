# Deployment

## Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Framework preset: Next.js; build command: `npm run build`.
4. Leave Output Directory empty so Vercel detects `.next` automatically.
5. Add Supabase environment variables before enabling production persistence.

## Production environment

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the service-role key to browser code. The service-role key is only for server-side maintenance scripts, not the running application.

### Vercel + Supabase migration sequencing

Preferred release order (ideal):

1. Validate repository (lint, typecheck, tests, migration safety check).
2. Apply pending Supabase migrations to production.
3. Verify production schema (required columns, bucket, RLS, 7 public categories, component-preview internal isolation).
4. Deploy to Vercel production.
5. Run production smoke test (Studio loads, admin auth, upload SVG still works, visibility column exists).

Current automation:

- GitHub Actions workflow `.github/workflows/supabase-migrate.yml` runs on pushes to `main` when `supabase/migrations/**`, `supabase/config.toml`, or the workflow itself changes, plus `workflow_dispatch`.
- It installs official Supabase CLI, links to production via `SUPABASE_PROJECT_REF`, validates migrations for destructive patterns, lists status, runs `supabase db push --linked --include-all`, reloads PostgREST cache, and verifies required columns.
- Vercel still auto-deploys on push to `main` in parallel. This means a new app version could briefly be live before migrations finish (causing `Could not find the 'visibility' column` until cache reloads). To enforce strict ordering:
  - Option A (recommended if you need zero-downtime): Disable Vercel auto-deploy for `main` and trigger deploy from GitHub Actions after migration job succeeds (using Vercel Deploy Hook).
  - Option B: Keep parallel but rely on PostgREST auto-reload (few seconds) and Vercel will redeploy on next push if needed. The smoke test job logs this limitation.

Documented limitation: with current Vercel auto-deploy enabled, migration and deployment run concurrently. Migration usually finishes in <30s and PostgREST reload is automatic. If you see visibility column error briefly after deploy, refresh after 10-20s or re-trigger Vercel deploy. For strict guarantee, implement Option A.

## Supabase setup (initial)

1. Run `supabase/schema.sql` in the Supabase SQL editor (one-time baseline, idempotent).
2. Run each migration in `supabase/migrations/` in order (or use automated workflow):
   - `20260719000001_one_design_assets_columns.sql` — adds storage columns.
   - `20260719000002_one_design_asset_type_normalization.sql` — normalizes legacy types.
   - `20260719000003_one_design_asset_type_constraint.sql` — enforces the seven categories.
   - `20260719000004_one_design_site_settings.sql` — sets One Design site settings.
   - `20260719000005_one_design_realtime.sql` — enables Realtime.
   - `20260719000006_one_design_initial_content.sql` — adds initial published Portal pages and release.
   - `20260719000007_private_asset_storage.sql` — makes the asset bucket private.
   - `20260719000008_one_design_asset_purpose_fields.sql` — purpose, visibility, caption, theme, Figma URL, download availability.
   - `20260719000009_one_design_asset_visibility.sql` — visibility backfill for component-preview.
   - `20260719000010_one_design_internal_component_preview.sql` — allows internal type component-preview, ensures all file columns.
3. The `design-system-assets` private Storage bucket is created by the schema if missing.
4. Add administrator accounts to `public.administrators`.

### Automatic migrations (production)

**How it works:**

- Supabase CLI config: `supabase/config.toml`
- Migrations directory: `supabase/migrations/`
- Workflow: `.github/workflows/supabase-migrate.yml`
- Command: `supabase db push --linked --include-all` (applies only pending migrations, idempotent)
- Never uses `supabase db reset` on production — that would drop data.
- Validation script: `scripts/validate-migrations.mjs` checks for destructive patterns (DROP TABLE public.*, TRUNCATE, DELETE without WHERE, DROP COLUMN visibility/purpose/file_path, disabling RLS, db reset).

**Required GitHub secrets (set in GitHub repo → Settings → Secrets and variables → Actions):**

- `SUPABASE_ACCESS_TOKEN` — personal access token from Supabase Dashboard → Account → Access Tokens (least-privilege, needs project management). Never commit this value.
- `SUPABASE_PROJECT_REF` — project reference like `abcdefghijklmnop`, found in Supabase Dashboard URL or Project Settings → General.
- `SUPABASE_DB_PASSWORD` — database password for project (Project Settings → Database → Connection string). Used only for listing/verification, not printed in logs.

Do NOT place these secrets in `.env.example`, Vercel public variables, committed YAML, or source code.

**Package scripts:**

- `npm run db:migrate:production` — runs `supabase db push --linked --include-all` locally (requires linked project via `supabase link`).
- `npm run db:migrations:list` — lists local vs remote migration status.
- `npm run db:migrations:verify` — runs `scripts/verify-production-schema.mjs` (local file check + live DB check if credentials present).
- `npm run db:migrations:validate` — runs `scripts/validate-migrations.mjs` (destructive check).

**How to run manually:**

- GitHub UI: Actions → Supabase Production Migrations → Run workflow (workflow_dispatch).
- CLI locally (requires `SUPABASE_ACCESS_TOKEN` env + linked project): `supabase link --project-ref <ref>` then `npm run db:migrate:production`.

**How to inspect pending/applied migrations:**

- Locally: `npm run db:migrations:list` or `supabase migration list --linked`
- In GitHub Actions logs: the workflow prints status before and after push.
- In Supabase Dashboard: Database → Migrations (if using Supabase migrations table) or check `supabase_migrations.schema_migrations`.

**How to recover from failed migration:**

1. Check Actions logs for exact file and error.
2. Fix migration file (if not yet applied) or create new additive migration with next timestamp (e.g., `20260719000011_fix_...sql`) — never edit already-applied migration's historical meaning in a way that changes checksum.
3. Test locally with `npm run db:migrations:validate` and `npx tsc --noEmit`.
4. Commit and push to `main` — workflow will retry.
5. If DB is stuck requiring manual fix, connect via SQL Editor and run corrective SQL, then mark migration as resolved or re-push.

**Why `db reset` must never run against production:**

- `supabase db reset` drops all tables, storage objects, auth users, and recreates from scratch — would delete all pages, assets, releases, administrators, and files.
- The workflow and scripts explicitly forbid it; validation script fails if `db reset` string appears in migrations or workflow.

**Deployment sequencing as implemented:**

- `validate` job: checks for destructive patterns.
- `migrate` job: needs validate, uses concurrency group `supabase-production-migrations` (only one production migration at a time), environment `production`, least-privilege `contents: read`, links and pushes.
- `smoke-test` job: runs after migrate, documents Vercel sequencing limitation.
- Vercel deployment is still triggered by push to `main` (parallel). See “Vercel + Supabase migration sequencing” above for how to enforce strict ordering if needed.

**Never run production migrations from:**

- client components
- application startup (`app/layout.tsx`, `[[...slug]]/page.tsx`)
- every request
- public API endpoints (`/api/*`)
- `NEXT_PUBLIC_*` credentials

## Published-only verification

Anonymous queries return only `published` pages, assets, and releases through
RLS. Administrators listed in `public.administrators` can manage all statuses.
Storage object reads are limited to published asset paths or administrators by
the Storage policy in `supabase/schema.sql`.

```sql
select type, status, count(*) as total
from public.pages
group by type, status
order by type, status;

select status, count(*) as total
from public.assets
group by status
order by status;

select status, count(*) as total
from public.releases
group by status
order by status;
```

## Required checks

Run `npm install`, `npm run lint`, `npm test`, and `npm run build`. Then check
the route list in `PRODUCTION_AUDIT.md`, responsive Portal, CMS authorization,
draft isolation, light/dark, reduced motion, keyboard navigation, asset upload
rules, token validation, and backup restoration.
