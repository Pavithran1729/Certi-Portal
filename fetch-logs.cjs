const https = require('https');

const PAT = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const PROJECT_REF = 'boymejjlnrlbfizavzgn';

function apiRequest(method, apiPath) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'api.supabase.com',
            path: apiPath,
            method,
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve(JSON.parse(data)));
        });
        req.on('error', reject);
        req.end();
    });
}

async function getLogs() {
    // We can't easily get edge function logs via Management API v1 directly without knowing the exact log query endpoint,
    // but we can just use the database query to check if the user is being created or not, or just re-deploy the function with more try/catch.
    console.log("Fetching function details...");
    const res = await apiRequest('GET', `/v1/projects/${PROJECT_REF}/functions/manage-authority`);
    console.log(JSON.stringify(res, null, 2));
}

getLogs();
