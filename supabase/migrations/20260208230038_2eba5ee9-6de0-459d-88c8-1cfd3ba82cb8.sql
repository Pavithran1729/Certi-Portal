
-- Create certificate type enum
CREATE TYPE public.certificate_type AS ENUM ('tc', 'bonafide', 'attendance', 'conduct', 'training');

-- Create certificate status enum
CREATE TYPE public.certificate_status AS ENUM ('pending', 'approved', 'rejected');

-- Certificate templates table (admin manages these)
CREATE TABLE public.certificate_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_type certificate_type NOT NULL UNIQUE,
  template_name TEXT NOT NULL,
  template_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Certificate requests/applications table
CREATE TABLE public.certificates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  certificate_type certificate_type NOT NULL,
  status certificate_status NOT NULL DEFAULT 'pending',
  form_data JSONB NOT NULL DEFAULT '{}',
  application_date DATE NOT NULL DEFAULT CURRENT_DATE,
  issue_date TIMESTAMPTZ,
  admin_remarks TEXT,
  generated_certificate_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;

-- Template RLS policies
CREATE POLICY "Admins can manage templates" ON public.certificate_templates
  FOR ALL USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HODs can view templates" ON public.certificate_templates
  FOR SELECT USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "Students can view active templates" ON public.certificate_templates
  FOR SELECT USING (is_active = true);

-- Certificate RLS policies
CREATE POLICY "Students can view own certificates" ON public.certificates
  FOR SELECT USING (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can insert own certificates" ON public.certificates
  FOR INSERT WITH CHECK (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
  );

CREATE POLICY "Students can delete own pending certificates" ON public.certificates
  FOR DELETE USING (
    student_id IN (SELECT id FROM public.profiles WHERE user_id = auth.uid())
    AND status = 'pending'
  );

CREATE POLICY "Admins can view all certificates" ON public.certificates
  FOR SELECT USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update all certificates" ON public.certificates
  FOR UPDATE USING (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "HODs can view all certificates" ON public.certificates
  FOR SELECT USING (public.has_role(auth.uid(), 'hod'));

CREATE POLICY "HODs can update certificates" ON public.certificates
  FOR UPDATE USING (public.has_role(auth.uid(), 'hod'));

-- Triggers for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
  BEFORE UPDATE ON public.certificate_templates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
  BEFORE UPDATE ON public.certificates
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Storage bucket for certificate templates (public for viewing)
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-templates', 'certificate-templates', true);

-- Storage bucket for certificate files (private, student uploads)
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-files', 'certificate-files', false);

-- Storage policies for certificate-templates bucket
CREATE POLICY "Admins can upload certificate templates" ON storage.objects
  FOR INSERT WITH CHECK (bucket_id = 'certificate-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can update certificate templates" ON storage.objects
  FOR UPDATE USING (bucket_id = 'certificate-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete certificate templates" ON storage.objects
  FOR DELETE USING (bucket_id = 'certificate-templates' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Public can view certificate templates" ON storage.objects
  FOR SELECT USING (bucket_id = 'certificate-templates');

-- Storage policies for certificate-files bucket
CREATE POLICY "Users can upload own certificate files" ON storage.objects
  FOR INSERT WITH CHECK (
    bucket_id = 'certificate-files' AND auth.uid()::text = (storage.foldername(name))[1]
  );

CREATE POLICY "Users can view own certificate files" ON storage.objects
  FOR SELECT USING (
    bucket_id = 'certificate-files' AND (
      auth.uid()::text = (storage.foldername(name))[1]
      OR public.has_role(auth.uid(), 'admin')
      OR public.has_role(auth.uid(), 'hod')
    )
  );

-- Seed default template entries for each certificate type
INSERT INTO public.certificate_templates (certificate_type, template_name) VALUES
  ('tc', 'Transfer Certificate Template'),
  ('bonafide', 'Bonafide Certificate Template'),
  ('attendance', 'Attendance Certificate Template'),
  ('conduct', 'Conduct Certificate Template'),
  ('training', 'Training Certificate Template');
