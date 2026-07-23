# CMS-Driven Portal + Figma Workflow — In Progress

## Phase 1: Asset model extension — DONE (code)
- New types: AssetPurpose (8 values), AssetTheme, ASSET_PURPOSE_OPTIONS
- Asset extended with: purpose, caption, theme, figmaUrl, downloadAvailable
- ContentPage extended with: coverAssetId
- SiteData extended with: tokenImports
- New migration: 20260719000008_one_design_asset_purpose_fields.sql (additive, if not exists)
- schema.sql updated
- Repository maps new columns (with fallback if DB not migrated yet)
- Bulk upload supports new fields (purpose, theme, caption)

## Phase 2: Real Asset Picker — DONE
- New component: components/asset-picker.tsx
  - search assets, filter by category, filter by asset purpose, preview file (image thumbnail, glyph fallback), see draft/published/no-file status, select, replace/remove entry points
  - uses actual CMS assets with fileUrl when available
- AssetPickerButton helper for inline selection
- Integrated into visual block editor per block and per gallery item
- Integrated into page cover selection, portal card visuals

## Phase 3: Visual block system upgrade — DONE
- New kind enum: 12 designer-facing kinds (design-preview, asset-gallery, variant-gallery, state-gallery, token-reference, interactive-preview, anatomy, do-don't, flow-diagram, typography-specimen, spacing-specimen, icon-construction)
- Legacy kinds kept as aliases (component-preview -> design-preview, token-swatch -> token-reference, state-comparison -> state-gallery, anatomy-diagram -> anatomy, do-dont-comparison -> do-dont, asset-preview -> asset-gallery)
- normalizeVisualBlockKind helper
- GalleryItem type: id, assetId (stable across replacements), name/title, description, caption, altText, FigmaURL, variant, state, order
- VisualBlock expanded with assetId, caption, altText, variant/size/state/theme/figmaUrl/downloadEnabled, items, tokenNames, component config
- visual-block.tsx rewritten:
  - design-preview: real <img> from asset fileUrl; caption, figmaUrl, download toggles; unavailable fallback
  - galleries: multi-asset grid with real visuals, per-item Figma links
  - token-reference: reads from published token import resolved tokens
  - interactive-preview: CMS-driven (variant, size, state, disabled, loading, iconName) — no code visible
  - neutral unavailable states never fake documentation

## Phase 4: Document editor improvements — DONE
- Section reordering: up/down buttons on outline
- Gallery item reordering and duplicate/remove per visual block
- Duplicate visual block
- Cover/thumbnail asset selection via AssetPicker
- Write meta form supports Figma URL editing
- Featured toggle
- Page properties: type, category, owner, version, Figma URL, featured, cover visual
- Studio preview drawer showing live preview (how Portal will render, using admin assets)
- Draft save, publish, unpublish, archive flows with confirm
- Raw JSON details mode behind toggle (not primary workflow)
- New page: template picker (4 templates) instead of bare empty page, no sessionStorage for CMS content

## Phase 5: Structured Portal Config editor — DONE
- New component: portal-config-editor.tsx
  - Tabs: Navigation, Homepage, Collections, Resources, Footer, Messages, SEO, JSON details
  - Structured form for navigation links, hero/eyebrow/title/description + hero artwork asset picker, CTAs, statement, story steps
  - Collections: eyebrow/title/summary/empty, hero visual asset picker, per-card title/destination/visual asset
  - Resource cards, footer links, copy (empty/noResults/loading/loadError), SEO
  - Asset-backed hero/card visuals
  - JSON details mode behind tab for admin only (not primary)
- lib/portal-config.ts:
  - validatePortalConfig, getDefaultPortalConfig, mergePortalConfig, getCollectionConfig
  - parsePortalConfig, formatPortalConfig kept for admin path
- Settings page uses structured editor for Branding tab

## Phase 6: Document templates — DONE
- New lib: lib/page-templates.ts
  - PAGE_TEMPLATES: foundation (11 sections), component (15 sections), pattern (14 sections), resource (11 sections)
  - makePageFromTemplate creates empty sections with guidance hints, not fake content
- New component: template-picker.tsx dialog
- ContentManager new-page flow opens TemplatePicker
- addRecommended can accept templateId

## Phase 7: Token persistence — DONE (code)
- Types: TokenImport (fileName, sourceJson not edited, TokenLibrarySummary, status draft/published/archived, publishedAt, validationErrors, validationBrokenAliases), TokenLibrarySummary
- lib/tokens.ts:
  - validateTokenStructure, validateTokenAliases (broken alias detection)
- lib/token-resolver.ts:
  - resolveTokenLibrary with alias resolution, getPublishedTokenImport (latest published by publishedAt), getResolvedTokensFromImport, buildTokenSummary
- lib/repository.ts:
  - TokenImportRow mapping, fetchPublishedSite / fetchAdminSite now fetch token_imports, saveTokenImport, deleteTokenImportRecord
  - Handles missing table gracefully pre-migration
  - Realtime subscription includes token_imports
- lib/store.ts: upsertTokenImport, removeTokenImport, tokenImports
- Studio: TokensManager full rewrite
  - Import JSON -> validate structure -> validate aliases -> show import summary -> save as draft in Supabase -> publish with guard (blocks if broken aliases)
  - Never edit original sourceJson
  - Draft / published / archived table, publish/unpublish/archive/delete actions
  - Shows previous versions, marks current published
  - Preview groups still navigable

## Phase 8: Portal visual corrections + CTA/link rules — DONE
- Portal no longer uses PreviewGlyph hardcoded "Continue" as primary production source
  - New: CardVisual (doc cover -> design-preview asset -> neutral text placeholder, never fake image that looks like docs)
  - Home hero supports CMS-selected hero asset (heroAssetId)
  - Collection hero supports heroAssetId
  - Collection cards use CardVisual resolver
  - DocPage cover supports coverAssetId with caption
- AssetExplorer: now filters by purpose as well as brand, uses real fileUrl previews
- AssetDrawer: download with availability check, Figma link only with valid Figma URL
- lib/asset-resolver.ts: resolveAsset, resolveAssetFileUrl, isDownloadAvailable, isValidFigmaUrl, resolveAssets — centralized helpers
  - isValidFigmaUrl: validates https + hostname figma.com / *.figma.com / www.figma.com
- lib: asset-image.tsx (AssetImage, PortalAssetImage, GalleryImage) with neutral unavailable states
- Link/CTA rules:
  - Open in Figma only when isValidFigmaUrl -> true, opens in new tab target _blank rel noreferrer
  - Download only when real fileUrl exists AND downloadAvailable
  - No fake href: resource cards marked unavailable are div not button, href undefined -> treated as unavailable
  - Asset cards open correct published asset via drawer (Portal uses published-only assets)
  - Gallery items have own figmaUrl/download links per item
  - Draft/archived assets never appear in Portal (filtered in repository, also in resolver requirePublished)
  - Unknown/unpublished detail routes return 404 (preserved in portal.tsx)

## Remaining
- Phase 9: Build/lint/tests verification after review-provider outage recovery
- E2E Button workflow manual verification requires running dev server + Supabase
- globals.css: comprehensive new styles for all new components and QA polish (loading, empty, error, draft, published, unavailable, light/dark, responsive 375/390/768/1440, keyboard navigation, focus states, reduced-motion)
- route-audit.test.mjs updated to reflect new structured editor + template picker
- New test file: tests/figma-workflow.test.mjs covering Figma workflow contract (asset model, picker, visual blocks, asset replacement by ID, template, portal config structured editor, token persistence, link rules, no Figma API, no Figma OAuth, no localStorage)
- Remaining lint/build/test verification (shell blocked by transient review-provider outage wz/wz/gpt-5.5-review unavailable)

## New Components and Libs
- components/asset-picker.tsx
- components/asset-image.tsx
- components/portal-config-editor.tsx
- components/template-picker.tsx
- lib/asset-resolver.ts
- lib/token-resolver.ts
- lib/page-templates.ts
- supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql

## Security / Constraints Preserved
- Administrator-only Studio access at /studio via Supabase Auth + administrators table RLS
- Supabase Row Level Security preserved (draft/published visibility + is_administrator())
- private asset Storage with signed URLs
- signed URLs for published assets
- published-only Portal queries enforced
- draft-only CMS preview (Studio uses fetchAdminSite)
- safe asset replacement (asset ID preserved, storage cleanup on replace, rollback on DB failure)
- Storage/database cleanup on failed uploads (bulk-upload already handled)
- confirmation dialogs for permanent deletion
- partial-failure handling for bulk operations
- no localStorage for CMS content (no sessionStorage for CMS content; sessionStorage removed from new page template flow — now pure React state)
- localStorage only for theme preference (portal.tsx)
- no Figma API, Figma OAuth, runtime plugins, auto-sync
- Figma visuals exported manually as SVG/WebP/PNG and uploaded to Asset Library
- English only, seven categories, current route structure, 41-document content preserved (no destructive migration)
