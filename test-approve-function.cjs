const { createClient } = require('@supabase/supabase-js');

const SUPABASE_URL = 'https://boymejjlnrlbfizavzgn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

async function testEdgeFunction() {
    console.log("Signing in as Authority...");
    const { data: authData, error: authErr } = await supabase.auth.signInWithPassword({
        email: 'pavithranraja1729@gmail.com', // Active authority
        password: 'Supabase123!'
    });
    if (authErr) throw authErr;

    console.log("Fetching pending certificate to approve...");
    const { data: certApp } = await supabase
        .from("certificate_approvals")
        .select("certificate_id")
        .eq("authority_user_id", authData.user.id)
        .eq("status", "pending")
        .limit(1)
        .single();

    if (!certApp) {
        console.log("No pending certificates to approve!");
        return;
    }

    console.log(`Testing approve-certificate for certificate ${certApp.certificate_id}...`);

    try {
        const { data, error } = await supabase.functions.invoke("approve-certificate", {
            body: {
                certificateId: certApp.certificate_id,
                action: "approve",
                remarks: "Test approval via script"
            }
        });

        console.log("Function Error Details:", error);
        if (error) {
            console.log("Is error instance of Error?", error instanceof Error);
            console.log("Error Name:", error.name);
            console.log("Error Message:", error.message);
            // Sometimes Supabase returns a Response obj in error.context
            if (error.context) {
                const text = await error.context.text?.() || error.context;
                console.log("Context:", text);
            }
        }
        console.log("Function Data:", data);

    } catch (e) {
        console.log("Caught Exception:");
        console.error(e);
    }
}

testEdgeFunction().catch(console.error);
