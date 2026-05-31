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
    console.log("Checking ALL has_role functions...");
    const hasRole = await runSQL(`
        SELECT proname, pg_get_functiondef(oid)
        FROM pg_proc 
        WHERE proname = 'has_role';
    `);
    console.log(JSON.stringify(hasRole, null, 2));

    console.log("\nChecking view definitions to see if any are broken...");
    const views = await runSQL(`
        SELECT table_name, view_definition
        FROM information_schema.views
        WHERE table_schema = 'public';
    `);
    console.log(JSON.stringify(views, null, 2));
}

check().catch(console.error);
