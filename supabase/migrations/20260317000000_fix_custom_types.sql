-- Migration to fix duplicate "Attendance Certificate" custom templates
-- These were previously saved with certificate_type = null, causing duplicate cards on the student dashboard
-- and failing to be found by the Edge Function.

UPDATE public.certificate_templates
SET certificate_type = 'attendance'
WHERE template_name = 'Attendance Certificate'
  AND certificate_type IS NULL;

-- Also fix any other common templates that might have been manually recreated without a type
UPDATE public.certificate_templates
SET certificate_type = 'bonafide'
WHERE template_name ILIKE '%bonafide%'
  AND certificate_type IS NULL;

UPDATE public.certificate_templates
SET certificate_type = 'conduct'
WHERE template_name ILIKE '%conduct%'
  AND certificate_type IS NULL;

UPDATE public.certificate_templates
SET certificate_type = 'tc'
WHERE template_name ILIKE '%transfer%'
  AND certificate_type IS NULL;

UPDATE public.certificate_templates
SET certificate_type = 'course_completion'
WHERE template_name ILIKE '%course completion%'
  AND certificate_type IS NULL;

UPDATE public.certificate_templates
SET certificate_type = 'training'
WHERE template_name ILIKE '%training%'
  AND certificate_type IS NULL;

UPDATE public.certificate_templates
SET certificate_type = 'internship'
WHERE template_name ILIKE '%internship%'
  AND certificate_type IS NULL;
