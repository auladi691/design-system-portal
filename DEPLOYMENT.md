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

## Supabase setup

1. Run `supabase/schema.sql` in the Supabase SQL editor.
2. Run each migration in `supabase/migrations/` in order:
   - `20260719000001_one_design_assets_columns.sql` — adds storage columns.
   - `20260719000002_one_design_asset_type_normalization.sql` — normalizes legacy types.
   - `20260719000003_one_design_asset_type_constraint.sql` — enforces the seven categories.
   - `20260719000004_one_design_site_settings.sql` — sets One Design site settings.
   - `20260719000005_one_design_realtime.sql` — enables Realtime.
3. The `design-system-assets` Storage bucket is created by the schema if missing.
4. Add administrator accounts to `public.administrators`.

## Required checks

Build, responsive Portal, CMS authorization, draft isolation, light/dark, reduced motion, keyboard navigation, asset upload rules, token validation, and backup restoration.
