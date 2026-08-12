-- LendLedger: shared read, owner-only write
-- ------------------------------------------
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Effect:
--   * Every signed-in user can SELECT (view) every borrower, loan, and audit log,
--     regardless of who created it.
--   * Only the user who created a row (user_id = auth.uid()) can INSERT/UPDATE/DELETE it.
--
-- IMPORTANT FIRST STEP:
-- Your project almost certainly already has policies that restrict SELECT to the
-- owner (e.g. "Users can view own borrowers" using auth.uid() = user_id). Those
-- policies will still apply *in addition* to the ones below (Postgres RLS policies
-- are OR'd together per command), so old owner-only SELECT policies won't block
-- the new shared one -- but check Database -> Policies in the dashboard and remove
-- any duplicate/conflicting policy names if `create policy` below errors out with
-- "policy already exists". Adjust the `drop policy if exists` names to match yours.

-- =========================
-- BORROWERS
-- =========================
alter table public.borrowers enable row level security;

drop policy if exists "borrowers_select_all_authenticated" on public.borrowers;
drop policy if exists "borrowers_insert_own" on public.borrowers;
drop policy if exists "borrowers_update_own" on public.borrowers;
drop policy if exists "borrowers_delete_own" on public.borrowers;

create policy "borrowers_select_all_authenticated"
  on public.borrowers for select
  to authenticated
  using (true);

create policy "borrowers_insert_own"
  on public.borrowers for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "borrowers_update_own"
  on public.borrowers for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "borrowers_delete_own"
  on public.borrowers for delete
  to authenticated
  using (auth.uid() = user_id);

-- =========================
-- LOANS
-- =========================
alter table public.loans enable row level security;

drop policy if exists "loans_select_all_authenticated" on public.loans;
drop policy if exists "loans_insert_own" on public.loans;
drop policy if exists "loans_update_own" on public.loans;
drop policy if exists "loans_delete_own" on public.loans;

create policy "loans_select_all_authenticated"
  on public.loans for select
  to authenticated
  using (true);

create policy "loans_insert_own"
  on public.loans for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "loans_update_own"
  on public.loans for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "loans_delete_own"
  on public.loans for delete
  to authenticated
  using (auth.uid() = user_id);

-- =========================
-- AUDIT_LOGS
-- (shared read so the audit trail shows everyone's actions; each user can only
-- write their own log entries; logs are treated as immutable, so no update/delete policy)
-- =========================
alter table public.audit_logs enable row level security;

drop policy if exists "audit_logs_select_all_authenticated" on public.audit_logs;
drop policy if exists "audit_logs_insert_own" on public.audit_logs;

create policy "audit_logs_select_all_authenticated"
  on public.audit_logs for select
  to authenticated
  using (true);

create policy "audit_logs_insert_own"
  on public.audit_logs for insert
  to authenticated
  with check (auth.uid() = user_id);

-- =========================
-- PROFILES
-- (shared read so a loan/borrower's "Created by" name resolves for every user;
-- each user can still only insert/update their OWN profile row - that existing
-- policy is left alone, we're only adding the missing shared-read policy)
-- =========================
alter table public.profiles enable row level security;

drop policy if exists "profiles_select_all_authenticated" on public.profiles;

create policy "profiles_select_all_authenticated"
  on public.profiles for select
  to authenticated
  using (true);
