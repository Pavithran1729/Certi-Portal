const fs = require('fs');
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
            res.on('end', () => {
                try {
                    const json = JSON.parse(data);
                    resolve(json);
                } catch (e) {
                    resolve({ text: data, status: res.statusCode });
                }
            });
        });
        req.on('error', reject);
        req.write(body);
        req.end();
    });
}

async function apply() {
    console.log("Applying final SQL migration directly to live database...");
    const sql = fs.readFileSync('supabase/migrations/20260225000002_manage_authority_rpc.sql', 'utf8');

    // The Management API query endpoint can accept full multi-statement scripts, 
    // including CREATE FUNCTION ... $$ blocks natively.
    const result = await runSQL(sql);
    console.log("Result:", JSON.stringify(result, null, 2));

    // Verify it applied
    const verify = await runSQL(`
        SELECT pg_get_functiondef(oid) 
        FROM pg_proc 
        WHERE proname = 'manage_authority_rpc';
    `);
    console.log("Verification (should show p_ variables):", JSON.stringify(verify, null, 2));
}

apply().catch(console.error);
