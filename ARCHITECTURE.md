# Architecture

## Runtime structure

```text
Next.js application
├── Portal renderer (`/`)
├── CMS Studio (`/studio/*`)
├── Shared content model
├── Token pipeline
└── Asset library
```

The current evaluation build persists CMS changes in browser storage so it runs without credentials. Production must replace the store adapter with Supabase PostgreSQL, Storage, and Auth while preserving the component API.

## Source of truth

```text
Figma → manual JSON export → token import
CMS → pages/assets/releases → published data
Published data → Portal renderer
```

Drafts and archived records never render in Portal. Layout engines, block renderers, authorization, and parsers remain code. Editorial copy, ordering, navigation, relations, assets, status, and metadata are content.

## Production adapter

Replace `lib/store.ts` with a repository layer:

```ts
interface ContentRepository {
  getPublishedSite(): Promise<SiteData>;
  getAdminSite(): Promise<SiteData>;
  savePage(page: ContentPage): Promise<void>;
  saveAsset(asset: Asset): Promise<void>;
  saveRelease(release: Release): Promise<void>;
}
```

Use Supabase Row Level Security. Anonymous users may read published records only. Administrator sessions may manage all records.
