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

async function verifyTemplates() {
    console.log("Fetching certificate_templates...");
    const templates = await runSQL(`
        SELECT id, template_name, certificate_type, is_active FROM public.certificate_templates;
    `);
    console.log("Templates:", JSON.stringify(templates, null, 2));

    console.log("\nFetching template_approval_chain...");
    const chains = await runSQL(`
        SELECT * FROM public.template_approval_chain;
    `);
    console.log("Chains:", JSON.stringify(chains, null, 2));

    console.log("\nFetching recent certificates...");
    const certs = await runSQL(`
        SELECT id, certificate_type, status, application_date 
        FROM public.certificates 
        ORDER BY application_date DESC 
        LIMIT 5;
    `);
    console.log("Recent Certs:", JSON.stringify(certs, null, 2));

    console.log("\nFetching their approvals...");
    if (certs.length > 0) {
        const certIds = certs.map(c => `'${c.id}'`).join(',');
        const apps = await runSQL(`
            SELECT * FROM public.certificate_approvals
            WHERE certificate_id IN (${certIds});
        `);
        console.log("Approvals:", JSON.stringify(apps, null, 2));
    }
}

verifyTemplates().catch(console.error);
