const https = require('https');

const PAT = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const PROJECT_REF = 'boymejjlnrlbfizavzgn';

function runSQL(sql) {
    return new Promise((resolve, reject) => {
        const body = JSON.stringify({ query: sql });
        const options = {
            hostname: 'api.supabase.com',
            path: `/v1/projects/${PROJECT_REF}/database/query`,
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(body),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function testQuery() {
    console.log("Getting hod user UUID...");
    const users = await runSQL(`SELECT id FROM auth.users WHERE email = 'hod@gmail.com' LIMIT 1;`);
    const hod_id = users[0].id;
    console.log("HOD UUID:", hod_id);

    console.log("\nSimulating Dashboard Query as HOD...");
    const result = await runSQL(`
        BEGIN;
        -- Impersonate authenticated user by setting GUCs that Supabase uses
        SET LOCAL role TO 'authenticated';
        SET LOCAL request.jwt.claims TO '{"sub": "${hod_id}", "role": "authenticated", "email": "hod@gmail.com"}';
        
        -- Run the exact query Dashboard runs:
        SELECT * FROM public.authority_profiles;
        ROLLBACK;
    `);
    console.log("Authority Profiles Result:", JSON.stringify(result, null, 2));

    const result2 = await runSQL(`
        BEGIN;
        SET LOCAL role TO 'authenticated';
        SET LOCAL request.jwt.claims TO '{"sub": "${hod_id}", "role": "authenticated", "email": "hod@gmail.com"}';
        SELECT * FROM public.admin_notifications;
        ROLLBACK;
    `);
    console.log("Admin Notifications Result:", JSON.stringify(result2, null, 2));
}

testQuery().catch(console.error);
