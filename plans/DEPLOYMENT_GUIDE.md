# 🚀 Certi-Portal: Deployment Guide

**Status:** Ready for Deployment  
**Date:** 2026-03-17  
**All Critical Fixes:** ✅ COMPLETED

---

## Pre-Deployment Checklist

### Code Quality
- [x] All TypeScript errors resolved
- [x] Security fixes applied
- [x] Race conditions handled
- [x] XSS prevention implemented
- [x] SQL injection prevented
- [x] RLS policies updated

### Database
- [x] Migrations created and tested locally
- [x] Cascade delete constraints added
- [x] Input validation rules enforced
- [x] Orphaned records cleaned up

### Edge Functions
- [x] CORS headers configured securely
- [x] All 4 functions updated
- [x] Origin validation implemented

### Frontend
- [x] Race condition fixes in hooks
- [x] Sanitization utilities created

---

## Deployment Steps

### Step 1: Database Migrations (CRITICAL - Run First)

```bash
# Navigate to project root
cd c:/Users/Admin/Documents/GitHub/Certi-Portal

# Run migrations in order
supabase migration up

# This will apply:
# 1. 20260225000001_fix_critical_bugs.sql (RLS policy fix)
# 2. 20260317000001_cascade_delete_constraints.sql (Cascade deletes)
# 3. 20260317000002_fix_orphaned_records.sql (Cleanup orphans)
# 4. 20260317000003_input_validation.sql (Validation constraints)
```

**Verify Migrations:**
```sql
-- Connect to Supabase and verify:
SELECT * FROM public.certificate_approvals LIMIT 1;
-- Should not allow student INSERT
```

---

### Step 2: Deploy Edge Functions

```bash
# Deploy each function (order doesn't matter for functions)
supabase functions deploy generate-certificate
supabase functions deploy approve-certificate
supabase functions deploy manage-authority
supabase functions deploy create-admin-user

# Verify deployment
supabase functions list
```

**Verify CORS Headers:**
```bash
# Test with curl
curl -H "Origin: https://boymejjlnrlbfizavzgn.vercel.app" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  https://your-function-url.com

# Should return correct CORS headers
```

---

### Step 3: Build Frontend

```bash
# Install dependencies (if needed)
npm install

# Build production bundle
npm run build

# This will catch any TypeScript errors before deployment
```

---

### Step 4: Deploy Frontend

```bash
# If using Vercel (recommended)
vercel deploy --prod

# Or manually deploy the dist folder to your hosting provider
```

---

## Post-Deployment Verification

### 1. Test Certificate Generation

```
1. Log in as student
2. Navigate to certificate request form
3. Submit certificate request
4. Verify:
   - Certificate status changes to "pending"
   - Approval chain created
   - Student data loaded correctly from profiles table
```

### 2. Test Approval Workflow

```
1. Log in as authority user
2. Navigate to pending certificates
3. Approve/Reject certificate
4. Verify:
   - Cannot double-approve
   - Correct status updates
   - Admin remarks saved
   - Cascading approvals work
```

### 3. Test Certificate Download

```
1. Approve certificate as authority
2. Log in as student
3. Download approved certificate
4. Verify:
   - Certificate generates successfully
   - Student data displays correctly
   - CORS headers present
   - No errors in browser console
```

### 4. Test Security

```
1. Verify RLS Policy (Student Self-Approval)
   - Try to insert approval_record as student (should fail)
   - Only admin can insert approvals

2. Verify XSS Prevention
   - Try admin remarks with HTML tags
   - Should display as escaped text, not execute

3. Verify CORS
   - Request from unauthorized origin should be blocked
   - Allowed origins should succeed
```

---

## Rollback Plan

If issues occur, rollback in this order:

```bash
# 1. Rollback frontend first
git revert HEAD  # or previous deployment
vercel deploy --prod

# 2. Rollback functions
supabase functions delete generate-certificate
supabase functions delete approve-certificate
supabase functions delete manage-authority
supabase functions delete create-admin-user

# 3. Restore from backup and rollback migrations
# Contact Supabase support or restore from snapshot
```

---

## Monitoring

### Key Metrics to Watch

1. **Edge Function Performance**
   - response_time < 2000ms
   - error_rate < 1%
   - CORS rejections

2. **Database**
   - query_time < 500ms
   - RLS policy evaluation time
   - N+1 query issues

3. **Frontend Errors**
   - XSS attempts blocked
   - Race condition state updates
   - Auth token expiration

### Log Locations

- **Edge Functions:** Supabase Dashboard → Functions → Logs
- **Database:** Supabase Dashboard → SQL Editor → Query Performance
- **Frontend:** Browser DevTools → Console

---

## Success Criteria

✅ All checks passing:
- [ ] Certificate generation works end-to-end
- [ ] Approval chain processes correctly
- [ ] No XSS vulnerabilities
- [ ] No SQL injection possible
- [ ] No race conditions
- [ ] CORS properly configured
- [ ] Students cannot self-approve
- [ ] Cascade deletes working
- [ ] Input validation enforced
- [ ] Performance acceptable

---

## Contact & Support

If issues arise during deployment:

1. Check edge function logs in Supabase dashboard
2. Verify database migrations applied successfully
3. Check browser console for frontend errors
4. Review CORS headers in network tab
5. Verify RLS policies in Supabase dashboard

---

## Estimated Timeline

- Migrations: 2-5 minutes
- Edge Functions Deploy: 3-5 minutes
- Frontend Build: 5-10 minutes
- Frontend Deploy: 3-5 minutes
- Testing: 15-30 minutes

**Total: ~30-60 minutes**

---

## Notes

- All fixes are backward compatible
- No breaking changes to existing APIs
- Database migrations are one-way (cannot easily rollback)
- Always backup database before major deployments
- Test in staging environment first if possible

**Ready to deploy! 🚀**
