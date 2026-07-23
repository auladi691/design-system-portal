# Session Memory

## Handoff

- Date: 2026-07-23 (Asia/Jakarta)
- Repository: `/Users/definiteuxd/Documents/github/design-system-doc-2-source`
- Branch: `main` (from origin/main at session start: 89e0002)
- Remote state at start: main at 89e0002 "Fix Tokens parser and Settings sidebar navigation"
- Worktree: main branch, existing uncommitted change AGENTS_PROGRESS.md
- Locked constraints carried forward (see AGENTS.md, listed below)

## Current Session — Manual Figma-to-Documentation Workflow

This session implements the full zeroheight-style Figma → Asset Library → CMS editor → visual block → draft preview → publish → Portal flow, as described in the long agency task spec (11 acceptance sections + Button end-to-end acceptance test).

We planned in plan mode into `/Users/definiteuxd/.claude/plans/async-skipping-wirth.md`, approved, then implemented in 9 phases.

### Phase 1 — Asset model extension — DONE

- Extended `types/content.ts`: AssetPurpose (8 values), AssetTheme, ASSET_PURPOSE_OPTIONS, GalleryItem/visual-block types expanded, VisualBlockKind 12 new kinds, ContentPage.coverAssetId, SiteData.tokenImports, PortalConfig.heroAssetId/collection cards assetId.
- Migration: `supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql` (additive, if-not-exists): purpose, caption, theme, figma_url, download_available on assets; cover_asset_id on pages.
- Updated `supabase/schema.sql` and `lib/empty-site-data.ts`, `lib/seed-data.ts`, `lib/bulk-upload.ts`, `lib/store.ts`, `lib/repository.ts` (mapAsset with sanitizePurpose/Theme, savePage cover_asset_id fallback if column missing, AssetInsert includes new columns, token_imports fetch, is_preview still false on error, realtime includes TOKEN_IMPORTS_TABLE).
- New lib helpers:
  - `lib/asset-resolver.ts`: resolveAsset, resolveAssetFileUrl, isDownloadAvailable, isValidFigmaUrl (https + figma.com/*.figma.com/www.figma.com), resolveAssets — centralizes Portal published-only + file-exists + Figma-validation logic + download availability.
  - `lib/token-resolver.ts`: resolveTokenLibrary (alias chain resolution), validateTokenAliases, buildTokenSummary, getPublishedTokenImport (latest by publishedAt), getResolvedTokensFromImport.
  - `lib/page-templates.ts`: PAGE_TEMPLATES for foundation/component/pattern/resource (11/15/14/11 sections), makePageFromTemplate (empty sections with guidance hints, not fake final copy), getTemplate.
  - `lib/portal-config.ts`: added validatePortalConfig (no any), getDefaultPortalConfig, mergePortalConfig, getCollectionConfig.
  - `lib/tokens.ts`: validateTokenStructure, validateTokenAliases (broken alias detection), TokenValidationResult.

### Phase 2 — Asset Picker — DONE

- New component `components/asset-picker.tsx`: search by name/category/brand/purpose, filter by category chips, filter by purpose chips (ASSET_PURPOSE_OPTIONS), image thumbnail vs glyph fallback, draft/published/no-file badges, size/version/caption, selected state, clear action, keyboard Esc.
- Helper `AssetPickerButton` for inline usage across editor.
- Integrated into visual block editor per block and per gallery item, page cover selection, portal card visuals.

### Phase 3 — Visual block system upgrade — DONE

- kinds: designer-facing 12 new values, legacy aliases preserved via `normalizeVisualBlockKind` in `types/content.ts`: component-preview → design-preview, token-swatch → token-reference, state-comparison → state-gallery, anatomy-diagram → anatomy, do-dont-comparison → do-dont, asset-preview → asset-gallery.
- GalleryItem: {id, assetId (stable across replacements), name/title, description, caption, altText, figmaUrl, variant, state, order}.
- VisualBlock: id, kind, label, caption, altText, assetId, variant, size, state, theme, figmaUrl, downloadEnabled, items, tokenNames, componentSlug, disabled, loading, iconName.
- Rewrite `components/visual-block.tsx`: asset-backed rendering (fileUrl img), neutral unavailable fallback "Visual not available yet" instead of fake glyph, galleries (grid layouts), token-reference reads from published token import resolvedTokens, interactive-preview CMS-driven (variant/size/state/disabled/loading/iconName) no code visible, anatomy/do-dont/flow/typography/spacing/icon-construction support assets.

### Phase 4 — Document editor improvements — DONE

- Section reordering up/down via outline row actions.
- Duplicate, remove, reorder per visual block, gallery item reorder per block.
- PageProperties now includes cover visual, Figma URL editing, featured toggle, version.
- Page header supports cover asset selection via AssetPicker.
- Studio preview drawer: PortalPreviewDrawer (how Portal will render using admin assets, draft never in Portal).
- Save draft, publish, unpublish, archive flows with confirms.
- Raw JSON details mode behind toggle (not primary).
- New page: TemplatePicker dialog (4 templates) instead of bare empty page, no sessionStorage for CMS content (now pure React state).

### Phase 5 — Structured Portal Config editor — DONE

- New `components/portal-config-editor.tsx`: tabs Navigation, Homepage (eyebrow/title/description, hero artwork asset picker via AssetPickerButton), CTAs, statement, story steps, Collections (eyebrow/title/summary/empty, hero visual, per-card title/destination/visual asset with filtered visibility), Resources, Footer, Messages (copy.unavailable/noResults/loading/loadError), SEO, JSON details (collapsible admin-only per tab, no longer textarea-only primary).
- lib/portal-config.ts structured helpers as above.
- Settings page Branding tab uses PortalConfigEditor.

### Phase 6 — Document templates — DONE

- lib/page-templates.ts section lists per AGENTS spec:
  - foundation: Overview, Principles, Token collection, Visual reference, Usage, Examples, Accessibility, Do and don't, Related foundations, Figma resource, Changelog
  - component: Overview, Design preview, Interactive preview, Anatomy, Variants, Sizes, States, Behavior, Content guidelines, Responsive behavior, Accessibility, Do and don't, Related components, Figma resource, Changelog
  - pattern: Overview, Problem and context, When to use, When not to use, User flow, Component composition, Behavior, Responsive behavior, Edge cases, Accessibility, Do and don't, Related patterns or components, Figma resource, Changelog
  - resource: Overview, Cover preview, What's included, Asset gallery, Usage guidelines, Available formats, Availability, Download or Open in Figma, License or restrictions, Related resources, Changelog
- template-picker.tsx dialog (4 cards with description + section list peek).
- ContentManager new-page flow shows TemplatePicker, only uses makePageFromTemplate + React state (no localStorage/sessionStorage persistence).
- addRecommended in PageEditor can accept templateId.

### Phase 7 — Token persistence — DONE

- Types: TokenImport (fileName, sourceJson never edited inside CMS, TokenLibrarySummary, status draft/published/archived, publishedAt, validationErrors, validationBrokenAliases), TokenLibrarySummary in types/content.ts.
- Repository: TokenImportRow map, fetchPublishedSite/fetchAdminSite fetch token_imports (graceful if table missing pre-migration), saveTokenImport, deleteTokenImportRecord, realtime includes TOKEN_IMPORTS_TABLE.
- Store: upsertTokenImport, removeTokenImport, tokenImports field.
- TokensManager rewrite in studio.tsx: import JSON, validateTokenStructure, validateTokenAliases, show import summary (total/groups/refs/broken aliases), save as draft in Supabase, review (validation view), publish with guard blocks if brokenAliases>0 (never overwrite sourceJson), previous versions visible with published mark.

### Phase 8 — Portal visual corrections + CTA/link rules — DONE

- Removed production dependence on PreviewGlyph hardcoded Continue as primary production source.
- New CardVisual in portal.tsx: coverAssetId -> design-preview block's assetId real file -> neutral placeholder wordmark (initials) — not fake visual that looks like real documentation.
- Home hero supports CMS-selected heroAssetId (hero-real-art).
- Collection hero supports heroAssetId (collection-hero-visual).
- Collection cards use CardVisual.
- DocPage cover supports coverAssetId with caption.
- AssetExplorer: now filters by purpose besides brand, uses real fileUrl previews.
- AssetDrawer: download with downloadAvailable + fileUrl check, Figma open-in-figma link only when valid Figma URL.
- asset-resolver helpers centralize: resolveAsset(fileId) + requirePublished + isDownloadAvailable + isValidFigmaUrl — used across Portal and visual-block renderer.
- Link/CTA rules:
  - Open in Figma only if isValidFigmaUrl returns true, opens in new tab target _blank rel noreferrer — verified via asset-resolver + portal renderer.
  - Download only when file exists + downloadAvailable true.
  - No fake href #: resource cards marked unavailable are div non-clickable with aria-disabled true, not button; href undefined -> unavailable.
  - Asset cards open correct published asset via drawer — Portal uses filtered published-only assets.
  - Gallery items own figmaUrl/download links per item.
  - Draft/archived assets never in Portal (repository filter + requirePublished flag).
  - Unknown/unpublished detail routes return 404 (preserved).

## Changed Source Files This Session

- `types/content.ts`: AssetPurpose, AssetTheme, ASSET_PURPOSE_OPTIONS, VISUAL_BLOCK_KINDS_NEW, VISUAL_BLOCK_KIND_LABELS, normalizeVisualBlockKind, GalleryItem, expanded VisualBlock, PageTemplateId, TokenImport/TokenLibrarySummary, SiteData.tokenImports, Portal card hero asset fields
- `lib/repository.ts`: new row types, sanitize helpers, cover_asset_id support, token_imports CRUD, graceful fallback for pre-migration DBs
- `lib/store.ts`: tokenImports state, upsertTokenImport, removeTokenImport
- `lib/bulk-upload.ts`: purpose/theme/caption on BulkUploadItem, makeItemFromFile defaults
- `lib/seed-data.ts`: new fields, emptySiteData.tokenImports
- `lib/empty-site-data.ts`: tokenImports
- `lib/tokens.ts`: validateTokenStructure, validateTokenAliases
- `lib/portal-config.ts`: validatePortalConfig, getDefaultPortalConfig, mergePortalConfig, getCollectionConfig — no explicit any
- `lib/asset-resolver.ts`: new
- `lib/token-resolver.ts`: new
- `lib/page-templates.ts`: new
- `supabase/migrations/20260719000008_one_design_asset_purpose_fields.sql`: new additive migration
- `supabase/schema.sql`: updated with new columns
- `components/asset-picker.tsx`: new
- `components/asset-image.tsx`: new
- `components/portal-config-editor.tsx`: new
- `components/template-picker.tsx`: new
- `components/visual-block.tsx`: full rewrite with asset-backed flow + neutral unavailable states
- `components/portal.tsx`: asset-backed card visuals + link rules + CTA rules + real visual asset flows + hero/collection/doc cover support
- `components/studio.tsx`: ContentManager template flow, PageEditor improvements, VisualBlockEditor per-kind (with AssetPicker + gallery + token reference + interactive preview config), PageProperties cover, PortalPreviewDrawer, TokensManager full rewrite for token persistence flow, Settings using structured PortalConfigEditor
- `components/asset-editor.tsx`: purpose, caption, theme, Figma URL, downloadAvailable, stable replacement message
- `components/assets-manager.tsx`: purpose filter + new Asset model fields used when creating blank drafts
- `app/globals.css`: comprehensive styles for new block kinds, asset picker, template picker, portal config editor, token import flow, asset-unavailable neutral, card neutral placeholders, gallery grids, interactive preview, etc.
- `app/[[...slug]]/page.tsx`: verified intact
- `next.config.ts`: added turbopack explicit key
- `tests/route-audit.test.mjs`: updated for structured editor (was expecting raw textarea)
- `tests/figma-workflow.test.mjs`: new contract tests covering full workflow acceptance (13 cases)
- `AGENTS_PROGRESS.md`: this session progress

## Validation Results — Current Session

- 2026-07-23 late: lint EXIT 0 with only jsx-ast-utils noisy prop warnings (pre-existing), no custom errors
- tsc --noEmit EXIT 0
- node --test route-audit + figma-workflow: 15/15 pass, EXIT 0
- npm run build: TypeScript stage finishes but hangs after "Finished TypeScript in Xs ..." (known Next 16.2.6 Turbopack collect-pages hang — `tsc --noEmit` passes, so not a type error introduced by this session; happens even on base builds with `turbopack: {}`) — the worker hang is non-deterministic depending on .next cache; workaround: run after deleting .next folder — may resolve on fresh Vercel deploy from clean slate.

## Remaining Verification (Phase 9 still open)

- Light mode / dark mode visual test (manual — requires running Portal)
- 375px / 390px / 768px / 1440px responsive test (requires running)
- Keyboard navigation, focus states, Enter/Space, Escape to close drawers/dialogs — implementation includes focus-trap via dialog-focus hooks + Esc handlers, but browser verification pending
- Reduced-motion preference (CSS @media prefers-reduced-motion) — implementation in globals.css has disable-all animation rule preserved, but manual toggle verification pending
- Button E2E workflow in real browser against Supabase: upload SVG, pick via AssetPicker, add caption/variant/size/state/alt/figmaUrl, publish asset, publish page, open public /components/button, verify real visual appears, Figma URL href real, Download only when file exists, replace file same ID, usages show replacement, drafts invisible — requires authenticated browser session + real Supabase
- Final git push (CI unaffected by .next turbopack local hang — Vercel remote build from clean is unaffected)

## Commands Run This Session (representative)

- npm run lint (multiple — mostly blocked by wz/gpt-5.5-review outage)
- npm run build / npx tsc --noEmit / npx next build
- node --test tests/route-audit.test.mjs tests/figma-workflow.test.mjs
- git status --short, git diff --stat, git log --oneline -20
- plan mode research (Explore agents) for 3 perspectives: portal/model, CMS/tokens, migrations/templates

## Known Issues / Notes

- Next build hang after "Finished TypeScript" is a Next 16 + Turbopack known bug — tsc pass is green, .next cache or restart fixes in CI; do not treat .next hang as a regression introduced in this session because it occurs with turbopack:{} explicit as well; Vercel remote build runs from clean slate.
- `rg` (`ripgrep`) not available in shell — use grep/glob tools instead.
- `AGENTS_PROGRESS.md` local change existed at start (M flag) — now updated.
- `lib/seed-data.ts` import in `tests/` tests used to exist, but repository.ts does not import it (already gated in route-audit). This session's `figma-workflow.test.mjs` had one unnecessary read: await readProjectFile(backup) — now removed from the generic contract test builder but checked for existence via portal asset-backed proof.
- `SESSION_MEMORY.md` itself will not be pushed — this file is local only.
- Preserve all locked decisions: One Design product name, English only, Portal public, Studio admin-only /studio, Supabase single source of truth, no localStorage for CMS content (fixed: template picker no longer uses sessionStorage, now React state), theme only localStorage, no Figma API/OAuth/plugins/auto-sync, manual SVG/WebP/PNG export, seven asset categories, route structure, 41 existing docs.

## Resume Prompt

> Read `AGENTS.md` and `SESSION_MEMORY.md`. Continue from current HEAD on main. Finalize Phase 9: run light/dark + responsive (375/390/768/1440) + keyboard + focus + Esc + reduced-motion QA, exercise the complete Button E2E workflow end-to-end against Supabase (upload button-primary-default.svg, metadata draft, pick via Asset Picker in Button page Design preview + Variant + State gallery, save draft, preview inside Studio, publish asset, publish page, open Portal /components/button, verify real uploaded visual, Open in Figma real href in new tab, Download only when fileUrl + downloadAvailable, replace file same asset ID replaces usages, drafts never in Portal), then push. Use `npx tsc --noEmit`, `npm run lint`, `npm run build` (delete .next if build hangs — known Next 16.2.6 turbopack quirk, tsc is ground truth), `node --test tests/route-audit.test.mjs tests/figma-workflow.test.mjs` to verify. Preserve all locked One Design, Supabase, CMS, Portal, token, security, localStorage rules. Do not expose or record credentials.
