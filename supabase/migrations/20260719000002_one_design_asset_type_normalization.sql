-- Migration: 20260719000002_one_design_asset_type_normalization.sql
-- Normalizes legacy asset type values so the type check constraint can be added safely.
-- Run this BEFORE 20260719000003_one_design_asset_type_constraint.sql.
-- Idempotent.

-- Map any legacy type values onto the seven approved categories.
update public.assets set type = 'icon' where lower(type) in ('icons', 'icon-set', 'action-icon');
update public.assets set type = 'icon-illustration' where lower(type) in ('icon_illustration', 'iconillustration', 'illustration-icon');
update public.assets set type = 'illustration' where lower(type) in ('illustrations', 'spot-illustration');
update public.assets set type = 'logo' where lower(type) in ('logos', 'brand-logo');
update public.assets set type = 'brand-asset' where lower(type) in ('brand_assets', 'brandassets', 'brand', 'background');
update public.assets set type = 'template' where lower(type) in ('templates', 'ui-template');
update public.assets set type = 'download' where lower(type) in ('downloads', 'file', 'resource');

-- Anything still unmatched becomes 'download' as a safe default.
update public.assets set type = 'download'
where type not in ('icon', 'icon-illustration', 'illustration', 'logo', 'brand-asset', 'template', 'download');
