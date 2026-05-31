const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Read keys from analyze-sb.cjs or directly from env if we had it, but we have them in analyze-sb.cjs
const analyzeCode = fs.readFileSync(path.join(__dirname, 'analyze-sb.cjs'), 'utf-8');
const urlMatch = analyzeCode.match(/const SUPABASE_URL = '(.*?)';/);
const keyMatch = analyzeCode.match(/const SUPABASE_KEY = '(.*?)';/);

if (!urlMatch || !keyMatch) {
    console.log("Could not find keys in analyze-sb.cjs");
    process.exit(1);
}

const SUPABASE_URL = urlMatch[1];
const SUPABASE_KEY = keyMatch[1];

const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);

async function testManageAuthority() {
    console.log("Testing calling manage-authority...");

    // Create a minimal valid payload
    const body = {
        action: "create",
        email: "test_auth_123@example.com",
        password: "Password123!",
        display_name: "Test Authority",
        role_title: "Test Role"
    };

    try {
        const { data, error } = await supabase.functions.invoke("manage-authority", {
            body,
        });

        console.log("Result:", { data, error });
    } catch (err) {
        console.error("Caught error:", err);
    }
}

testManageAuthority();
