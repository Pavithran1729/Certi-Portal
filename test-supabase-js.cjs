const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://boymejjlnrlbfizavzgn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU';
const SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU3MzA0MCwiZXhwIjoyMDg2MTQ5MDQwfQ.T6neKk2rtSq44W1iXhaReNR_GPVALk0hJECOXxq6iYk';

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_KEY);
const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testFullFlow() {
  console.log("1. Finding Authority via Admin API...");
  const { data: users, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
  if (userErr) throw userErr;

  const hod = users.users.find(u => u.id === '8da755d4-8357-437d-8b66-e41ad7bc4438');
  if (!hod) throw new Error("Authority user not found!");

  console.log(`2. Updating password for ${hod.email} to 'Supabase123!'...`);
  const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(hod.id, {
    password: 'Supabase123!'
  });
  if (updateErr) throw updateErr;

  console.log(`3. Signing in as ${hod.email} via Client API...`);
  const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
    email: hod.email,
    password: 'Supabase123!'
  });
  if (authErr) throw authErr;

  console.log("6. Fetching joined certificate_approvals...");
  const { data: certApp, error: certAppErr } = await supabase
    .from("certificate_approvals")
    .select(`
          *,
          certificates!inner (
            id,
            certificate_type,
            status,
            application_date,
            form_data,
            student_id,
            profiles!inner (
              full_name,
              roll_number,
              branch,
              year,
              email,
              degree,
              section
            )
          )
        `)
    .eq("authority_user_id", hod.id)
    .order("created_at", { ascending: false });

  console.log("Joined approvals error:", certAppErr);
  console.log("Joined approvals data:", JSON.stringify(certApp, null, 2));
}

testFullFlow().catch(console.error);
