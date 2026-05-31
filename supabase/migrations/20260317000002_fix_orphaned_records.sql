-- ============================================================
-- Migration: Fix Orphaned Records
-- Purpose: Clean up orphaned records and prevent future orphans
-- ============================================================

-- ─── 1. Remove certificates with deleted students ─────────
DELETE FROM public.certificates
WHERE student_id NOT IN (SELECT id FROM public.profiles)
  AND student_id IS NOT NULL;

-- ─── 2. Remove certificate approvals with deleted certificates ──
DELETE FROM public.certificate_approvals
WHERE certificate_id NOT IN (SELECT id FROM public.certificates);

-- ─── 3. Remove template fields with deleted templates ─────
DELETE FROM public.template_fields
WHERE template_id NOT IN (SELECT id FROM public.certificate_templates);

-- ─── 4. Remove certificate files with deleted certificates ──
-- Only execute if certificate_files table exists
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables 
             WHERE table_name = 'certificate_files' 
             AND table_schema = 'public') THEN
    DELETE FROM public.certificate_files
    WHERE certificate_id NOT IN (SELECT id FROM public.certificates);
  END IF;
END $$;

-- ─── 5. Log cleanup completion ──────────────────────────────
-- These deletions ensure referential integrity across all tables
-- Future cascade delete constraints will prevent new orphans
