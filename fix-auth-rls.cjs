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

async function fixRLS() {
    console.log("Adding RLS policies for Authorities...");
    const sql = `
        -- Certificates Table
        DROP POLICY IF EXISTS "Authorities can view all certificates" ON certificates;
        CREATE POLICY "Authorities can view all certificates" 
            ON certificates 
            FOR SELECT 
            TO authenticated
            USING (has_role(auth.uid(), 'authority'::app_role));

        -- Profiles Table
        DROP POLICY IF EXISTS "Authorities can view all profiles" ON profiles;
        CREATE POLICY "Authorities can view all profiles" 
            ON profiles 
            FOR SELECT 
            TO authenticated
            USING (has_role(auth.uid(), 'authority'::app_role));
            
        -- Ensure custom_certificate_applications is also readable
        DROP POLICY IF EXISTS "Authorities can view custom apps" ON custom_certificate_applications;
        CREATE POLICY "Authorities can view custom apps" 
            ON custom_certificate_applications 
            FOR SELECT 
            TO authenticated
            USING (has_role(auth.uid(), 'authority'::app_role));
    `;

    // We can also let Admins view custom apps if they can't already
    const adminSql = `
        DROP POLICY IF EXISTS "Admins can view custom apps" ON custom_certificate_applications;
        CREATE POLICY "Admins can view custom apps" 
            ON custom_certificate_applications 
            FOR SELECT 
            TO authenticated
            USING (has_role(auth.uid(), 'admin'::app_role));
    `;

    const res = await runSQL(sql + adminSql);
    console.log("SQL Apply Result:", JSON.stringify(res, null, 2));
}

fixRLS().catch(console.error);
