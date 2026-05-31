import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function checkTables() {
  const { count: studentCount } = await supabase.from('students').select('*', { count: 'exact', head: true });
  const { count: profileCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });
  
  console.log(`Students count: ${studentCount}`);
  console.log(`Profiles count: ${profileCount}`);
  
  const { data: students } = await supabase.from('students').select('id, user_id, first_name');
  const { data: profiles } = await supabase.from('profiles').select('id, user_id, full_name');
  
  console.log("\nSample Students:");
  console.log(students?.slice(0, 3));
  
  console.log("\nSample Profiles:");
  console.log(profiles?.slice(0, 3));
}

checkTables();
