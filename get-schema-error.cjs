const https = require('https');

const SUPABASE_URL = 'https://boymejjlnrlbfizavzgn.supabase.co';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU';

function fetchSchema() {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'boymejjlnrlbfizavzgn.supabase.co',
            path: `/rest/v1/`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${ANON_KEY}`,
                'apikey': ANON_KEY,
                'Accept': 'application/json'
            },
        };
        const req = https.request(options, (res) => {
            let data = '';
            res.on('data', chunk => data += chunk);
            res.on('end', () => {
                try {
                    resolve({ status: res.statusCode, body: JSON.parse(data) });
                } catch (e) {
                    resolve({ status: res.statusCode, body: data });
                }
            });
        });
        req.on('error', reject);
        req.end();
    });
}

async function check() {
    console.log("Fetching PostgREST schema root endpoint...");
    const res = await fetchSchema();
    console.log("Status:", res.status);
    console.log("Response:", JSON.stringify(res.body, null, 2));
}

check().catch(console.error);
