-- Internal visibility for Component preview assets
-- Component preview is internal-only: Studio + doc blocks, not public Explorer
-- Backward-compatible, idempotent

alter table public.assets
  add column if not exists visibility text not null default 'public';

-- Backfill: component-preview purpose is always internal
update public.assets
set visibility = 'internal'
where purpose = 'component-preview';

-- Ensure non-null valid values
update public.assets
set visibility = 'public'
where visibility is null
   or visibility not in ('public', 'internal');

-- Constraint for future inserts (soft, via default handling in app - DB check optional)
-- We keep it permissive to avoid breaking existing data, but default to public

