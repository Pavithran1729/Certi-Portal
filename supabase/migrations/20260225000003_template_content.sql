-- Migration: Add template_content JSONB column to certificate_templates
-- Run this in your Supabase SQL Editor

ALTER TABLE certificate_templates
  ADD COLUMN IF NOT EXISTS template_content jsonb DEFAULT NULL;

COMMENT ON COLUMN certificate_templates.template_content IS
  'Structured JSON content for the guided template builder (Option B). 
   Stores header, body, and footer sections. When set, generate-certificate 
   uses this instead of template_url to build the .docx.
   
   Schema:
   {
     "header": {
       "institution_name": "St. Peter''s College of Engineering and Technology",
       "certificate_title": "BONAFIDE CERTIFICATE",
       "logo_url": ""
     },
     "body": "This is to certify that <name> ...",
     "footer": {
       "signatory_name": "Principal",
       "signatory_designation": "St. Peter''s College",
       "show_date": true
     }
   }
  ';
