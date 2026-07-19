# One Design Portal & Studio

A documentation portal for UI/UX designers with a CMS for administrators, Asset Library, token import, light/dark mode, and restrained motion.

## Run locally

```bash
npm install
npm run dev
```

The Portal is available at `/`. The CMS is available at `/studio/login`. Connect Supabase before signing in; the demo login has been removed.

## Build

```bash
npm run build
```

The project uses Next.js and deploys to Vercel. Copy `.env.example` to `.env.local` and add Supabase credentials.

## Important decisions

- Portal requires no login and uses `noindex`.
- CMS is for Administrators only (Supabase Auth + `public.administrators`).
- Figma API is not used.
- Token source uses the Figma Design Tokens plugin JSON export.
- All editorial content is managed from the CMS; renderers and behavior live in code.
- UI uses neutral-first color, light/dark mode, and English copy written for designers.

Read [AGENTS.md](./AGENTS.md) before changing the project.

## Supabase setup

1. Create a Supabase project.
2. Run `supabase/schema.sql` in the Supabase SQL editor.
3. Run each file in `supabase/migrations/` in order.
4. Create the `design-system-assets` Storage bucket (the schema creates it if missing).
5. Add your administrator account to `public.administrators`:

```sql
insert into public.administrators (user_id)
values ('your-auth-user-id');
```

6. Set the environment variables listed in `.env.example`.

## Published Content

The Portal reads only published pages, assets, and releases from Supabase. Run
`supabase/migrations/20260719000006_one_design_initial_content.sql` after the
schema and earlier migrations to add the initial published guidance. It uses
valid UUIDs and preserves existing pages when run again.

Public and Studio data flows are separate. The Portal calls
`fetchPublishedSite()`; One Design Studio calls `fetchAdminSite()` after
administrator authentication. When Supabase is not configured locally, Studio
shows clearly marked preview data. A configured but empty or failing database
is never replaced by seed data.

Verify published content in Supabase with:

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

Run `npm test` to execute lint, the production build, and the route/data
contract audit.
