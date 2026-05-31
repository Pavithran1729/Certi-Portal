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

async function fixAuthUsers() {
    console.log("Fixing NULL tokens in auth.users...");
    const fix = await runSQL(`
        UPDATE auth.users 
        SET 
            confirmation_token = COALESCE(confirmation_token, ''),
            recovery_token = COALESCE(recovery_token, ''),
            email_change_token_current = COALESCE(email_change_token_current, ''),
            email_change_token_new = COALESCE(email_change_token_new, ''),
            email_change = COALESCE(email_change, ''),
            reauthentication_token = COALESCE(reauthentication_token, ''),
            phone_change_token = COALESCE(phone_change_token, ''),
            phone_change = COALESCE(phone_change, '')
        WHERE confirmation_token IS NULL OR recovery_token IS NULL;
    `);
    console.log("Fixed rows:", JSON.stringify(fix, null, 2));
}

fixAuthUsers().catch(console.error);
