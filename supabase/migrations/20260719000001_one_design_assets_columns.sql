-- Migration: 20260719000001_one_design_assets_columns.sql
-- Adds storage-related columns to public.assets so the CMS can track
-- the file that was uploaded to Supabase Storage. Idempotent.

alter table public.assets
  add column if not exists file_path text,
  add column if not exists file_url text,
  add column if not exists mime_type text,
  add column if not exists file_size bigint,
  add column if not exists original_file_name text,
  add column if not exists alt_text text not null default '';

-- Backfill created_at where missing so created date is always available.
update public.assets
set created_at = now()
where created_at is null;
