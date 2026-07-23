-- Extend asset model for manual Figma-to-documentation workflow
-- Backward-compatible, idempotent

alter table public.assets
  add column if not exists purpose text not null default 'general-asset',
  add column if not exists caption text not null default '',
  add column if not exists theme text not null default 'both',
  add column if not exists figma_url text,
  add column if not exists download_available boolean not null default true;

-- Page cover asset reference for CMS-selected cover/thumbnail
alter table public.pages
  add column if not exists cover_asset_id uuid;

-- Ensure token_imports has the latest column naming used by schema.sql
-- The base schema already created token_imports, this covers missing summary shape if pre-existing
-- No destructive alter — only additive, already idempotent via base schema handling
