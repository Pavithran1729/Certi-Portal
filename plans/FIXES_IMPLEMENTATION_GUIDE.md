# 🔧 Certi-Portal: Fixes Implementation Guide

**Status:** Implementation Plan Ready  
**Total Issues:** 65  
**Critical Issues:** 7  
**Estimated Time:** 8-10 hours  
**Priority:** DEPLOY THIS WEEK

---

## PHASE 1: CRITICAL FIXES (4 hours) - DEPLOY IMMEDIATELY

### Fix #1: Certificate Generation Table Reference
**Status:** ✅ PARTIALLY DONE  
**File:** `supabase/functions/generate-certificate/index.ts`  
**Lines:** 342-375  

**Problem:** Queries wrong table `students` instead of `profiles`  
**Impact:** Certificate downloads FAIL

**What's Done:**
- ✅ Fixed targetStudent query (students → profiles)

**What's Remaining:**
- [ ] Update main student variable query (line ~342)
- [ ] Update allValues map to use profile fields instead of student fields
- [ ] Test certificate generation end-to-end

**Action:**
```typescript
// Line 342 - CHANGE THIS:
const { data: student } = await supabase
  .from("students")
  .select("id, first_name, last_name, student_id, branch, year, section, ug_degree, email, phone")
  .eq("user_id", user.id)
  .single();

// TO THIS:
const { data: student } = await supabase
  .from("profiles")
  .select("id, full_name, roll_number, branch, year, section, degree, phone, email")
  .eq("user_id", user.id)
  .single();
```

**Verify:** 
```bash
npm run test:cert-generation
```

---

### Fix #2: RLS Policy - Student Self-Approval
**Status:** ❌ NOT STARTED  
**File:** `supabase/migrations/20260225000001_fix_critical_bugs.sql`  
**Lines:** 90-102  

**Problem:** RLS allows students to insert their own approval records  
**Impact:** Any student can approve their own certificates

**Required Changes:**

1. **Remove/Fix INSERT policy:**
```sql
-- DROP POLICY IF EXISTS "System can insert approvals" ON certificate_approvals;
-- CHANGE LINE 91-92 FROM:
CREATE POLICY "System can insert approvals"
ON public.certificate_approvals FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'student'));

-- TO:
CREATE POLICY "System can insert approvals"
ON public.certificate_approvals FOR INSERT
WITH CHECK (public.has_role(auth.uid(), 'admin'));
```

2. **Test:** Try to insert as student - should fail

**Deploy:**
```bash
npx supabase migration add fix_rls_self_approval
# Then run migration
```

---

### Fix #3: CORS Configuration
**Status:** ✅ FUNCTION CREATED  
**Files:** All 4 edge functions  
**Function:** `getCorsHeaders()` already created  

**What's Done:**
- ✅ Function defined at line 5

**What's Remaining:**
- [ ] Replace all uses of `corsHeaders` with `getCorsHeaders(req.headers.get("origin"))`
- [ ] Apply to all 4 edge functions:
  - `approve-certificate/index.ts`
  - `manage-authority/index.ts`
  - `create-admin-user/index.ts`

**Pattern to Apply:**
```typescript
// OLD:
return new Response(JSON.stringify({ error: "..." }), {
  status: 400,
  headers: { ...corsHeaders, "Content-Type": "application/json" }
});

// NEW:
const cors = getCorsHeaders(req.headers.get("origin"));
return new Response(JSON.stringify({ error: "..." }), {
  status: 400,
  headers: { ...cors, "Content-Type": "application/json" }
});
```

---

### Fix #4: Auth Race Condition
**Status:** ❌ NOT STARTED  
**File:** `src/hooks/useAuth.ts`  
**Lines:** 45-100  

**Problem:** Role assignment timing issue - role might be null  
**Impact:** Race condition on certificate submission

