import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://boymejjlnrlbfizavzgn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU';

const supabase = createClient(SUPABASE_URL, ANON_KEY);

// ─── REST API OpenAPI schema (lists all exposed tables) ──────────────────────
async function getRestSchema() {
  const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
    headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
  });
  const json = await res.json();
  return json;
}

// ─── Tables accessible with anon key ─────────────────────────────────────────
async function queryTables() {
  const tables = ['profiles', 'certificates', 'certificate_templates', 'template_fields',
                  'custom_certificate_applications', 'admin_notifications', 'user_roles'];
  const results = {};

  for (const table of tables) {
    const { data, error, count } = await supabase
      .from(table)
      .select('*', { count: 'exact', head: true });
    results[table] = { accessible: !error, rowCount: count, error: error?.message };
  }
  return results;
}

// ─── Storage Buckets ──────────────────────────────────────────────────────────
async function getStorageBuckets() {
  const { data, error } = await supabase.storage.listBuckets();
  return { data, error: error?.message };
}

// ─── Storage bucket contents ──────────────────────────────────────────────────
async function getBucketFiles(bucketName) {
  const { data, error } = await supabase.storage.from(bucketName).list('', { limit: 50 });
  return { data, error: error?.message };
}

// ─── Auth settings via well-known endpoint ────────────────────────────────────
async function getAuthSettings() {
  try {
    const res = await fetch(`${SUPABASE_URL}/auth/v1/settings`, {
      headers: { apikey: ANON_KEY }
    });
    return await res.json();
  } catch (e) { return { error: e.message }; }
}

// ─── Check active sessions / user count (anon) ────────────────────────────────
async function getProjectMeta() {
  try {
    const res = await fetch(`${SUPABASE_URL}/rest/v1/`, {
      headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
    });
    const data = await res.json();
    // Extract table/view definitions from OpenAPI
    const paths = data?.paths ? Object.keys(data.paths) : [];
    const definitions = data?.definitions ? Object.keys(data.definitions) : [];
    return { exposedEndpoints: paths, definitions };
  } catch (e) { return { error: e.message }; }
}

// ─── Edge Functions ───────────────────────────────────────────────────────────
async function checkEdgeFunctions() {
  const fns = ['approve-certificate', 'create-admin-user', 'generate-certificate', 'manage-authority'];
  const results = {};
  for (const fn of fns) {
    try {
      const res = await fetch(`${SUPABASE_URL}/functions/v1/${fn}`, {
        method: 'HEAD',
        headers: { apikey: ANON_KEY, Authorization: `Bearer ${ANON_KEY}` }
      });
      results[fn] = { status: res.status, statusText: res.statusText, deployed: res.status !== 404 };
    } catch (e) {
      results[fn] = { error: e.message };
    }
  }
  return results;
}

// ─── certificate_templates (has public policy) ────────────────────────────────
async function getTemplates() {
  const { data, error } = await supabase
    .from('certificate_templates')
    .select('*');
  return { data, error: error?.message };
}

// ─── MAIN ─────────────────────────────────────────────────────────────────────
async function main() {
  console.log('\n====================================================');
  console.log(' LIVE SUPABASE PROJECT ANALYSIS');
  console.log(' Project: boymejjlnrlbfizavzgn');
  console.log(' URL:', SUPABASE_URL);
  console.log('====================================================\n');

  console.log('📋 [1] TABLE ROW COUNTS (anon access test)');
  const tables = await queryTables();
  for (const [table, info] of Object.entries(tables)) {
    if (info.accessible) {
      console.log(`  ✅ ${table}: ${info.rowCount ?? 0} rows`);
    } else {
      console.log(`  🔒 ${table}: BLOCKED by RLS — ${info.error}`);
    }
  }

  console.log('\n📦 [2] STORAGE BUCKETS');
  const buckets = await getStorageBuckets();
  if (buckets.data) {
    for (const b of buckets.data) {
      console.log(`  ${b.public ? '🌐 PUBLIC' : '🔒 PRIVATE'} | ${b.name} | size_limit: ${b.file_size_limit ?? 'none'} | allowed_mime: ${JSON.stringify(b.allowed_mime_types)}`);
    }
    // Get files in public bucket
    for (const b of buckets.data) {
      const files = await getBucketFiles(b.name);
      console.log(`  📁 ${b.name} contents:`, files.data?.length ? files.data.map(f => f.name).join(', ') : files.error ?? 'empty');
    }
  } else {
    console.log('  Error:', buckets.error);
  }

  console.log('\n🔐 [3] AUTH SETTINGS');
  const auth = await getAuthSettings();
  const relevantKeys = ['external_email_enabled','external_phone_enabled','disable_signup',
    'external_google_enabled','external_github_enabled','external_facebook_enabled',
    'mailer_autoconfirm','sms_autoconfirm','jwt_exp'];
  for (const key of relevantKeys) {
    if (auth[key] !== undefined) console.log(`  ${key}: ${auth[key]}`);
  }

  console.log('\n⚡ [4] EDGE FUNCTIONS (deployed check)');
  const fns = await checkEdgeFunctions();
  for (const [fn, info] of Object.entries(fns)) {
    if (info.error) {
      console.log(`  ❓ ${fn}: ${info.error}`);
    } else {
      console.log(`  ${info.deployed ? '✅' : '❌'} ${fn}: HTTP ${info.status} ${info.statusText}`);
    }
  }

  console.log('\n📄 [5] CERTIFICATE TEMPLATES (live data)');
  const templates = await getTemplates();
  if (templates.data) {
    for (const t of templates.data) {
      console.log(`  • ${t.template_name} | type: ${t.certificate_type ?? 'custom'} | active: ${t.is_active} | url: ${t.template_url ?? 'none'}`);
    }
  } else {
    console.log('  Error:', templates.error);
  }

  console.log('\n🗺️  [6] EXPOSED REST API ENDPOINTS (OpenAPI)');
  const meta = await getProjectMeta();
  if (meta.exposedEndpoints) {
    const clean = meta.exposedEndpoints.filter(p => !p.includes('{') || true);
    console.log('  Tables/Views exposed:', meta.definitions?.join(', ') || 'N/A');
    console.log('  Total endpoints:', clean.length);
  } else {
    console.log('  Error:', meta.error);
  }

  console.log('\n====================================================');
  console.log(' ANALYSIS COMPLETE');
  console.log('====================================================\n');
}

main().catch(console.error);
