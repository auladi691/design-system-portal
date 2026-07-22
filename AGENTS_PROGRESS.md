# CMS-Driven Portal Content Migration — Complete

## Done
- `PortalConfig` + related types in `types/content.ts`
- `site_settings.content` maps `seo` + `portal` in `lib/repository.ts`
- `lib/portal-config.ts` parse/format helpers
- Studio Settings: SEO fields + Portal Config JSON editor
- Portal reads CMS when present, keeps hardcoded fallbacks until config saved:
  - navigation, footer
  - home hero / CTAs / statement / story steps
  - collection heroes + empty states (foundations, components, design, patterns)
  - resources cards + empty state
  - public copy (loadError, noResults, unavailable)
- Tests updated + new portal-config contract test
- `npm test` green (lint, build, 4 tests)

## Still blocked (ops, not code)
- Authenticated Studio browser verification (no Playwright auth state)
- Production CMS content entry for `portal` JSON
- Verify 41 existing documents via Studio UI

## How to populate production
1. Studio → Settings → paste valid Portal Config JSON
2. Save (writes whole blob to `site_settings.content`)
3. Portal uses CMS values; fallbacks only when `portal` missing

## Key files
- `types/content.ts`
- `lib/portal-config.ts`
- `lib/repository.ts`
- `lib/empty-site-data.ts`
- `components/portal.tsx`
- `components/studio.tsx`
- `tests/route-audit.test.mjs`
