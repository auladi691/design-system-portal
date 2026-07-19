-- Migration: 20260719000005_one_design_realtime.sql
-- Enables Realtime publication for the tables the CMS and Portal listen to.
-- Idempotent.

alter publication supabase_realtime add table public.pages;
alter publication supabase_realtime add table public.assets;
alter publication supabase_realtime add table public.releases;
alter publication supabase_realtime add table public.site_settings;
