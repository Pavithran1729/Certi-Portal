import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function fullAudit() {
  console.log("=== FULL DATABASE AUDIT ===");

  // 1. Check Certificates vs Templates mapping
  const { data: certs } = await supabase.from('certificates').select('*');
  const { data: templates } = await supabase.from('certificate_templates').select('*');

  console.log(`\nFound ${certs?.length || 0} certificates and ${templates?.length || 0} templates.`);

  const templateTypes = new Set(templates?.map(t => t.certificate_type));
  console.log("Template types available:", Array.from(templateTypes));

  const issues = [];

  for (const cert of certs || []) {
    if (!templateTypes.has(cert.certificate_type)) {
      issues.push(`Certificate ${cert.id} has type '${cert.certificate_type}' but NO matching template found.`);
    }
  }

  // 2. Check for templates with NULL types (ghost templates)
  for (const t of templates || []) {
    if (!t.certificate_type) {
      issues.push(`Template '${t.template_name}' (${t.id}) has a NULL certificate_type.`);
    }
  }

  // 3. Check for student profile links
  const { data: profiles } = await supabase.from('profiles').select('id');
  const profileIds = new Set(profiles?.map(p => p.id));

  for (const cert of certs || []) {
    if (!profileIds.has(cert.student_id)) {
      issues.push(`Certificate ${cert.id} belongs to student_id ${cert.student_id} but NO matching profile exists.`);
    }
  }

  if (issues.length === 0) {
    console.log("\nNo major consistency issues found!");
  } else {
    console.log("\nIssues Found:");
    issues.forEach(i => console.log(`- ${i}`));
  }
}

fullAudit();
