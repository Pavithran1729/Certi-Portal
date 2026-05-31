-- ============================================================
-- Migration: Input Validation Enforcement
-- Purpose: Add constraints to prevent invalid data entry
-- ============================================================

-- ─── 1. Add NOT NULL constraints where missing ─────────────
ALTER TABLE public.certificates
ALTER COLUMN certificate_type SET NOT NULL,
ALTER COLUMN status SET NOT NULL,
ALTER COLUMN student_id SET NOT NULL,
ALTER COLUMN created_at SET NOT NULL;

-- ─── 2. Add CHECK constraints for status values ───────────
ALTER TABLE public.certificates
ADD CONSTRAINT check_certificate_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- ─── 3. Add CHECK constraint for certificate_approvals status ──
ALTER TABLE public.certificate_approvals
ADD CONSTRAINT check_approval_status 
CHECK (status IN ('pending', 'approved', 'rejected'));

-- ─── 4. Ensure approval_order is positive ──────────────────
ALTER TABLE public.template_approval_chain
ADD CONSTRAINT check_approval_order 
CHECK (approval_order > 0);

-- ─── 5. Validate email format in authority_profiles ────────
-- Note: Consider adding email validation in application layer
-- PostgreSQL email validation is limited but we can add basic checks
ALTER TABLE public.authority_profiles
ADD CONSTRAINT check_display_name_not_empty 
CHECK (TRIM(display_name) <> '');

-- ─── 6. Add created_at defaults for audit trail ───────────
ALTER TABLE public.certificate_approvals
ALTER COLUMN created_at SET DEFAULT now();

ALTER TABLE public.template_approval_chain
ALTER COLUMN created_at SET DEFAULT now();
