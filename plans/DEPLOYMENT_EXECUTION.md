# 🚀 DEPLOYMENT EXECUTION GUIDE - START HERE

**Status:** Ready to Deploy  
**Start Time:** 2026-03-17 07:56:23 UTC  
**Environment:** Staging → Production  
**Estimated Duration:** 2-3 hours total  

---

## ⚠️ PRE-DEPLOYMENT CHECKLIST (Do This First!)

### Environment Setup (5 minutes)
```bash
# 1. Navigate to project directory
cd c:/Users/Admin/Documents/GitHub/Certi-Portal

# 2. Verify git status
git status

# 3. Check node version (should be 16+)
node --version

# 4. Verify Supabase CLI installed
supabase --version

# 5. Check npm packages
npm list | head -20
```

### Environment Variables (5 minutes)
Verify these are set in your `.env` or Supabase dashboard:
```
✓ VITE_SUPABASE_URL
✓ VITE_SUPABASE_PUBLISHABLE_KEY
✓ SUPABASE_SERVICE_ROLE_KEY
✓ SUPABASE_ANON_KEY
✓ SUPABASE_URL (for CLI)
```

### Backup (CRITICAL - 5 minutes)
```bash
# 1. Create backup branch
git checkout -b deployment-backup-$(date +%Y%m%d)
git push origin deployment-backup-$(date +%Y%m%d)

# 2. Database backup (Supabase dashboard)
# Navigate to: Project Settings → Backups → Create Manual Backup
# Wait for backup to complete (shown in UI)
```

### Permission Verification
- [ ] Do you have Supabase project admin access?
- [ ] Do you have Vercel/hosting deployment access?
- [ ] Do you have git push permissions?
- [ ] Do you have database migration permissions?

---

## STEP 1: DEPLOY DATABASE MIGRATIONS (10 minutes)

### 1.1 Link to Supabase Project
```bash
# Set your Supabase project
supabase link --project-id YOUR_PROJECT_ID

# If prompted for password, enter your Supabase password
```

### 1.2 Apply Migrations
```bash
# This applies migrations in order:
# 1. 20260225000001_fix_critical_bugs.sql
# 2. 20260317000001_cascade_delete_constraints.sql
# 3. 20260317000002_fix_orphaned_records.sql
# 4. 20260317000003_input_validation.sql

supabase migration up

# You should see output like:
# Migrating local schema...
# Applied migrations: 4
```

### 1.3 Verify Migrations Applied
```bash
# Check migration status
supabase migration list

# Should show all 4 migrations as "applied"
```

### 1.4 Verify Database Changes
```sql
-- Connect to Supabase SQL editor and run:

-- Check RLS policy was updated
SELECT * FROM pg_policies WHERE tablename = 'certificate_approvals';
-- Should NOT have student INSERT permission

-- Check cascade deletes
SELECT constraint_name, table_name FROM information_schema.table_constraints 
WHERE constraint_type = 'FOREIGN KEY' AND table_name IN ('certificates', 'template_fields', 'certificate_files');
-- Should show ON DELETE CASCADE

-- Check constraints were added
SELECT constraint_name, constraint_type FROM information_schema.table_constraints 
WHERE table_name IN ('certificates', 'certificate_approvals');
-- Should show CHECK constraints for status values
```

**Status: ✅ Database migrations applied**

---

## STEP 2: DEPLOY EDGE FUNCTIONS (15 minutes)

### 2.1 Deploy Functions One by One

#### Function 1: generate-certificate
```bash
supabase functions deploy generate-certificate

# Expected output:
# Deploying function 'generate-certificate'...
# ✓ Function deployed successfully
```

**Verify:**
```bash
supabase functions info generate-certificate
# Should show: Status: Active
```

#### Function 2: approve-certificate
```bash
supabase functions deploy approve-certificate

# Expected output:
# Deploying function 'approve-certificate'...
# ✓ Function deployed successfully
```

#### Function 3: manage-authority
```bash
supabase functions deploy manage-authority

# Expected output:
# Deploying function 'manage-authority'...
# ✓ Function deployed successfully
```

