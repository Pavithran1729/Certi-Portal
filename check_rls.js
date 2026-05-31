import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function checkRLS() {
  const tables = ['certificate_templates', 'certificates', 'profiles', 'custom_certificate_applications'];
  
  console.log("=== RLS POLICY AUDIT ===");
  
  for (const table of tables) {
    try {
      // We can't query pg_policies with anon key usually, but let's try a direct select to see if it works
      const { data, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
        
      if (error) {
        console.log(`- ${table}: Error or Locked (${error.message})`);
      } else {
        console.log(`- ${table}: Accessible (Count: ${data?.length || 0})`);
      }
    } catch (e) {
      console.log(`- ${table}: Failed check`);
    }
  }
}

checkRLS();
