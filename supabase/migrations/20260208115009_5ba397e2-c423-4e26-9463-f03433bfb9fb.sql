-- Create role enum
CREATE TYPE public.app_role AS ENUM ('student', 'admin', 'hod');

-- Create user_roles table
CREATE TABLE public.user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    role app_role NOT NULL DEFAULT 'student',
    department TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    UNIQUE (user_id, role)
);

-- Create students table
CREATE TABLE public.students (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    student_id TEXT UNIQUE NOT NULL,
    first_name TEXT NOT NULL,
    middle_name TEXT,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL,
    phone TEXT,
    aadhar_no TEXT NOT NULL,
    ug_degree TEXT,
    branch TEXT,
    year TEXT,
    section TEXT,
    admission_year TEXT,
    photo_url TEXT,
    signature_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create personal_details table
CREATE TABLE public.personal_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    dob DATE,
    gender TEXT,
    blood_group TEXT,
    religion TEXT,
    caste TEXT,
    nationality TEXT DEFAULT 'Indian',
    father_name TEXT,
    mother_name TEXT,
    parent_phone TEXT,
    address TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificate_type enum
CREATE TYPE public.certificate_type AS ENUM ('tc', 'bonafide', 'attendance', 'conduct', 'training');

-- Create certificate_status enum
CREATE TYPE public.certificate_status AS ENUM ('pending', 'approved', 'rejected');

-- Create certificates table
CREATE TABLE public.certificates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id UUID NOT NULL REFERENCES public.students(id) ON DELETE CASCADE,
    certificate_type certificate_type NOT NULL,
    status certificate_status NOT NULL DEFAULT 'pending',
    application_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    issue_date TIMESTAMP WITH TIME ZONE,
    admin_remarks TEXT,
    hod_authorization_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create certificate_files table
CREATE TABLE public.certificate_files (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL REFERENCES public.certificates(id) ON DELETE CASCADE,
    file_type TEXT NOT NULL,
    file_name TEXT NOT NULL,
    file_url TEXT NOT NULL,
    uploaded_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create TC details table
CREATE TABLE public.tc_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL UNIQUE REFERENCES public.certificates(id) ON DELETE CASCADE,
    tc_type TEXT NOT NULL,
    reason TEXT,
    exam_name TEXT,
    exam_year TEXT,
    exam_month TEXT,
    seat_no TEXT,
    cgpa TEXT,
    grade TEXT,
    new_college_name TEXT,
    new_college_address TEXT,
    contact_address TEXT,
    contact_phone TEXT
);

-- Create bonafide details table
CREATE TABLE public.bonafide_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL UNIQUE REFERENCES public.certificates(id) ON DELETE CASCADE,
    purpose TEXT NOT NULL,
    dob_words TEXT,
    current_address TEXT,
    division TEXT
);

-- Create attendance details table
CREATE TABLE public.attendance_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL UNIQUE REFERENCES public.certificates(id) ON DELETE CASCADE,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    faculty_name TEXT,
    reason TEXT
);

-- Create conduct details table
CREATE TABLE public.conduct_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL UNIQUE REFERENCES public.certificates(id) ON DELETE CASCADE,
    period_of_study TEXT NOT NULL,
    purpose TEXT,
    has_disciplinary_remarks BOOLEAN DEFAULT false
);

-- Create training details table
CREATE TABLE public.training_details (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    certificate_id UUID NOT NULL UNIQUE REFERENCES public.certificates(id) ON DELETE CASCADE,
    training_title TEXT NOT NULL,
    from_date DATE NOT NULL,
    to_date DATE NOT NULL,
    conducted_by TEXT,
    skills_acquired TEXT,
    training_type TEXT
);

-- Enable RLS on all tables
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.students ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.personal_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificate_files ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tc_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.bonafide_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.attendance_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.conduct_details ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.training_details ENABLE ROW LEVEL SECURITY;

-- Create helper function to check if user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;

-- Create helper function to check if current user is HOD
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'hod')
$$;

-- Create helper to get student_id for current user
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid()
$$;

-- RLS Policies for user_roles
CREATE POLICY "Users can view their own roles"
ON public.user_roles FOR SELECT
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can insert roles"
ON public.user_roles FOR INSERT
WITH CHECK (public.is_admin());

CREATE POLICY "Only admins can update roles"
ON public.user_roles FOR UPDATE
USING (public.is_admin());

CREATE POLICY "Only admins can delete roles"
ON public.user_roles FOR DELETE
USING (public.is_admin());

