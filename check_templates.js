import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function check() {
  const { data: templates } = await supabase.from('certificate_templates').select('id, certificate_type, template_name, is_active').order('created_at', { ascending: false });
  console.log("=== TEMPLATES ===");
  console.log(JSON.stringify(templates, null, 2));

  const { data: certs } = await supabase.from('certificates').select('id, certificate_type, student_id').order('created_at', { ascending: false }).limit(5);
  console.log("\n=== RECENT CERTS ===");
  console.log(JSON.stringify(certs, null, 2));
}

check();
