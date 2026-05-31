const https = require('https');
const fs = require('fs');
const path = require('path');

const PAT = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const PROJECT_REF = 'boymejjlnrlbfizavzgn';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU3MzA0MCwiZXhwIjoyMDg2MTQ5MDQwfQ.T6neKk2rtSq44W1iXhaReNR_GPVALk0hJECOXxq6iYk';

function apiRequest(method, apiPath, body) {
    return new Promise((resolve, reject) => {
        const bodyStr = body ? JSON.stringify(body) : '';
        const options = {
            hostname: 'api.supabase.com',
            path: apiPath,
            method,
            headers: {
                'Authorization': `Bearer ${PAT}`,
                'Content-Type': 'application/json',
                ...(bodyStr ? { 'Content-Length': Buffer.byteLength(bodyStr) } : {}),
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try { resolve({ status: res.statusCode, body: JSON.parse(data) }); }
                catch { resolve({ status: res.statusCode, body: data }); }
            });
        });
        req.on('error', reject);
        req.setTimeout(30000, () => { req.destroy(); reject(new Error('Timeout')); });
        if (bodyStr) req.write(bodyStr);
        req.end();
    });
}

async function deployFunction(slug, entryPath) {
    console.log(`\n  Deploying ${slug}...`);

    // Read the function source
    const source = fs.readFileSync(entryPath, 'utf8');

    // Check if function exists
    const checkRes = await apiRequest('GET', `/v1/projects/${PROJECT_REF}/functions/${slug}`);

    if (checkRes.status === 200) {
        // Update existing function
        console.log(`    Found existing function — updating...`);
        const res = await apiRequest('PATCH', `/v1/projects/${PROJECT_REF}/functions/${slug}`, {
            body: source,
            verify_jwt: false,
        });
        if (res.status >= 200 && res.status < 300) {
            console.log(`  ✅ ${slug} updated successfully`);
        } else {
            console.log(`  ❌ ${slug} update failed: ${JSON.stringify(res.body).slice(0, 200)}`);
        }
    } else {
        // Create new function
        console.log(`    Creating new function...`);
        const res = await apiRequest('POST', `/v1/projects/${PROJECT_REF}/functions`, {
            slug,
            name: slug,
            body: source,
            verify_jwt: false,
        });
        if (res.status >= 200 && res.status < 300) {
            console.log(`  ✅ ${slug} deployed successfully`);
        } else {
            console.log(`  ❌ ${slug} deploy failed (HTTP ${res.status}): ${JSON.stringify(res.body).slice(0, 200)}`);
        }
    }
}

async function setSecrets() {
    console.log(`\n  Setting Edge Function secrets...`);
    const secrets = [
        { name: 'SERVICE_ROLE_KEY', value: SERVICE_ROLE_KEY }
    ];

    // Management API expects an array of secrets for POST /secrets
    const res = await apiRequest('POST', `/v1/projects/${PROJECT_REF}/secrets`, secrets);
    if (res.status >= 200 && res.status < 300) {
        console.log(`  ✅ Secrets injected successfully`);
    } else {
        console.log(`  ⚠️ Secrets injection failed (HTTP ${res.status}): ${JSON.stringify(res.body).slice(0, 200)}`);
    }
}

async function main() {
    console.log('\n====================================================');
    console.log(' DEPLOYING EDGE FUNCTIONS TO SUPABASE');
    console.log(` Project: ${PROJECT_REF}`);
    console.log('====================================================');

    const functionsDir = path.join(__dirname, 'supabase', 'functions');

    await setSecrets();

    const toDeply = [
        { slug: 'approve-certificate', entry: path.join(functionsDir, 'approve-certificate', 'index.ts') },
        { slug: 'manage-authority', entry: path.join(functionsDir, 'manage-authority', 'index.ts') },
        { slug: 'create-admin-user', entry: path.join(functionsDir, 'create-admin-user', 'index.ts') },
        { slug: 'generate-certificate', entry: path.join(functionsDir, 'generate-certificate', 'index.ts') },
    ];

    for (const fn of toDeply) {
        if (!fs.existsSync(fn.entry)) {
            console.log(`  ⚠️  Skipping ${fn.slug} — file not found: ${fn.entry}`);
            continue;
        }
        await deployFunction(fn.slug, fn.entry);
    }

    // Verify all functions
    console.log('\n  Verifying deployed functions...');
    const listRes = await apiRequest('GET', `/v1/projects/${PROJECT_REF}/functions`);
    if (listRes.status === 200 && Array.isArray(listRes.body)) {
        for (const fn of listRes.body) {
            console.log(`  ✅ ${fn.slug} | status: ${fn.status} | jwt: ${fn.verify_jwt}`);
        }
    }

    console.log('\n====================================================');
    console.log(' DONE');
    console.log('====================================================\n');
}

main().catch(e => { console.error('Fatal:', e.message); process.exit(1); });
