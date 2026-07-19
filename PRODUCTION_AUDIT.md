# Production Audit

## Branding

- Product name: **One Design** (Portal and login).
- CMS name: **One Design Studio**.
- Logo lettermark: `O`.
- Footer, header, login, CMS sidebar, metadata, page title, site settings, and seed data all use One Design.
- No legacy "Nusa" or "Nusa Design System" names remain in user-facing code.

## Language

- All user-facing copy is English.
- No Bahasa Indonesia mode, language switcher, or locale selector.
- Copy is written for UI/UX designers; engineering jargon is avoided.
- Token names, filenames, URLs, code snippets, and file formats are not translated.

## Asset Library

- Seven categories: Icons, Icon illustrations, Illustrations, Logos, Brand assets, Templates, Downloads.
- Each category has a dedicated route, filtered view, search, asset count, loading state, and empty state.
- Brand filter appears only on Icon illustrations and Brand assets.
- Portal shows only `published` assets.

## Bulk upload

- Available for every category.
- Category selection, drag-and-drop, per-file metadata, shared metadata, validation, progress, retry, cancel, and "Publish after upload".
- Default upload status is `draft`.
- Upload concurrency is limited to 3 files.

## File validation

- Centralized in `lib/asset-categories.ts` and `lib/asset-validation.ts`.
- Checks extension, MIME type, size, duplicate filenames, and required metadata.
- Friendly error copy for designers.

## Supabase Storage

- Bucket: `design-system-assets`.
- Path: `{asset-type}/{year}/{month}/{uuid}-{safe-filename}`.
- If a database insert fails after a Storage upload, the uploaded file is removed.
- Replacement files clean up the previous file after the database update succeeds.

## Database

- `public.assets` has `file_path`, `file_url`, `mime_type`, `file_size`, `original_file_name`, and `alt_text`.
- `type` is constrained to the seven approved categories after legacy normalization.
- RLS: viewers read `published` only; administrators manage all records.
- Realtime is enabled for pages, assets, releases, and site_settings.

## Delete and bulk delete

- Permanent delete requires a confirmation dialog.
- Delete removes the database record and the Storage file.
- Bulk delete handles partial failure and reports which items could not be removed.
- Archived assets keep the record and file; delete removes them permanently.

## Accessibility

- Drop zone is keyboard-operable (Enter and Space trigger the file picker).
- Icon-only buttons have accessible names.
- Progress bars expose `role="progressbar"` and `aria-valuenow`.
- Confirmation dialogs trap focus and return focus to the trigger on close.
- Escape closes dialogs only when safe (never confirms a destructive action).
- Reduced motion disables smooth scroll, parallax, and decorative animation.
- Status is communicated with text and color, not color alone.

## Feedback and error handling

- Toasts confirm upload started, completed, partial, failed, retry, saved, published, archived, deleted, bulk delete, network issue, session expired, and permission denied.
- Raw Supabase errors are never shown; `friendlyErrorMessage` translates them into actionable copy.

## Known limitations

- Release editor is read-only in this iteration (a toast indicates where editing will open).
- Token manager shows the imported summary; full token editing arrives with the Wise inventory.
- Some dashboard numbers are illustrative until production analytics are connected.

## Route Audit

The automated contract in `tests/route-audit.test.mjs` covers:

- `/`, `/design`, `/foundations`, `/components`, `/patterns`, `/resources`
- `/resources/assets` and `icon`, `icon-illustration`, `illustration`, `logo`, `brand-asset`, `template`, `download`
- `/changelog` and `/search`
- Foundation, component, design, pattern, and resource detail routes
- Invalid root, invalid detail slug, and invalid asset category 404 behavior

Run `npm test` to run lint, the production build, and this audit. For a local
HTTP smoke test, start the production server with `npm run start` and request
every route above plus `/components/not-a-component`; the latter must return
404.

## Supabase Verification Queries

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
