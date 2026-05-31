const https = require('https');

const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MDU3MzA0MCwiZXhwIjoyMDg2MTQ5MDQwfQ.T6neKk2rtSq44W1iXhaReNR_GPVALk0hJECOXxq6iYk';
const BASE = 'boymejjlnrlbfizavzgn.supabase.co';

function get(path) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: BASE,
            path: path,
            method: 'GET',
            headers: {
                'apikey': ANON_KEY,
                'Authorization': 'Bearer ' + ANON_KEY,
                'Content-Type': 'application/json',
                'Prefer': 'count=exact'
            }
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => resolve({ status: res.statusCode, headers: res.headers, body: data }));
        });
        req.on('error', reject);
        req.end();
    });
}

async function main() {
    console.log('\n====================================================');
    console.log(' LIVE SUPABASE ANALYSIS — boymejjlnrlbfizavzgn');
    console.log('====================================================\n');

    // 1. Auth settings
    console.log('[1] AUTH SETTINGS:');
    const auth = await get('/auth/v1/settings');
    try {
        const a = JSON.parse(auth.body);
        console.log('  disable_signup:', a.disable_signup);
        console.log('  mailer_autoconfirm:', a.mailer_autoconfirm);
        console.log('  external_email_enabled:', a.external_email_enabled);
        console.log('  external_phone_enabled:', a.external_phone_enabled);
        console.log('  external_google_enabled:', a.external_google_enabled);
        console.log('  external_github_enabled:', a.external_github_enabled);
        console.log('  saml_enabled:', a.saml_enabled);
    } catch (e) { console.log('  Raw:', auth.body.slice(0, 300)); }

    // 2. Storage buckets
    console.log('\n[2] STORAGE BUCKETS:');
    const buckets = await get('/storage/v1/bucket');
    try {
        const bs = JSON.parse(buckets.body);
        if (Array.isArray(bs)) {
            bs.forEach(b => {
                console.log(`  [${b.public ? 'PUBLIC ' : 'PRIVATE'}] ${b.name} | size_limit: ${b.file_size_limit || 'none'} | mime: ${JSON.stringify(b.allowed_mime_types)}`);
            });
        } else { console.log('  Response:', JSON.stringify(bs).slice(0, 300)); }
    } catch (e) { console.log('  Raw:', buckets.body.slice(0, 300)); }

    // 3. Tables (RLS test)
    console.log('\n[3] TABLE ACCESS (RLS check):');
    const tables = ['profiles', 'certificates', 'certificate_templates', 'template_fields',
        'custom_certificate_applications', 'admin_notifications', 'user_roles'];
    for (const t of tables) {
        const r = await get(`/rest/v1/${t}?select=*&limit=0`);
        const range = r.headers['content-range'] || 'N/A';
        const blocked = r.status === 401 || r.status === 403;
        console.log(`  [${r.status}] ${t}${blocked ? ' — BLOCKED by RLS' : ` — OK | count: ${range}`}`);
    }

    // 4. Certificate templates (live)
    console.log('\n[4] CERTIFICATE TEMPLATES (live):');
    const tmpl = await get('/rest/v1/certificate_templates?select=id,template_name,certificate_type,is_active,template_url,description&order=created_at');
    try {
        const ts = JSON.parse(tmpl.body);
        if (Array.isArray(ts)) {
            ts.forEach(t => {
                console.log(`  • [${t.is_active ? 'ACTIVE' : 'INACTIVE'}] ${t.template_name} | type: ${t.certificate_type || 'custom'} | url: ${t.template_url || 'none'}`);
                if (t.description) console.log(`    desc: ${t.description}`);
            });
        } else { console.log('  Response:', JSON.stringify(ts).slice(0, 300)); }
    } catch (e) { console.log('  Raw:', tmpl.body.slice(0, 300)); }

    // 5. Edge functions
    console.log('\n[5] EDGE FUNCTIONS:');
    const fns = ['approve-certificate', 'create-admin-user', 'generate-certificate', 'manage-authority'];
    for (const fn of fns) {
        const r = await get(`/functions/v1/${fn}`);
        const deployed = r.status !== 404;
        console.log(`  [${r.status}] ${fn} — ${deployed ? 'DEPLOYED' : 'NOT FOUND'}`);
    }

    // 6. REST API OpenAPI schema
    console.log('\n[6] EXPOSED REST API TABLES (OpenAPI schema):');
    const api = await get('/rest/v1/');
    try {
        const schema = JSON.parse(api.body);
        const defs = Object.keys(schema.definitions || {});
        const paths = Object.keys(schema.paths || {});
        console.log('  Definitions:', defs.join(', '));
        console.log('  Total paths:', paths.length);
    } catch (e) { console.log('  Raw:', api.body.slice(0, 300)); }

    console.log('\n====================================================');
    console.log(' COMPLETE');
    console.log('====================================================\n');
}

main().catch(e => { console.error('Fatal error:', e); process.exit(1); });
