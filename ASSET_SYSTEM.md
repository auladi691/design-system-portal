# Asset System

## Categories

The Asset Library has seven categories. Each has a dedicated filtered view in the Portal and the CMS.

1. **Icons** (`icon`) — Outline style only. No style filter, no brand filter.
2. **Icon illustrations** (`icon-illustration`) — Expressive small visuals with brand metadata.
3. **Illustrations** (`illustration`) — Larger storytelling scenes.
4. **Logos** (`logo`) — Approved brand marks.
5. **Brand assets** (`brand-asset`) — Backgrounds, textures, and approved brand files. Uses brand filter.
6. **Templates** (`template`) — Starting points for consistent design work.
7. **Downloads** (`download`) — Approved files ready for designers to download.

"Brand assets" is one category, not two. Brand filter appears only on Icon illustrations and Brand assets.

## Routes

Portal:

- `/resources/assets`
- `/resources/assets/icon`
- `/resources/assets/icon-illustration`
- `/resources/assets/illustration`
- `/resources/assets/logo`
- `/resources/assets/brand-asset`
- `/resources/assets/template`
- `/resources/assets/download`

Portal only shows assets with status `published`.

## Internal asset purpose: Component preview

Component preview assets are internal CMS assets used only to connect visual files to documentation blocks. They must not become a public Portal category.

- Stored as `assetPurpose: "component-preview"` with `visibility: "internal"`.
- Never exposed in public Portal navigation, Resources cards, Asset Explorer tabs, public routes (`/resources/assets/component-preview` does not exist), public counts, search filters, or sitemap.
- Public categories remain unchanged: icon, icon-illustration, illustration, logo, brand-asset, template, download.
- A published Component preview renders only when referenced by a published documentation block (Design Preview, Variant Gallery, State Gallery).
- Draft or archived Component preview assets never render publicly.
- Studio: visible in Asset Library, Asset Editor, Asset Picker, and visual block configuration.
- Do not classify Button previews as Illustrations or Downloads — use the internal purpose.

Portal resolves component-preview only through the published document relation: `fetchPublishedSite` collects referenced assetIds from published pages and includes published internal assets only when referenced. All other internal assets are excluded from public listing.

## Asset metadata

Each asset stores: name, slug, type, category, brand, purpose, visibility, description, keywords, version, status, alternative text, caption, theme, Figma URL, download availability, file path, file URL, MIME type, file size, original filename, created date, and updated date.

SVG icons should use `currentColor`. Assets may define separate light/dark files. Show usage references before archive or delete.

## File validation

Validation is centralized in `lib/asset-categories.ts` and `lib/asset-validation.ts`. Each category defines allowed extensions, MIME types, and max file size. Validation checks extension, MIME type, size, duplicate filenames in the queue, and required metadata before publishing.

## Bulk upload

Bulk upload is available for every category. Administrators can:

- Choose a category before uploading.
- Drag and drop multiple files.
- Edit shared metadata and per-file metadata.
- See validation and progress per file.
- Retry failed files.
- Cancel pending files.
- Choose "Publish after upload" or save as draft (default).

Upload concurrency is limited to 3 files at once.

## Storage and database sync

- Uploads go to the `design-system-assets` Supabase Storage bucket.
- If a database insert fails after a Storage upload, the uploaded file is removed.
- Permanent delete removes both the Storage file and the database record.
- Bulk delete handles partial failure and never assumes full success.