**Required Changes:**
```typescript
export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    session: null,
    role: null,
    isLoading: true,
    isAuthenticated: false,
  });

  // ADD THIS:
  const isMountedRef = useRef(true);

  const fetchUserRole = useCallback(async (userId: string): Promise<AppRole | null> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .maybeSingle();

      if (error) {
        console.error("Error fetching user role:", error);
        return null;
      }

      return data?.role || null;
    } catch (error) {
      console.error("Error in fetchUserRole:", error);
      return null;
    }
  }, []);

  useEffect(() => {
    isMountedRef.current = true;

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!isMountedRef.current) return;

        setAuthState((prev) => ({
          ...prev,
          session,
          user: session?.user ?? null,
          isAuthenticated: !!session?.user,
        }));

        if (session?.user) {
          setTimeout(async () => {
            if (!isMountedRef.current) return;
            const role = await fetchUserRole(session.user.id);
            if (!isMountedRef.current) return;
            setAuthState((prev) => ({
              ...prev,
              role,
              isLoading: false,
            }));
          }, 0);
        } else {
          setAuthState((prev) => ({
            ...prev,
            role: null,
            isLoading: false,
          }));
        }
      }
    );

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!isMountedRef.current) return;
      
      if (session?.user) {
        const role = await fetchUserRole(session.user.id);
        if (!isMountedRef.current) return;
        setAuthState({
          session,
          user: session.user,
          role,
          isLoading: false,
          isAuthenticated: true,
        });
      } else {
        setAuthState({
          session: null,
          user: null,
          role: null,
          isLoading: false,
          isAuthenticated: false,
        });
      }
    });

    return () => {
      isMountedRef.current = false;
      subscription.unsubscribe();
    };
  }, [fetchUserRole]);

  // ... rest of code
}
```

---

### Fix #5: SQL Injection - Field Replacement
**Status:** ❌ NOT STARTED  
**File:** `supabase/functions/generate-certificate/index.ts`  
**Lines:** 510-516  

**Problem:** Unsafe regex on user-provided field names  
**Impact:** Malicious field names could break XML parsing

**Current Code (UNSAFE):**
```typescript
for (const [key, value] of Object.entries(allValues)) {
  const safeValue = xmlEscape(value);
  const encodedPattern = new RegExp(`&lt;\\s*${escapeRegex(key)}\\s*&gt;`, "gi");
  xml = xml.replace(encodedPattern, safeValue);
  const literalPattern = new RegExp(`<${escapeRegex(key)}>`, "gi");
  xml = xml.replace(literalPattern, () => safeValue);
}
```

**Fixed Code:**
```typescript
// Use safer template replacement
function safeReplaceTemplateFields(xml: string, values: Record<string, string>): string {
  let result = xml;
  
  for (const [key, value] of Object.entries(values)) {
    // Validate key format
    if (!/^[a-zA-Z0-9_]+$/.test(key)) {
      console.warn(`Skipping invalid field name: ${key}`);
      continue;
    }
    
    const safeValue = xmlEscape(value);
    const encodedPattern = new RegExp(`&lt;\\s*${escapeRegex(key)}\\s*&gt;`, "gi");
    result = result.replace(encodedPattern, safeValue);
    
    const literalPattern = new RegExp(`<\\s*${escapeRegex(key)}\\s*>`, "gi");
    result = result.replace(literalPattern, safeValue);
  }
  
  return result;
}

// OLD:
for (const [key, value] of Object.entries(allValues)) {
  const safeValue = xmlEscape(value);
  const encodedPattern = new RegExp(`&lt;\\s*${escapeRegex(key)}\\s*&gt;`, "gi");
  xml = xml.replace(encodedPattern, safeValue);
  const literalPattern = new RegExp(`<${escapeRegex(key)}>`, "gi");
  xml = xml.replace(literalPattern, () => safeValue);
}

// NEW:
xml = safeReplaceTemplateFields(xml, allValues);
```

---

### Fix #6: XSS Vulnerabilities
**Status:** ❌ NOT STARTED  
**Files:** 
- `src/components/admin/CertificateDetailDialog.tsx`
- `src/components/admin/EditTemplateDialog.tsx`
- `src/components/admin/TemplatePreviewDialog.tsx`

**Problem:** Unescaped user input rendering  
**Impact:** Admin could inject malicious HTML

**Fix Pattern:**
```typescript
// BAD - XSS vulnerability:
<div>{certificate.admin_remarks}</div>

// GOOD - Sanitized:
<div className="whitespace-pre-wrap break-words">
  {escapeHtml(certificate.admin_remarks)}
</div>
```

**Add Utility Function:**
```typescript
// src/lib/sanitize.ts
export function escapeHtml(text: string): string {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
```

**Apply to:**
1. Admin remarks display
2. Template content preview
3. Form data display in detail dialogs

---

### Fix #7: Certificate Status Race Condition
**Status:** ❌ NOT STARTED  
**File:** `supabase/functions/approve-certificate/index.ts`  
**Lines:** 100-134  

**Problem:** Race condition allows double-approval  
**Impact:** Certificate could be approved twice

**Fix:**
```typescript
// Add transaction-like logic
if (action === "reject") {
  // Add version check
  const { data: currentCert } = await supabase
    .from("certificates")
    .select("updated_at")
    .eq("id", certificateId)
    .single();

  if (currentCert?.updated_at !== cert.updated_at) {
    return new Response(
      JSON.stringify({ error: "Certificate was modified by another process" }),
      { status: 409, headers: { ...cors, "Content-Type": "application/json" } }
    );
  }

  await supabase
    .from("certificates")
    .update({
      status: "rejected",
      admin_remarks: `Rejected by authority (step ${approvalStep.approval_order}): ${remarks || "No reason provided"}`,
      updated_at: new Date().toISOString(),
    })
    .eq("id", certificateId)
    .eq("updated_at", cert.updated_at);
}
```

