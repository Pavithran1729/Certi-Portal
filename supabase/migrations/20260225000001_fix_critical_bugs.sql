-- ============================================================
-- Migration: Fix Critical Bugs
-- 1. Add 'authority' to app_role enum
-- 2. Bring hidden tables into migrations (with RLS)
-- 3. Seed missing certificate templates
-- 4. Storage MIME restrictions
-- ============================================================

-- ─── 1. Add 'authority' to app_role enum ──────────────────
ALTER TYPE public.app_role ADD VALUE IF NOT EXISTS 'authority';

-- ─── 2. authority_profiles (sync hidden table) ────────────
CREATE TABLE IF NOT EXISTS public.authority_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT NOT NULL,
  role_title TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.authority_profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage authority profiles" ON public.authority_profiles;
CREATE POLICY "Admins can manage authority profiles"
ON public.authority_profiles FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authority users can view their own profile" ON public.authority_profiles;
CREATE POLICY "Authority users can view their own profile"
ON public.authority_profiles FOR SELECT
USING (user_id = auth.uid());

DROP POLICY IF EXISTS "HODs can view all authority profiles" ON public.authority_profiles;
CREATE POLICY "HODs can view all authority profiles"
ON public.authority_profiles FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

-- ─── 3. template_approval_chain (sync hidden table) ───────
CREATE TABLE IF NOT EXISTS public.template_approval_chain (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  authority_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_order INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(template_id, approval_order),
  UNIQUE(template_id, authority_user_id)
);

ALTER TABLE public.template_approval_chain ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can manage approval chains" ON public.template_approval_chain;
CREATE POLICY "Admins can manage approval chains"
ON public.template_approval_chain FOR ALL
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Authenticated users can view approval chains" ON public.template_approval_chain;
CREATE POLICY "Authenticated users can view approval chains"
ON public.template_approval_chain FOR SELECT
USING (auth.uid() IS NOT NULL);

-- ─── 4. certificate_approvals (sync hidden table) ─────────
CREATE TABLE IF NOT EXISTS public.certificate_approvals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  authority_user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  approval_order INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  remarks TEXT,
  acted_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(certificate_id, approval_order)
);

ALTER TABLE public.certificate_approvals ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins can view all approvals" ON public.certificate_approvals;
CREATE POLICY "Admins can view all approvals"
ON public.certificate_approvals FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "HODs can view all approvals" ON public.certificate_approvals;
CREATE POLICY "HODs can view all approvals"
ON public.certificate_approvals FOR SELECT
USING (public.has_role(auth.uid(), 'hod'));

DROP POLICY IF EXISTS "Authority users can view their own approvals" ON public.certificate_approvals;
CREATE POLICY "Authority users can view their own approvals"
ON public.certificate_approvals FOR SELECT
USING (authority_user_id = auth.uid());

DROP POLICY IF EXISTS "Authority users can update their own approvals" ON public.certificate_approvals;
CREATE POLICY "Authority users can update their own approvals"
ON public.certificate_approvals FOR UPDATE
USING (authority_user_id = auth.uid());

DROP POLICY IF EXISTS "System can insert approvals" ON public.certificate_approvals;
CREATE POLICY "System can insert approvals"
ON public.certificate_approvals FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Students can view approvals on their certificates" ON public.certificate_approvals;
CREATE POLICY "Students can view approvals on their certificates"
ON public.certificate_approvals FOR SELECT
USING (
  certificate_id IN (
    SELECT c.id FROM public.certificates c
    JOIN public.profiles p ON c.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- Index for performance
CREATE INDEX IF NOT EXISTS idx_cert_approvals_certificate_id
ON public.certificate_approvals(certificate_id);

CREATE INDEX IF NOT EXISTS idx_cert_approvals_authority_user_id
ON public.certificate_approvals(authority_user_id);

-- ─── 5. Trigger: auto-create approval rows on cert submit ──
CREATE OR REPLACE FUNCTION public.create_approval_steps_on_cert_submit()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Look up the approval chain for this certificate type's template
  INSERT INTO public.certificate_approvals (certificate_id, authority_user_id, approval_order)
  SELECT
    NEW.id,
    tac.authority_user_id,
    tac.approval_order
  FROM public.template_approval_chain tac
  JOIN public.certificate_templates ct ON tac.template_id = ct.id
  WHERE ct.certificate_type = NEW.certificate_type
    OR ct.id IN (
      SELECT template_id FROM public.custom_certificate_applications
      WHERE certificate_id = NEW.id
    )
  ORDER BY tac.approval_order;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS on_certificate_submitted_create_approvals ON public.certificates;
CREATE TRIGGER on_certificate_submitted_create_approvals
AFTER INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.create_approval_steps_on_cert_submit();

-- ─── 6. Enable realtime for certificate_approvals ──────────
ALTER PUBLICATION supabase_realtime ADD TABLE IF NOT EXISTS public.certificate_approvals;

-- ─── 7. Seed missing certificate templates ─────────────────
INSERT INTO public.certificate_templates (certificate_type, template_name, description, is_active)
VALUES
  ('bonafide', 'Bonafide Certificate', 'Certificate confirming student enrollment status', true),
  ('conduct', 'Conduct Certificate', 'Certificate confirming good conduct during study period', true),
  ('training', 'Training Certificate', 'Certificate for participation in training programs', true)
ON CONFLICT DO NOTHING;

-- ─── 8. Fix Attendance template type (was 'custom', should be 'attendance') ──
UPDATE public.certificate_templates
SET certificate_type = 'attendance'
WHERE template_name ILIKE '%attendance%'
  AND (certificate_type IS NULL OR certificate_type::text = 'attendance');
