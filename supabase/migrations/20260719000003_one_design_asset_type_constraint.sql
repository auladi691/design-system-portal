-- Migration: 20260719000003_one_design_asset_type_constraint.sql
-- Adds a check constraint on public.assets.type so only the seven approved
-- categories can be stored. Run AFTER the normalization migration.
-- Idempotent.

drop constraint if exists assets_type_check on public.assets;

alter table public.assets
  add constraint assets_type_check
  check (type in ('icon', 'icon-illustration', 'illustration', 'logo', 'brand-asset', 'template', 'download'));
