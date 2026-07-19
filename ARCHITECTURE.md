# Architecture

## Runtime structure

```text
Next.js application
├── Portal renderer (`/`)
├── CMS Studio (`/studio/*`)
├── Shared content model
├── Token pipeline
└── Asset library (seven categories)
```

One Design is a Next.js application deployed on Vercel. Supabase is the single source of truth for content, assets, auth, and Storage. Portal and CMS share the same Supabase tables; the difference is the role of the signed-in user.

## Source of truth

```text
Figma → manual JSON export → token import
CMS → pages/assets/releases → published data
Published data → Portal renderer
```

Drafts and archived records never render in Portal. Layout engines, block renderers, authorization, and parsers remain code. Editorial copy, ordering, navigation, relations, assets, status, and metadata are content.

## Data layer

- `lib/supabase-client.ts` — browser Supabase client (anon key, session-based).
- `lib/repository.ts` — reads and writes for pages, assets, releases, and settings. Translates Supabase errors into friendly copy.
- `lib/asset-storage.ts` — Supabase Storage uploads and deletes with safe file paths.
- `lib/store.ts` — `useSiteData` hook that loads data from Supabase and subscribes to Realtime updates.
- `lib/auth.ts` — `useAuth` hook for Supabase Auth with administrator allowlist.

Row Level Security enforces:
- Anonymous users read `published` records only.
- Administrators (listed in `public.administrators`) can create, read, update, and delete.
- Draft and archived records are invisible to viewers.
- Storage uploads, updates, and deletes are restricted to administrators.

## Asset storage path

```text
{asset-type}/{year}/{month}/{uuid}-{safe-filename}
```

Example: `icon/2026/07/uuid-arrow-right.svg`

If a database insert fails after a Storage upload, the uploaded file is removed so no orphan files remain.

## Production adapter

The repository layer replaces the previous browser-storage adapter and preserves the component API:

```ts
interface ContentRepository {
  getPublishedSite(): Promise<SiteData>;
  getAdminSite(): Promise<SiteData>;
  savePage(page: ContentPage): Promise<Result>;
  saveAsset(asset: Asset): Promise<Result>;
  saveRelease(release: Release): Promise<Result>;
  saveSettings(settings: SiteSettings): Promise<Result>;
}
```

Use Supabase Row Level Security. Anonymous users may read published records only. Administrator sessions may manage all records.
