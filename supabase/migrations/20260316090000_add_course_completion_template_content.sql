-- Add enum value and seed Course Completion certificate guided template content

ALTER TYPE public.certificate_type ADD VALUE IF NOT EXISTS 'course_completion';

INSERT INTO public.certificate_templates (
  certificate_type,
  template_name,
  description,
  is_active,
  template_url,
  template_content
)
VALUES (
  'course_completion',
  'Course Completion Certificate',
  'Official course completion certificate template (SPCET format)',
  true,
  null,
  jsonb_build_object(
    'header', jsonb_build_object(
      'institution_name', E'St. PETER''S COLLEGE OF ENGINEERING & TECHNOLOGY\n(Approved by the AICTE, New Delhi, Affiliated to Anna University Chennai and Accredited by NAAC with ''A'' Grade)\nAVADI, CHENNAI - 600 054.',
      'certificate_title', 'COURSE COMPLETION CERTIFICATE',
      'logo_url', '/spcet_logo.png'
    ),
    'body', $body$This is to Certify that Mr/Ms. <studentName>
a bonafide student of this college from <fromDate> to <toDate> has completed
the requirements for <degree> Degree Programme under the
Anna University, Branch <branch> Specialisation <specialisation>.$body$,
    'footer', jsonb_build_object(
      'signatory_name', 'Principal.',
      'signatory_designation', '',
      'show_date', true
    )
  )
)
ON CONFLICT (certificate_type)
DO UPDATE SET
  template_name = EXCLUDED.template_name,
  description = EXCLUDED.description,
  is_active = EXCLUDED.is_active,
  template_url = null,
  template_content = EXCLUDED.template_content,
  updated_at = now();