-- RLS Policies for students
CREATE POLICY "Students can view their own profile"
ON public.students FOR SELECT
USING (user_id = auth.uid() OR public.is_admin() OR public.is_hod());

CREATE POLICY "Students can create their own profile"
ON public.students FOR INSERT
WITH CHECK (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Students can update their own profile"
ON public.students FOR UPDATE
USING (user_id = auth.uid() OR public.is_admin());

CREATE POLICY "Only admins can delete students"
ON public.students FOR DELETE
USING (public.is_admin());

-- RLS Policies for personal_details
CREATE POLICY "Students can view their own personal details"
ON public.personal_details FOR SELECT
USING (
  student_id = public.get_student_id() 
  OR public.is_admin() 
  OR public.is_hod()
);

CREATE POLICY "Students can create their own personal details"
ON public.personal_details FOR INSERT
WITH CHECK (student_id = public.get_student_id() OR public.is_admin());

CREATE POLICY "Students can update their own personal details"
ON public.personal_details FOR UPDATE
USING (student_id = public.get_student_id() OR public.is_admin());

-- RLS Policies for certificates
CREATE POLICY "Students can view their own certificates"
ON public.certificates FOR SELECT
USING (
  student_id = public.get_student_id() 
  OR public.is_admin() 
  OR public.is_hod()
);

CREATE POLICY "Students can create their own certificates"
ON public.certificates FOR INSERT
WITH CHECK (student_id = public.get_student_id() OR public.is_admin());

CREATE POLICY "Admins and HODs can update certificates"
ON public.certificates FOR UPDATE
USING (public.is_admin() OR public.is_hod());

CREATE POLICY "Only admins can delete certificates"
ON public.certificates FOR DELETE
USING (public.is_admin());

-- RLS Policies for certificate_files
CREATE POLICY "Users can view certificate files"
ON public.certificate_files FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.certificates c
    WHERE c.id = certificate_id
    AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())
  )
);

CREATE POLICY "Students can upload certificate files"
ON public.certificate_files FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.certificates c
    WHERE c.id = certificate_id
    AND (c.student_id = public.get_student_id() OR public.is_admin())
  )
);

CREATE POLICY "Admins can delete certificate files"
ON public.certificate_files FOR DELETE
USING (public.is_admin());

-- RLS for certificate detail tables (same pattern)
CREATE POLICY "View TC details" ON public.tc_details FOR SELECT
USING (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())));

CREATE POLICY "Create TC details" ON public.tc_details FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin())));

CREATE POLICY "View bonafide details" ON public.bonafide_details FOR SELECT
USING (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())));

CREATE POLICY "Create bonafide details" ON public.bonafide_details FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin())));

CREATE POLICY "View attendance details" ON public.attendance_details FOR SELECT
USING (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())));

CREATE POLICY "Create attendance details" ON public.attendance_details FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin())));

CREATE POLICY "View conduct details" ON public.conduct_details FOR SELECT
USING (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())));

CREATE POLICY "Create conduct details" ON public.conduct_details FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin())));

CREATE POLICY "View training details" ON public.training_details FOR SELECT
USING (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin() OR public.is_hod())));

CREATE POLICY "Create training details" ON public.training_details FOR INSERT
WITH CHECK (EXISTS (SELECT 1 FROM public.certificates c WHERE c.id = certificate_id AND (c.student_id = public.get_student_id() OR public.is_admin())));

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Apply triggers
CREATE TRIGGER update_students_updated_at
BEFORE UPDATE ON public.students
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_personal_details_updated_at
BEFORE UPDATE ON public.personal_details
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_certificates_updated_at
BEFORE UPDATE ON public.certificates
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate student ID
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  seq_num INTEGER;
  new_student_id TEXT;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.students
  WHERE student_id LIKE current_year || '%';
  
  new_student_id := current_year || LPAD(seq_num::TEXT, 4, '0');
  
  RETURN new_student_id;
END;
$$;

-- Create storage bucket for certificate files
INSERT INTO storage.buckets (id, name, public) VALUES ('certificate-files', 'certificate-files', false);

-- Storage policies
CREATE POLICY "Students can upload their own files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'certificate-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Students can view their own files"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'certificate-files' 
  AND (
    auth.uid()::text = (storage.foldername(name))[1]
    OR public.is_admin()
    OR public.is_hod()
  )
);

CREATE POLICY "Admins can delete files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'certificate-files' 
  AND public.is_admin()
);