#### Function 4: create-admin-user
```bash
supabase functions deploy create-admin-user

# Expected output:
# Deploying function 'create-admin-user'...
# ✓ Function deployed successfully
```

### 2.2 Verify All Functions Deployed
```bash
supabase functions list

# Should show all 4 functions with Status: Active
```

**Status: ✅ All edge functions deployed**

---

## STEP 3: BUILD FRONTEND (10 minutes)

### 3.1 Install Dependencies
```bash
npm install

# Should complete without errors
# Look for: added X packages in Ys
```

### 3.2 Run Type Check
```bash
npm run tsc --noEmit

# Should complete without TypeScript errors
# If errors: check console, fix any issues in src/
```

### 3.3 Build Application
```bash
npm run build

# Expected output:
# ✓ 1234 modules transformed
# built in 45.32s
# 
# dist/
#   ├── index.html
#   ├── assets/
#   └── ...

# Should complete in under 60 seconds
```

### 3.4 Verify Build Artifacts
```bash
ls -la dist/

# Should show:
# - index.html (main HTML file)
# - assets/ directory (with .js, .css files)
# - No .ts or .tsx files
```

**Status: ✅ Frontend built successfully**

---

## STEP 4: DEPLOY FRONTEND (10 minutes)

### Option A: Vercel Deployment (Recommended)
```bash
# Deploy to Vercel
vercel deploy --prod

# You'll be prompted:
# ? Set up and deploy? - Choose "Y"
# Deployment will show progress
# Final output shows: ✓ Deployment complete
```

### Option B: Manual Deployment
```bash
# If using other hosting:
# 1. Upload dist/ folder to your hosting provider
# 2. Ensure environment variables are set
# 3. Configure routing for SPA (all routes → index.html)
```

### 4.1 Verify Deployment
```bash
# Test the deployed URL
curl https://your-deployed-app.com/

# Should return HTML content (not 404)
# Check browser console - should have no JavaScript errors
```

**Status: ✅ Frontend deployed successfully**

---

## STEP 5: POST-DEPLOYMENT VERIFICATION (20 minutes)

### 5.1 Critical Path Testing

#### Test 1: Certificate Generation
```
1. Open deployed app
2. Log in as STUDENT user
3. Navigate to "Request Certificate"
4. Fill in certificate form
5. Submit
6. Expected: Certificate request created, status = "pending"
```

**Result: ✅ / ❌**

#### Test 2: Approval Workflow
```
1. Log in as AUTHORITY user
2. Navigate to "Pending Approvals"
3. See student's certificate request
4. Click "Approve"
5. Expected: Certificate marked "approved"
6. Try to approve again
7. Expected: Error "Certificate already processed"
```

**Result: ✅ / ❌**

#### Test 3: Security - Student Self-Approval
```
1. As STUDENT user
2. Try to directly approve own certificate (via API)
3. Expected: RLS policy denies access (403 Forbidden)
```

**Result: ✅ / ❌**

#### Test 4: CORS Validation
```bash
# Test CORS headers from allowed origin
curl -I -H "Origin: https://authorized-domain.com" \
  https://your-function.supabase.co/functions/v1/generate-certificate

# Expected: Access-Control-Allow-Origin: https://authorized-domain.com
```

**Result: ✅ / ❌**

#### Test 5: Certificate Download
```
1. As student with approved certificate
2. Click "Download Certificate"
3. Expected: .docx file downloads successfully
4. Open file - should display certificate with student info
```

**Result: ✅ / ❌**

### 5.2 Error Log Review
```
# Check for any errors:
1. Browser Console (F12) - should have no JavaScript errors
2. Network tab - all requests should have status 200/201
3. Supabase Dashboard → Logs → Functions - check for errors
4. Supabase Dashboard → SQL Editor → run health check query
```

### 5.3 Metrics Verification
```bash
# Check that monitoring is working
# 1. Visit Supabase dashboard
# 2. Check function execution metrics
# 3. Verify error rate < 1%
# 4. Verify response time < 2000ms
```

**Status: ✅ All verification tests passed**

---

## STEP 6: ROLLBACK PROCEDURE (If Needed)

### If Critical Error Occurs

