-- Migration: 20260719000010_one_design_internal_component_preview.sql
-- Fixes component-preview workflow for production:
-- 1. Ensures visibility, purpose, and file columns exist (idempotent)
-- 2. Allows internal asset type 'component-preview' without requiring fake public category
-- 3. Preserves 7 public categories for Portal, adds internal type as 8th allowed for Studio
-- Idempotent.

-- Ensure columns exist (may be missing if earlier migrations not run or PostgREST cache stale)
alter table public.assets
  add column if not exists purpose text not null default 'general-asset',
  add column if not exists visibility text not null default 'public',
  add column if not exists caption text not null default '',
  add column if not exists theme text not null default 'both',
  add column if not exists figma_url text,
  add column if not exists download_available boolean not null default true,
  add column if not exists file_path text,
  add column if not exists file_url text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists original_file_name text,
  add column if not exists alt_text text not null default '';

-- Backfill visibility for existing component-preview purpose
update public.assets
set visibility = 'internal'
where purpose = 'component-preview'
  and (visibility is null or visibility <> 'internal');

update public.assets
set visibility = 'public'
where visibility is null
   or visibility not in ('public', 'internal');

-- Update type constraint to allow internal component-preview type
-- Public categories remain exactly 7 for Portal: icon, icon-illustration, illustration, logo, brand-asset, template, download
-- Internal type is 8th allowed for Studio only, never exposed as public route
alter table public.assets
  drop constraint if exists assets_type_check;

alter table public.assets
  add constraint assets_type_check
  check (type in ('icon', 'icon-illustration', 'illustration', 'logo', 'brand-asset', 'template', 'download', 'component-preview'));

-- Ensure storage bucket exists and policies remain
insert into storage.buckets (id, name, public) values ('design-system-assets','design-system-assets',false)
on conflict (id) do nothing;

update storage.buckets
set public = false
where id = 'design-system-assets';

-- Refresh PostgREST schema cache is automatic on DDL, but ensure policies allow admin to manage internal assets
-- Existing policies already use is_administrator() for all operations, which covers internal assets

-- Optional: notify PostgREST to reload schema (Supabase handles automatically, but include for safety)
-- notifies are not required in hosted Supabase, DDL triggers reload

-- No destructive data rewrite
