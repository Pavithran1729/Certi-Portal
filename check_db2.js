import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function checkTemplates() {
  const { data: templates } = await supabase
    .from('certificate_templates')
    .select('template_name, template_content')
    .limit(3);

  templates?.forEach(t => {
    console.log(`\n=== Name: ${t.template_name} ===`);
    console.log(JSON.stringify(t.template_content, null, 2));
  });
}

checkTemplates();
