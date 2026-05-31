
-- 1. Add description column to certificate_templates
ALTER TABLE public.certificate_templates ADD COLUMN IF NOT EXISTS description text;

-- 2. Make certificate_type nullable for custom templates
ALTER TABLE public.certificate_templates ALTER COLUMN certificate_type DROP NOT NULL;

-- 3. Create template_fields table
CREATE TABLE public.template_fields (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id) ON DELETE CASCADE,
  field_name text NOT NULL,
  field_label text NOT NULL,
  field_type text NOT NULL DEFAULT 'text',
  is_required boolean NOT NULL DEFAULT true,
  max_length integer,
  display_order integer NOT NULL DEFAULT 0,
  placeholder text,
  options jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.template_fields ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage template fields"
ON public.template_fields FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view template fields"
ON public.template_fields FOR SELECT
USING (true);

-- 4. Create custom_certificate_applications table
CREATE TABLE public.custom_certificate_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  certificate_id uuid NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
  template_id uuid NOT NULL REFERENCES public.certificate_templates(id),
  field_values jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.custom_certificate_applications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all custom applications"
ON public.custom_certificate_applications FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "HODs can view all custom applications"
ON public.custom_certificate_applications FOR SELECT
USING (has_role(auth.uid(), 'hod'::app_role));

CREATE POLICY "Students can insert own custom applications"
ON public.custom_certificate_applications FOR INSERT
WITH CHECK (
  certificate_id IN (
    SELECT c.id FROM public.certificates c
    JOIN public.profiles p ON c.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

CREATE POLICY "Students can view own custom applications"
ON public.custom_certificate_applications FOR SELECT
USING (
  certificate_id IN (
    SELECT c.id FROM public.certificates c
    JOIN public.profiles p ON c.student_id = p.id
    WHERE p.user_id = auth.uid()
  )
);

-- 5. Create admin_notifications table
CREATE TABLE public.admin_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  admin_user_id uuid NOT NULL,
  certificate_id uuid REFERENCES public.certificates(id) ON DELETE CASCADE,
  message text NOT NULL,
  is_read boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.admin_notifications ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view own notifications"
ON public.admin_notifications FOR SELECT
USING (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update own notifications"
ON public.admin_notifications FOR UPDATE
USING (auth.uid() = admin_user_id AND has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "System can insert notifications"
ON public.admin_notifications FOR INSERT
WITH CHECK (true);

-- 6. Create trigger to notify admins on new certificate application
CREATE OR REPLACE FUNCTION public.notify_admins_on_new_certificate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  admin_record RECORD;
  student_name text;
BEGIN
  SELECT full_name INTO student_name FROM public.profiles WHERE id = NEW.student_id;
  
  FOR admin_record IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
  LOOP
    INSERT INTO public.admin_notifications (admin_user_id, certificate_id, message)
    VALUES (
      admin_record.user_id,
      NEW.id,
      'New ' || NEW.certificate_type || ' certificate request from ' || COALESCE(student_name, 'a student')
    );
  END LOOP;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER on_new_certificate_notify_admins
AFTER INSERT ON public.certificates
FOR EACH ROW
EXECUTE FUNCTION public.notify_admins_on_new_certificate();

-- 7. Enable realtime for admin_notifications
ALTER PUBLICATION supabase_realtime ADD TABLE public.admin_notifications;
