const { createClient } = require('@supabase/supabase-js');
const pat = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const projectRef = 'boymejjlnrlbfizavzgn';
const supabaseUrl = `https://${projectRef}.supabase.co`;
const supabaseKey = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...'; // need to grab anon key

async function main() {
    require('dotenv').config();
    const supabase = createClient(process.env.VITE_SUPABASE_URL, process.env.VITE_SUPABASE_ANON_KEY);

    // 1. Sign in as the authority
    const { data: signInData, error: signInErr } = await supabase.auth.signInWithPassword({
        email: 'hod.cse@spcet.ac.in', // I need to know the authority email!
        password: 'password123'
    });
    console.log("Sign In Err?", signInErr?.message);
    if (!signInData.user) return;

    // 2. Fetch approvals
    console.log("Fetching approvals with join...");
    const { data, error } = await supabase
        .from("certificate_approvals")
        .select(`
          *,
          certificates!inner (
            id,
            certificate_type,
            student_id,
            profiles!inner (
              full_name,
              roll_number
            )
          )
        `)
        .eq("authority_user_id", signInData.user.id);

    console.log("Join Error:", error?.message);
    console.log("Join Data:", JSON.stringify(data, null, 2));

    // 3. Fallback
    console.log("Fetching fallback...");
    const { data: fbData, error: fbErr } = await supabase
        .from("certificate_approvals")
        .select("*")
        .eq("authority_user_id", signInData.user.id);

    console.log("Fallback Err:", fbErr?.message);
    console.log("Fallback Data:", JSON.stringify(fbData, null, 2));
}

main().catch(console.error);
