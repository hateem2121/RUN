-- Migration 0016: Reclaim Duplicate & Redundant Indexes
-- Drops redundant indexes where a unique constraint or primary index already exists on the same column.

DROP INDEX IF EXISTS public.sessions_expire_idx;
DROP INDEX IF EXISTS public.contacts_email_idx;
DROP INDEX IF EXISTS public.contacts_erpnext_idx;
DROP INDEX IF EXISTS public.legal_policies_slug_idx;