---

## PHASE 2: HIGH PRIORITY FIXES (2-3 hours)

### Fix #8: Add Cascade Delete Constraints
**File:** New migration  
**Action:**
```sql
-- Add to new migration file
ALTER TABLE public.template_fields
ADD CONSTRAINT fk_template_fields_template_id
FOREIGN KEY (template_id) REFERENCES public.certificate_templates(id)
ON DELETE CASCADE;

ALTER TABLE public.certificate_files
ADD CONSTRAINT fk_cert_files_cert_id
FOREIGN KEY (certificate_id) REFERENCES public.certificates(id)
ON DELETE CASCADE;
```

### Fix #9: Input Validation in Edge Functions
**Pattern:**
```typescript
// Validate all inputs at function start
function validateRequest(body: any): { valid: boolean; error?: string } {
  if (!body.certificateId || typeof body.certificateId !== 'string') {
    return { valid: false, error: 'Invalid certificateId' };
  }
  if (body.action && !['approve', 'reject'].includes(body.action)) {
    return { valid: false, error: 'Invalid action' };
  }
  return { valid: true };
}
```

### Fix #10: Fix Orphaned Records
**Create cleanup migration:**
```sql
-- Remove certificates with deleted students
DELETE FROM public.certificates
WHERE student_id NOT IN (SELECT id FROM public.students);

-- Add constraint to prevent future orphans
ALTER TABLE public.certificates
ADD CONSTRAINT fk_certificates_student_id
FOREIGN KEY (student_id) REFERENCES public.students(id)
ON DELETE CASCADE;
```

---

## PHASE 3: MEDIUM PRIORITY FIXES (1-2 hours)

### Fix #11-15: N+1 Queries, Error Boundaries, etc.
[Details in ISSUES_FOUND.md]

---

## DEPLOYMENT CHECKLIST

### Before Deploy:
- [ ] All critical fixes tested locally
- [ ] Run migrations in order
- [ ] Test certificate generation end-to-end
- [ ] Test approval workflow
- [ ] Verify RLS policies prevent self-approval
- [ ] Check CORS headers on all endpoints

### Deploy Steps:
```bash
# 1. Backup database
supabase db pull

# 2. Run migrations in order:
supabase migration up

# 3. Deploy edge functions
supabase functions deploy generate-certificate
supabase functions deploy approve-certificate
supabase functions deploy manage-authority
supabase functions deploy create-admin-user

# 4. Deploy frontend
npm run build
# Deploy to Vercel/hosting

# 5. Test in production
# - Create test certificate
# - Approve certificate
# - Download certificate
# - Verify no XSS
# - Verify CORS headers
```

---

## Testing Commands

```bash
# Test certificate generation
npm run test:cert-gen

# Test approval workflow
npm run test:approval

# Test RLS policies
npm run test:rls

# Test CORS headers
curl -H "Origin: https://other-site.com" https://your-function.com
```

---

## Status Tracking

| Fix | Phase | Status | Time | Done |
|-----|-------|--------|------|------|
| Table reference | 1 | In Progress | 0.5h | 50% |
| RLS policy | 1 | Pending | 0.5h | 0% |
| CORS | 1 | In Progress | 0.5h | 50% |
| Auth race | 1 | Pending | 0.5h | 0% |
| SQL injection | 1 | Pending | 0.5h | 0% |
| XSS vulnerabilities | 1 | Pending | 1h | 0% |
| Status race | 1 | Pending | 0.5h | 0% |
| Cascade deletes | 2 | Pending | 0.5h | 0% |
| Input validation | 2 | Pending | 0.5h | 0% |
| Orphaned records | 2 | Pending | 0.5h | 0% |
| N+1 queries | 3 | Pending | 1h | 0% |
| Error boundaries | 3 | Pending | 1h | 0% |
| Other medium | 3 | Pending | 1h | 0% |

**Total Time:** ~8-10 hours  
**Critical Time:** ~4 hours (MUST DO)

---

## Next Steps

1. ✅ Start with Phase 1 Critical Fixes
2. Complete each fix with testing
3. Deploy to staging first
4. Test thoroughly
5. Deploy to production
6. Monitor for issues
7. Continue with Phase 2 & 3

All fixes detailed in `plans/ISSUES_FOUND.md` with code examples.
