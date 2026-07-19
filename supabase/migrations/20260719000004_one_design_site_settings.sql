-- Migration: 20260719000004_one_design_site_settings.sql
-- Sets the default site settings for One Design branding.
-- Idempotent: re-running updates content to the One Design values.

insert into public.site_settings (id, content)
values (
  'default',
  '{
    "name": "One Design",
    "tagline": "Design with clarity.",
    "description": "One place to find foundations, components, patterns, and assets that help designers create consistent experiences.",
    "visibility": "unlisted"
  }'::jsonb
)
on conflict (id)
do update set
  content = excluded.content,
  updated_at = now();
