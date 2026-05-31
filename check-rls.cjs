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

async function check() {
    console.log("Checking user_roles for duplicates...");
    const dups = await runSQL(`
        SELECT user_id, count(*), array_agg(role) as roles
        FROM public.user_roles 
        GROUP BY user_id 
        HAVING count(*) > 1;
    `);
    console.log("Duplicate profiles:", JSON.stringify(dups, null, 2));

    console.log("\nChecking authority_profiles for recent inserts...");
    const authorities = await runSQL(`
        SELECT u.email, ap.display_name, r.role
        FROM public.authority_profiles ap
        JOIN auth.users u ON u.id = ap.user_id
        LEFT JOIN public.user_roles r ON r.user_id = ap.user_id
        ORDER BY ap.created_at DESC LIMIT 5;
    `);
    console.log("Recent Authorities:", JSON.stringify(authorities, null, 2));

    console.log("\nChecking RLS policy on authority_profiles...");
    const policies = await runSQL(`
        SELECT polname, polcmd, polqual, polwithcheck 
        FROM pg_policy 
        WHERE polrelid = 'public.authority_profiles'::regclass;
    `);
    console.log("Policies:", JSON.stringify(policies, null, 2));
}

check().catch(console.error);