#### Level 1: Frontend Rollback (< 5 min)
```bash
# Rollback to previous frontend version
vercel rollback

# OR deploy previous version
git checkout HEAD~1
npm run build
vercel deploy --prod
```

#### Level 2: Function Rollback (< 15 min)
```bash
# If a specific function has issues:
supabase functions delete generate-certificate
# Manually redeploy previous version
```

#### Level 3: Database Rollback (LAST RESORT)
```
# Contact Supabase support to restore from backup
# This can take 1-2 hours
# Backup created at start of deployment
```

---

## MONITORING AFTER DEPLOYMENT

### First Hour (Critical Monitoring)
- Monitor error logs continuously
- Watch for any 5xx errors
- Check database connection status
- Monitor function execution times

### First Day
- Monitor error rate (target: < 1%)
- Monitor response times (target: < 2000ms)
- Gather user feedback
- Check for any unexpected behavior

### First Week
- Daily review of error patterns
- Performance analysis
- User feedback collection
- System health checks

---

## DEPLOYMENT SUCCESS CHECKLIST

### ✅ All items must be complete

**Database:**
- [ ] Migrations applied successfully
- [ ] RLS policy updated (no student INSERT)
- [ ] Cascade deletes in place
- [ ] Input validation constraints added
- [ ] Orphaned records cleaned up

**Edge Functions:**
- [ ] generate-certificate deployed
- [ ] approve-certificate deployed
- [ ] manage-authority deployed
- [ ] create-admin-user deployed
- [ ] CORS headers validated
- [ ] All functions show "Active" status

**Frontend:**
- [ ] TypeScript compilation successful
- [ ] npm build completed without errors
- [ ] dist/ folder has all assets
- [ ] Deployed to production environment

**Testing:**
- [ ] Certificate generation works
- [ ] Approval workflow functions
- [ ] Student cannot self-approve
- [ ] CORS headers correct
- [ ] No JavaScript errors in browser
- [ ] Error rate < 1%

**Documentation:**
- [ ] Deployment completed documented
- [ ] Issues (if any) logged
- [ ] Team notified of completion
- [ ] Monitoring enabled

---

## ❌ IF SOMETHING GOES WRONG

### Certificate Generation Fails
**Check:**
1. Database query: `SELECT * FROM profiles LIMIT 1;`
2. Edge function logs in Supabase dashboard
3. Verify migrations applied: `supabase migration list`

**Fix:**
1. Rerun migrations: `supabase migration up`
2. Redeploy function: `supabase functions deploy generate-certificate`

### RLS Policy Error
**Check:**
1. Verify policy in dashboard
2. Check user roles: `SELECT * FROM user_roles WHERE user_id = 'xxx';`

**Fix:**
1. Manually update policy or rerun migration

### CORS Rejection
**Check:**
1. Verify origin in getCorsHeaders whitelist
2. Check browser Network tab for CORS error

**Fix:**
1. Add origin to allowedOrigins array in each function
2. Redeploy: `supabase functions deploy all`

---

## 📞 NEED HELP?

If deployment fails:

1. **Check documentation:**
   - [`plans/DEPLOYMENT_GUIDE.md`](DEPLOYMENT_GUIDE.md) - Detailed steps
   - [`plans/FIXES_COMPLETED.md`](FIXES_COMPLETED.md) - What changed
   - [`plans/README_FIXES.md`](README_FIXES.md) - Quick reference

2. **Review logs:**
   - Supabase dashboard → Functions → Logs
   - Browser console (F12)
   - Network tab (F12)

3. **Contact:**
   - Technical lead
   - DevOps team
   - Supabase support

---

## 🎉 DEPLOYMENT COMPLETE!

When all tests pass:

✅ Database migrations applied  
✅ Edge functions deployed  
✅ Frontend built and deployed  
✅ Verification tests passed  
✅ Monitoring enabled  
✅ Team notified  

**Next:** Follow up with Phase 2 fixes in 2-3 weeks.

---

**Document Version:** 1.0  
**Created:** 2026-03-17  
**Status:** READY TO EXECUTE

**START WITH:** Step 1 - Deploy Database Migrations
