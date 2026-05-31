import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function fixTypes() {
  const updates = [
    { nameMatch: 'Attendance', type: 'attendance' },
    { nameMatch: 'Bonafide', type: 'bonafide' },
    { nameMatch: 'Conduct', type: 'conduct' },
    { nameMatch: 'Transfer', type: 'tc' },
    { nameMatch: 'Course Completion', type: 'course_completion' },
    { nameMatch: 'Training', type: 'training' },
    { nameMatch: 'Internship', type: 'internship' },
  ];

  for (const { nameMatch, type } of updates) {
    const { data: matches } = await supabase
      .from('certificate_templates')
      .select('id, template_name, certificate_type')
      .ilike('template_name', `%${nameMatch}%`)
      .is('certificate_type', null);

    if (matches && matches.length > 0) {
      for (const t of matches) {
        console.log(`Fixing ${t.template_name} -> mapped to ${type}`);
        await supabase
          .from('certificate_templates')
          .update({ certificate_type: type })
          .eq('id', t.id);
      }
    }
  }

  console.log("Migration complete!");
}

fixTypes();
