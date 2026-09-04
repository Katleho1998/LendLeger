-- LendLedger: shared "Capital Pool" setting
-- --------------------------------------------
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Effect:
--   * Adds a `settings` table holding a single shared row (id = 'global') that stores
--     the starting capital amount entered manually on the Profile / Account Settings page.
--   * Every signed-in user can read AND update this row -- it's a shared, team-wide
--     figure (like the shared borrowers/loans), not a per-user value, so unlike
--     borrowers/loans there is no owner-only write restriction here.

create table if not exists public.settings (
  id text primary key default 'global',
  starting_capital numeric not null default 0,
  updated_at timestamptz default now(),
  updated_by uuid references auth.users(id)
);

alter table public.settings enable row level security;

drop policy if exists "settings_select_all_authenticated" on public.settings;
drop policy if exists "settings_insert_all_authenticated" on public.settings;
drop policy if exists "settings_update_all_authenticated" on public.settings;

create policy "settings_select_all_authenticated"
  on public.settings for select
  to authenticated
  using (true);

create policy "settings_insert_all_authenticated"
  on public.settings for insert
  to authenticated
  with check (true);

create policy "settings_update_all_authenticated"
  on public.settings for update
  to authenticated
  using (true)
  with check (true);

-- Seed the single row so the app can upsert/update it right away.
insert into public.settings (id, starting_capital)
values ('global', 0)
on conflict (id) do nothing;
