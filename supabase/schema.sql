-- Production persistence baseline for One Design.
-- Run this file in the Supabase SQL editor before deploying the portal.
-- It is idempotent: each statement can be re-run safely.

create extension if not exists "pgcrypto";

create type public.content_status as enum ('draft', 'published', 'archived');

create table if not exists public.administrators (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create table if not exists public.pages (
  id uuid primary key default gen_random_uuid(),
  type text not null check (type in ('design','foundation','component','pattern','resource')),
  title text not null,
  slug text not null unique,
  summary text not null default '',
  category text not null default 'General',
  status public.content_status not null default 'draft',
  maturity text not null default 'experimental',
  version text not null default '1.0',
  owner text not null default 'Design System Team',
  figma_url text,
  featured boolean not null default false,
  content jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(),
  type text not null,
  name text not null,
  slug text not null unique,
  category text not null default 'General',
  brand text not null default 'Shared',
  status public.content_status not null default 'draft',
  description text not null default '',
  keywords text[] not null default '{}',
  metadata jsonb not null default '{}'::jsonb,
  version text not null default '1.0',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.releases (
  id uuid primary key default gen_random_uuid(),
  version text not null,
  title text not null,
  summary text not null default '',
  status public.content_status not null default 'draft',
  changes jsonb not null default '[]'::jsonb,
  release_date date,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.token_imports (
  id uuid primary key default gen_random_uuid(),
  file_name text not null,
  source_json jsonb not null,
  summary jsonb not null default '{}'::jsonb,
  status public.content_status not null default 'draft',
  created_at timestamptz not null default now(),
  published_at timestamptz
);

create table if not exists public.site_settings (
  id text primary key default 'default',
  content jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.pages enable row level security;
alter table public.assets enable row level security;
alter table public.releases enable row level security;
alter table public.token_imports enable row level security;
alter table public.site_settings enable row level security;
alter table public.administrators enable row level security;

create or replace function public.is_administrator()
returns boolean language sql stable security definer set search_path = public
as $$ select exists(select 1 from public.administrators where user_id = auth.uid()) $$;

drop policy if exists "Published pages are visible" on public.pages;
drop policy if exists "Published assets are visible" on public.assets;
drop policy if exists "Published releases are visible" on public.releases;
drop policy if exists "Published token imports are visible" on public.token_imports;
drop policy if exists "Settings are visible" on public.site_settings;
drop policy if exists "Administrators manage pages" on public.pages;
drop policy if exists "Administrators manage assets" on public.assets;
drop policy if exists "Administrators manage releases" on public.releases;
drop policy if exists "Administrators manage tokens" on public.token_imports;
drop policy if exists "Administrators manage settings" on public.site_settings;
drop policy if exists "Administrators read administrators" on public.administrators;
drop policy if exists "Administrators manage administrators" on public.administrators;

create policy "Published pages are visible" on public.pages for select using (status = 'published' or public.is_administrator());
create policy "Published assets are visible" on public.assets for select using (status = 'published' or public.is_administrator());
create policy "Published releases are visible" on public.releases for select using (status = 'published' or public.is_administrator());
create policy "Published token imports are visible" on public.token_imports for select using (status = 'published' or public.is_administrator());
create policy "Settings are visible" on public.site_settings for select using (true);

create policy "Administrators manage pages" on public.pages for all using (public.is_administrator()) with check (public.is_administrator());
create policy "Administrators manage assets" on public.assets for all using (public.is_administrator()) with check (public.is_administrator());
create policy "Administrators manage releases" on public.releases for all using (public.is_administrator()) with check (public.is_administrator());
create policy "Administrators manage tokens" on public.token_imports for all using (public.is_administrator()) with check (public.is_administrator());
create policy "Administrators manage settings" on public.site_settings for all using (public.is_administrator()) with check (public.is_administrator());
create policy "Administrators read administrators" on public.administrators for select using (public.is_administrator());
create policy "Administrators manage administrators" on public.administrators for all using (public.is_administrator()) with check (public.is_administrator());

insert into storage.buckets (id, name, public) values ('design-system-assets','design-system-assets',true)
on conflict (id) do nothing;

drop policy if exists "Published assets can be viewed" on storage.objects;
drop policy if exists "Administrators upload assets" on storage.objects;
drop policy if exists "Administrators update assets" on storage.objects;
drop policy if exists "Administrators delete assets" on storage.objects;

create policy "Published assets can be viewed" on storage.objects for select using (bucket_id = 'design-system-assets');
create policy "Administrators upload assets" on storage.objects for insert with check (bucket_id = 'design-system-assets' and public.is_administrator());
create policy "Administrators update assets" on storage.objects for update using (bucket_id = 'design-system-assets' and public.is_administrator());
create policy "Administrators delete assets" on storage.objects for delete using (bucket_id = 'design-system-assets' and public.is_administrator());

-- Default site settings for One Design.
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
