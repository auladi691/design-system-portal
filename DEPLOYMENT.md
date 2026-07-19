# Deployment

## Vercel

1. Push the project to GitHub.
2. Import the repository in Vercel.
3. Framework preset: Next.js.
4. Framework preset: Next.js; build command: `npm run build`.
5. Leave Output Directory empty so Vercel detects `.next` automatically.
6. Add Supabase environment variables before enabling production persistence.

## Production environment

```text
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
```

Never expose the service-role key to browser code. Replace demo authentication and browser storage before using the CMS with real internal data.

## Required checks

Build, responsive Portal, CMS authorization, draft isolation, light/dark, reduced motion, keyboard navigation, asset upload rules, token validation, and backup restoration.
