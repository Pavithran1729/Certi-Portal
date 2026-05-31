import { createClient } from '@supabase/supabase-js';

const supabase = createClient('https://boymejjlnrlbfizavzgn.supabase.co', 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU');

async function checkCerts() {
  const { data: certs } = await supabase
    .from('certificates')
    .select('id, certificate_type, status, created_at')
    .order('created_at', { ascending: false })
    .limit(10);

  console.log("=== LATEST 10 REQUESTED CERTIFICATES ===");
  certs?.forEach(c => {
    console.log(`- ID: ${c.id.slice(0, 8)}... | Type: '${c.certificate_type}' | Status: ${c.status} | Time: ${c.created_at}`);
  });
}

checkCerts();
