-- ============================================================
-- Migration: Add Cascade Delete Constraints
-- Purpose: Prevent orphaned records and ensure data integrity
-- ============================================================

-- ─── 1. Add cascade delete for template_fields ─────────────
ALTER TABLE public.template_fields
DROP CONSTRAINT IF EXISTS fk_template_fields_template_id CASCADE;

ALTER TABLE public.template_fields
ADD CONSTRAINT fk_template_fields_template_id
FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id)
ON DELETE CASCADE;

-- ─── 2. Add cascade delete for certificate_files ──────────
ALTER TABLE public.certificate_files
DROP CONSTRAINT IF EXISTS fk_cert_files_cert_id CASCADE;

ALTER TABLE public.certificate_files
ADD CONSTRAINT fk_cert_files_cert_id
FOREIGN KEY (certificate_id) REFERENCES public.certificates(id)
ON DELETE CASCADE;

-- ─── 3. Ensure certificates cascade delete on profile delete ──
ALTER TABLE public.certificates
DROP CONSTRAINT IF EXISTS fk_certificates_student_id CASCADE;

ALTER TABLE public.certificates
ADD CONSTRAINT fk_certificates_student_id
FOREIGN KEY (student_id) REFERENCES public.profiles(id)
ON DELETE CASCADE;

-- ─── 4. Create indexes for better performance ──────────────
CREATE INDEX IF NOT EXISTS idx_template_fields_template_id
ON public.template_fields(template_id);

CREATE INDEX IF NOT EXISTS idx_certificates_student_id_status
ON public.certificates(student_id, status);

CREATE INDEX IF NOT EXISTS idx_certificates_created_at
ON public.certificates(created_at DESC);
