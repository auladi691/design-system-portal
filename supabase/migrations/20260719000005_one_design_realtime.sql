-- Migration: 20260719000005_one_design_realtime.sql
-- Enables Realtime publication for the tables the CMS and Portal listen to.
-- Idempotent: skips tables already in the publication.

do $$ begin
  alter publication supabase_realtime add table public.pages;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.assets;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.releases;
exception when duplicate_object then null;
end $$;

do $$ begin
  alter publication supabase_realtime add table public.site_settings;
exception when duplicate_object then null;
end $$;
