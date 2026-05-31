
-- 1. Admin notifications table
CREATE TABLE public.admin_notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  admin_user_id UUID NOT NULL,
  certificate_id UUID REFERENCES public.certificates(id) ON DELETE CASCADE,
  message TEXT NOT NULL,
  is_read BOOLEAN NOT NULL DEFAULT false,
  read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view their own notifications"
ON public.admin_notifications FOR SELECT
USING (admin_user_id = auth.uid() AND is_admin());

CREATE POLICY "Admins can update their own notifications"
ON public.admin_notifications FOR UPDATE
USING (admin_user_id = auth.uid() AND is_admin());

CREATE POLICY "System can insert notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can delete their own notifications"
ON public.admin_notifications FOR DELETE
USING (admin_user_id = auth.uid() AND is_admin());

-- Index for fast unread lookup
CREATE INDEX idx_admin_notifications_unread ON public.admin_notifications (admin_user_id, is_read, created_at DESC);

-- 2. Certificate templates table (custom templates created by admin)
CREATE TABLE public.certificate_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_name TEXT NOT NULL,
  description TEXT,
  template_url TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.certificate_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view active templates"
ON public.certificate_templates FOR SELECT
USING (is_active = true OR is_admin());

CREATE POLICY "Admins can create templates"
ON public.certificate_templates FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update templates"
ON public.certificate_templates FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete templates"
ON public.certificate_templates FOR DELETE
USING (is_admin());

-- Trigger for updated_at
CREATE TRIGGER update_certificate_templates_updated_at
BEFORE UPDATE ON public.certificate_templates
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- 3. Template fields table (defines form fields for each template)
CREATE TABLE public.template_fields (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,
  field_label TEXT NOT NULL,
  field_type TEXT NOT NULL DEFAULT 'text',
  is_required BOOLEAN NOT NULL DEFAULT true,
  max_length INTEGER,
  display_order INTEGER NOT NULL DEFAULT 0,
  placeholder TEXT,
  options JSONB,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone authenticated can view template fields"
ON public.template_fields FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.certificate_templates ct
  WHERE ct.id = template_fields.template_id
  AND (ct.is_active = true OR is_admin())
));

CREATE POLICY "Admins can manage template fields"
ON public.template_fields FOR INSERT
WITH CHECK (is_admin());

CREATE POLICY "Admins can update template fields"
ON public.template_fields FOR UPDATE
USING (is_admin());

CREATE POLICY "Admins can delete template fields"
ON public.template_fields FOR DELETE
USING (is_admin());

-- 4. Custom certificate applications table (for dynamic templates)
CREATE TABLE public.custom_certificate_applications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  template_id UUID NOT NULL REFERENCES public.certificate_templates(id),
  field_values JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_certificate_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Students can view their own custom apps"
ON public.custom_certificate_applications FOR SELECT
USING (EXISTS (
  SELECT 1 FROM public.certificates c
  WHERE c.id = custom_certificate_applications.certificate_id
  AND (c.student_id = get_student_id() OR is_admin() OR is_hod())
));

CREATE POLICY "Students can create custom apps"
ON public.custom_certificate_applications FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM public.certificates c
  WHERE c.id = custom_certificate_applications.certificate_id
  AND (c.student_id = get_student_id() OR is_admin())
));

-- 5. Function to auto-create notifications for admins when a certificate is submitted
CREATE OR REPLACE FUNCTION public.notify_admins_on_certificate()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  student_name TEXT;
  cert_type TEXT;
BEGIN
  -- Get student name
  SELECT first_name || ' ' || last_name INTO student_name
  FROM public.students WHERE id = NEW.student_id;
  
  cert_type := NEW.certificate_type;
  
  -- Insert notification for each admin
  FOR admin_record IN
    SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.admin_notifications (admin_user_id, certificate_id, message)
    VALUES (
      admin_record.user_id,
      NEW.id,
      student_name || ' has requested a ' || cert_type || ' certificate'
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_certificate_created_notify_admins
AFTER INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_certificate();

-- 6. Make certificate_templates bucket for template uploads
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-templates', 'certificate-templates', true);

CREATE POLICY "Anyone can view template files"
ON storage.objects FOR SELECT
USING (bucket_id = 'certificate-templates');

CREATE POLICY "Admins can upload template files"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'certificate-templates' AND (SELECT is_admin()));

CREATE POLICY "Admins can update template files"
ON storage.objects FOR UPDATE
USING (bucket_id = 'certificate-templates' AND (SELECT is_admin()));

CREATE POLICY "Admins can delete template files"
ON storage.objects FOR DELETE
USING (bucket_id = 'certificate-templates' AND (SELECT is_admin()));
