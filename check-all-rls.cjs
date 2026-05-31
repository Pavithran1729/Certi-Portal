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
    console.log("Checking ALL RLS policies...");
    const policies = await runSQL(`
        SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual, with_check 
        FROM pg_policies
        WHERE schemaname = 'public';
    `);
    console.log(JSON.stringify(policies, null, 2));

    console.log("\nChecking postgres error logs for the real error if possible...");
    try {
        const logs = await runSQL(`
            SELECT query, error_severity, error_message
            FROM pg_stat_statements
            WHERE error_message IS NOT NULL
            ORDER BY last_call DESC LIMIT 5;
        `);
        console.log(JSON.stringify(logs, null, 2));
    } catch (e) {
        console.log("pg_stat_statements not available");
    }
}

check().catch(console.error);
