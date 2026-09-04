-- LendLedger: loan write-off / bad debt columns
-- ------------------------------------------------
-- Run this in your Supabase project's SQL Editor (Dashboard -> SQL Editor -> New query).
--
-- Effect:
--   * Adds columns to `loans` so a loan can be closed as a loss ("Write Off") while
--     recording exactly how much was lost, when, and why -- used by the new
--     "Close & Write Off" action and the Write-Offs / Bad Debt report.
--   * No RLS changes needed: writes still go through the existing owner-only
--     update policy on `loans`.

alter table public.loans
  add column if not exists write_off_amount numeric,
  add column if not exists write_off_date timestamptz,
  add column if not exists write_off_reason text;
