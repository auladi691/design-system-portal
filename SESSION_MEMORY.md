# Session Memory

## Locked scope

- Product name: **One Design** (Portal) and **One Design Studio** (CMS).
- Build a custom CMS and custom documentation Portal.
- Portal is unlisted/read-only without login.
- CMS has one role: Administrator (managed via Supabase Auth and `public.administrators`).
- Full CRUD for all Portal content.
- Wise-aligned Foundation/Component inventory.
- Asset Library has seven categories: Icons, Icon illustrations, Illustrations, Logos, Brand assets, Templates, Downloads.
- Icons are Outline only. Icon illustrations and Brand assets filter by brand. No global brand switcher.
- Token source is the supplied Figma Design Tokens JSON; no Figma API.
- Light/dark themes, neutral-first palette, Apple/Wise/Klarna-inspired motion and editorial layout.
- Copy is English-only, written for UI/UX designers.
- Supabase is the single source of truth for content, assets, auth, and Storage.
- localStorage is only used for theme preference.
- Bulk upload is available for every asset category. Default upload status is `draft`.
- Permanent delete requires a confirmation dialog. Bulk delete handles partial failure.
- Storage and database must stay in sync.

## Production status

1. Supabase repository is implemented (`lib/repository.ts`, `lib/store.ts`).
2. Supabase Auth is implemented with administrator allowlist (`lib/auth.ts`).
3. Supabase Storage uploads, replacement, and delete are implemented (`lib/asset-storage.ts`).
4. Bulk upload with validation, progress, retry, and cancel is implemented (`lib/bulk-upload.ts`, `components/bulk-upload-dialog.tsx`).
5. Complete exact Wise inventory after it is formally supplied/approved.
6. Add real Figma links and production assets.
