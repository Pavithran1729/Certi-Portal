import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function checkTemplates() {
  const { data: templates, error } = await supabase
    .from('certificate_templates')
    .select('id, template_name, certificate_type, is_active, template_url, template_content')
    .order('created_at', { ascending: false });

  if (error) {
    console.error("Error fetching templates:", error);
    return;
  }

  console.log("=== CERTIFICATE TEMPLATES ===");
  templates.forEach(t => {
    let contentStatus = "NO";
    if (t.template_content) {
      if (typeof t.template_content === 'object' && Object.keys(t.template_content).length === 0) contentStatus = "EMPTY_OBJECT";
      else contentStatus = "YES_CONTENT";
    }
    console.log(`- ID: ${t.id} | Name: "${t.template_name}" | Type: ${t.certificate_type} | URL: ${t.template_url ? "YES" : "NO"} | Has Content: ${contentStatus}`);
  });
}

checkTemplates();
