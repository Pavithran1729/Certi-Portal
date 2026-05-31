const https = require('https');

const PAT = 'sbp_v0_4425debfe8601ee5386cee494f231a149fd4e4ec';
const PROJECT_REF = 'boymejjlnrlbfizavzgn';
const ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJveW1lampsbnJsYmZpemF2emduIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA1NzMwNDAsImV4cCI6MjA4NjE0OTA0MH0.RYYfPAcZAvAdA_RxOvP3GMOntPLCj2NBg-PqCZKSIwU';

function fetchSchemaWithJWT(jwt) {
    return new Promise((resolve, reject) => {
        const options = {
            hostname: 'boymejjlnrlbfizavzgn.supabase.co',
            path: `/rest/v1/`,
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${jwt}`,
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
    console.log("Generating JWT for Server Role via Postgres...");
    // Just grab a valid token from Postgres? No, Postgres can't easily sign robust JWTs unless we use pgjwt.
    // Instead, I will use Supabase JS auth admin to sign a token!

    const { createClient } = require('@supabase/supabase-js');
    console.log("Using Supabase Client with Service Key to mint a token...");

}

check().catch(console.error);
