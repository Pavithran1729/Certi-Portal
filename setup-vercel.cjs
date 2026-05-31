#!/usr/bin/env node
/**
 * setup-vercel.cjs
 * 
 * Reads .env.local and pushes all VITE_ variables to your Vercel project
 * so you never have to type them manually in the Vercel dashboard.
 *
 * Usage:
 *   node setup-vercel.cjs
 *
 * Prerequisites:
 *   npm i -g vercel       (install Vercel CLI globally)
 *   vercel login          (authenticate)
 *   vercel link           (link to your Vercel project, run once)
 */

const fs = require("fs");
const path = require("path");
const { execSync } = require("child_process");

const envFile = path.join(__dirname, ".env.local");

if (!fs.existsSync(envFile)) {
    console.error("❌ .env.local not found. Please create it first.");
    process.exit(1);
}

const lines = fs.readFileSync(envFile, "utf-8").split("\n");
const envVars = {};

for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eqIdx = trimmed.indexOf("=");
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const value = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, "");
    if (key) envVars[key] = value;
}

const viteVars = Object.entries(envVars).filter(([k]) => k.startsWith("VITE_"));

if (viteVars.length === 0) {
    console.log("⚠️  No VITE_ variables found in .env.local");
    process.exit(0);
}

console.log(`\n🔐 Pushing ${viteVars.length} environment variable(s) to Vercel...\n`);

const environments = ["production", "preview", "development"];

for (const [key, value] of viteVars) {
    for (const env of environments) {
        try {
            // Remove existing value first (ignore errors if it doesn't exist)
            try {
                execSync(`vercel env rm ${key} ${env} --yes`, { stdio: "pipe" });
            } catch { }

            // Write a temp file to pipe the value (avoids shell quoting issues)
            const tmpFile = path.join(__dirname, `.vercel_tmp_${key}`);
            fs.writeFileSync(tmpFile, value);
            execSync(`vercel env add ${key} ${env} < "${tmpFile}"`, { stdio: "pipe" });
            fs.unlinkSync(tmpFile);

            console.log(`  ✅ ${key} → ${env}`);
        } catch (e) {
            console.log(`  ❌ Failed to set ${key} for ${env}: ${e.message}`);
        }
    }
}

console.log("\n✨ Done! Your Vercel project now has all the environment variables.");
console.log("   Deploy with: vercel --prod\n");
