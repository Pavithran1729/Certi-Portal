-- Migration: Add internship type + seed template_content for all SPCET certificate types

-- 1. Add 'internship' to the certificate_type enum
ALTER TYPE public.certificate_type ADD VALUE IF NOT EXISTS 'internship';
ALTER TYPE public.certificate_type ADD VALUE IF NOT EXISTS 'course_completion';

-- 2. Seed / upsert Bonafide Certificate template content
UPDATE public.certificate_templates
SET template_content = jsonb_build_object(
      'header', jsonb_build_object(
        'institution_name', 'Dr. S. NANDHAKUMAR, M.E., Ph.D.' || E'\n' || 'Principal',
        'certificate_title', 'BONAFIDE CERTIFICATE',
        'logo_url', '/spcet_logo.png'
      ),
      'body', $body$This is to certify that the below mentioned student is a bonafide student of St. Peter's College of Engineering and Technology during the academic year <academic_year>.

    Name                : <name>
    Father's Name  : <fathers_name>
    Programme       : <branch>
    Registration No : <roll_number>
    Year                  : <year>
    Category            : <category>

This certificate is issued for the purpose of <purpose>.$body$,
      'footer', jsonb_build_object(
        'signatory_name', 'PRINCIPAL',
        'signatory_designation', '',
        'show_date', true
      )
    ),
    template_url = null,
    updated_at = now()
WHERE certificate_type = 'bonafide';

-- 3. Seed / upsert Course Completion Certificate template content
UPDATE public.certificate_templates
SET template_content = jsonb_build_object(
      'header', jsonb_build_object(
        'institution_name', E'St. PETER''S COLLEGE OF ENGINEERING & TECHNOLOGY\n(Approved by the AICTE, New Delhi, Affiliated to Anna University Chennai and Accredited by NAAC with ''A'' Grade)\nAVADI, CHENNAI - 600 054.',
        'certificate_title', 'COURSE COMPLETION CERTIFICATE',
        'logo_url', '/spcet_logo.png'
      ),
      'body', $body$This is to Certify that Mr/Ms. <name>
a bonafide student of this college from <fromDate> to <toDate> has completed
the requirements for <degree> Degree Programme under the
Anna University, Branch <branch> Specialisation <specialisation>.$body$,
      'footer', jsonb_build_object(
        'signatory_name', 'Principal.',
        'signatory_designation', '',
        'show_date', true
      )
    ),
    template_url = null,
    updated_at = now()
WHERE certificate_type = 'course_completion';

-- 4. Seed Internship Training Letter template
INSERT INTO public.certificate_templates (
  certificate_type,
  template_name,
  description,
  is_active,
  template_url,
  template_content
)
VALUES (
  'internship',
  'Internship Training Letter',
  'Official internship training request letter (SPCET format)',
  true,
  null,
  jsonb_build_object(
    'header', jsonb_build_object(
      'institution_name', E'Dr. S. NANDHAKUMAR, M.E., Ph.D.\nPrincipal',
      'certificate_title', 'INTERNSHIP TRAINING FOR B.E/B.TECH',
      'logo_url', '/spcet_logo.png'
    ),
    'body', $body$Ref: SPCET/ INT / <academic_year>                                                     Date: <date>

To
        <company_name>,
        <company_address>

Sir/Madam,

        Sub: INTERNSHIP TRAINING FOR B.E/ B. TECH

        St. Peter's College of Engineering and Technology, Chennai, is a reputed institution approved by AICTE, New Delhi and affiliated to Anna University, Chennai. The college offers nine B.E/B.TECH degree programmes and three post graduate programmes (MBA/M.E). Our Students are encouraged to undergo internship training to gain practical knowledge.
        The following Student of our institution is desirous of pursuing internship training from <from_date> to <to_date> at your esteemed organization.

        S.NO    : 1
        NAME    : <name>
        REGISTER NO : <roll_number>
        YEAR/DEPT   : <year> / <branch>

        We shall be grateful if you could accord necessary permission to them. A Letter of acceptance will be highly appreciated.

                                    Thanking you,

                                                        Yours Faithfully,$body$,
    'footer', jsonb_build_object(
      'signatory_name', 'PRINCIPAL',
      'signatory_designation', '',
      'show_date', false
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
