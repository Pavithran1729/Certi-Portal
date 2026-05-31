# Comprehensive Supabase Database Analysis Report

**Database:** `boymejjlnrlbfizavzgn`  
**Generated:** 2026-03-17T06:55:16.652Z  
**URL:** https://boymejjlnrlbfizavzgn.supabase.co

---

## Executive Summary

This report provides a comprehensive analysis of the Certi-Portal Supabase database, including all schemas, functions, triggers, RLS policies, and data statistics. The database supports a certificate management system for an educational institution with multi-role access control (Students, HODs, Admins, and Authorities).

**Database Status:** ✅ Active  
**Total Certificates:** 55  
**Total Tables:** 14+  
**Row Counts:** 55 certificates with varying statuses

---

## Table of Contents

1. [Database Architecture](#database-architecture)
2. [Table Schemas](#table-schemas)
3. [ENUM Types](#enum-types)
4. [Functions](#functions)
5. [Triggers](#triggers)
6. [RLS Policies](#rls-policies)
7. [Row Counts & Statistics](#row-counts--statistics)
8. [Certificate Data Breakdown](#certificate-data-breakdown)
9. [User Roles Distribution](#user-roles-distribution)
10. [Template Configurations](#template-configurations)
11. [Approval Chain Configurations](#approval-chain-configurations)

---

## Database Architecture

### Design Principles

- **Row-Level Security (RLS):** All tables implement RLS for multi-role access control
- **Security DEFINER Functions:** Critical operations use SECURITY DEFINER for privilege escalation
- **Audit Timestamps:** All tables include `created_at` and `updated_at` fields
- **Cascading Deletes:** FK constraints use ON DELETE CASCADE
- **Storage Integration:** Supabase storage bucket for certificate files

### Schema Diagram

```
auth.users (Supabase Auth)
    ├── user_roles (Role mapping)
    ├── profiles (User profiles)
    ├── students (Student details)
    ├── authority_profiles (Authority details)
    │
    ├── certificates (Certificate applications)
    │   ├── tc_details
    │   ├── bonafide_details
    │   ├── attendance_details
    │   ├── conduct_details
    │   ├── training_details
    │   └── certificate_files
    │
    ├── certificate_templates
    │   └── template_content (JSONB)
    │
    ├── approval_chains
    │   └── approvals
    │       └── authority_profiles
    │
    └── personal_details
```

---

## Table Schemas

### 1. **user_roles** (Authentication & Authorization)

**Purpose:** Maps users to roles (student, admin, hod, authority)

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `user_id` | UUID | NO | - | FK → `auth.users(id)` ON DELETE CASCADE |
| `role` | `app_role` ENUM | NO | `'student'` | - |
| `department` | TEXT | YES | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| **Constraint** | `UNIQUE(user_id, role)` | - | - | - |

**RLS Enabled:** ✅ Yes

---

### 2. **profiles** (User Profiles)

**Purpose:** Store user profile information

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `user_id` | UUID | NO | - | FK → `auth.users(id)` UNIQUE |
| `full_name` | TEXT | YES | - | - |
| `email` | TEXT | YES | - | - |
| `phone` | TEXT | YES | - | - |
| `roll_number` | TEXT | YES | - | - |
| `degree` | TEXT | YES | - | - |
| `branch` | TEXT | YES | - | - |
| `year` | TEXT | YES | - | - |
| `section` | TEXT | YES | - | - |
| `avatar_url` | TEXT | YES | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Auto-Trigger:** Profile created on user signup

---

### 3. **students** (Student Information)

**Purpose:** Extended student profile with academic details

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `user_id` | UUID | NO | - | FK → `auth.users(id)` UNIQUE |
| `student_id` | TEXT | NO | - | UNIQUE (Auto-generated) |
| `first_name` | TEXT | NO | - | - |
| `middle_name` | TEXT | YES | - | - |
| `last_name` | TEXT | NO | - | - |
| `email` | TEXT | NO | - | - |
| `phone` | TEXT | YES | - | - |
| `aadhar_no` | TEXT | NO | - | - |
| `ug_degree` | TEXT | YES | - | - |
| `branch` | TEXT | YES | - | - |
| `year` | TEXT | YES | - | - |
| `section` | TEXT | YES | - | - |
| `admission_year` | TEXT | YES | - | - |
| `photo_url` | TEXT | YES | - | - |
| `signature_url` | TEXT | YES | - | - |
| `is_active` | BOOLEAN | YES | `true` | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Trigger:** `update_students_updated_at` (BEFORE UPDATE)

---

### 4. **personal_details** (Student Personal Information)

**Purpose:** Additional personal details linked to students

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `student_id` | UUID | NO | - | FK → `students(id)` ON DELETE CASCADE |
| `dob` | DATE | YES | - | - |
| `gender` | TEXT | YES | - | - |
| `blood_group` | TEXT | YES | - | - |
| `religion` | TEXT | YES | - | - |
| `caste` | TEXT | YES | - | - |
| `nationality` | TEXT | YES | `'Indian'` | - |
| `father_name` | TEXT | YES | - | - |
| `mother_name` | TEXT | YES | - | - |
| `parent_phone` | TEXT | YES | - | - |
| `address` | TEXT | YES | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Trigger:** `update_personal_details_updated_at` (BEFORE UPDATE)

---

### 5. **certificates** (Certificate Applications)

**Purpose:** Main certificate application records

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `student_id` | UUID | NO | - | FK → `students(id)` ON DELETE CASCADE |
| `certificate_type` | `certificate_type` ENUM | NO | - | `{tc, bonafide, attendance, conduct, training, course_completion, internship, custom}` |
| `status` | `certificate_status` ENUM | NO | `'pending'` | `{pending, approved, rejected}` |
| `application_date` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `issue_date` | TIMESTAMP WITH TIME ZONE | YES | - | - |
| `admin_remarks` | TEXT | YES | - | - |
| `hod_authorization_url` | TEXT | YES | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Trigger:** `update_certificates_updated_at` (BEFORE UPDATE)  
**Row Count:** 55

---

### 6. **certificate_files** (Uploaded Files)

**Purpose:** Store certificate-related file references

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` ON DELETE CASCADE |
| `file_type` | TEXT | NO | - | - |
| `file_name` | TEXT | NO | - | - |
| `file_url` | TEXT | NO | - | - |
| `uploaded_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes

---

### 7. **tc_details** (Transfer Certificate Details)

**Purpose:** Specific details for TC certificate type

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` UNIQUE |
| `tc_type` | TEXT | NO | - | - |
| `reason` | TEXT | YES | - | - |
| `exam_name` | TEXT | YES | - | - |
| `exam_year` | TEXT | YES | - | - |
| `exam_month` | TEXT | YES | - | - |
| `seat_no` | TEXT | YES | - | - |
| `cgpa` | TEXT | YES | - | - |
| `grade` | TEXT | YES | - | - |
| `new_college_name` | TEXT | YES | - | - |
| `new_college_address` | TEXT | YES | - | - |
| `contact_address` | TEXT | YES | - | - |
| `contact_phone` | TEXT | YES | - | - |

**RLS Enabled:** ✅ Yes

---

### 8. **bonafide_details** (Bonafide Certificate Details)

**Purpose:** Specific details for Bonafide certificate type

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` UNIQUE |
| `purpose` | TEXT | NO | - | - |
| `dob_words` | TEXT | YES | - | - |
| `current_address` | TEXT | YES | - | - |
| `division` | TEXT | YES | - | - |

**RLS Enabled:** ✅ Yes

---

### 9. **attendance_details** (Attendance Certificate Details)

**Purpose:** Specific details for Attendance certificate type

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` UNIQUE |
| `from_date` | DATE | NO | - | - |
| `to_date` | DATE | NO | - | - |
| `faculty_name` | TEXT | YES | - | - |
| `reason` | TEXT | YES | - | - |

**RLS Enabled:** ✅ Yes

---

### 10. **conduct_details** (Conduct Certificate Details)

**Purpose:** Specific details for Conduct certificate type

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` UNIQUE |
| `period_of_study` | TEXT | NO | - | - |
| `purpose` | TEXT | YES | - | - |
| `has_disciplinary_remarks` | BOOLEAN | YES | `false` | - |

**RLS Enabled:** ✅ Yes

---

### 11. **training_details** (Training Certificate Details)

**Purpose:** Specific details for Training certificate type

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `certificate_id` | UUID | NO | - | FK → `certificates(id)` UNIQUE |
| `training_title` | TEXT | NO | - | - |
| `from_date` | DATE | NO | - | - |
| `to_date` | DATE | NO | - | - |
| `conducted_by` | TEXT | YES | - | - |
| `skills_acquired` | TEXT | YES | - | - |
| `training_type` | TEXT | YES | - | - |

**RLS Enabled:** ✅ Yes

---

### 12. **certificate_templates** (Template Management)

**Purpose:** Store certificate templates for generation

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `name` | TEXT | NO | - | - |
| `type` | TEXT | NO | - | Certificate type (tc, bonafide, etc.) |
| `description` | TEXT | YES | - | - |
| `template_url` | TEXT | YES | - | Document template URL |
| `template_content` | JSONB | YES | `NULL` | Structured template content |
| `is_active` | BOOLEAN | YES | `true` | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Row Count:** 0

---

### 13. **approval_chains** (Approval Configuration)

**Purpose:** Define multi-step approval workflows

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `name` | TEXT | NO | - | - |
| `certificate_types` | TEXT[] | YES | - | Array of certificate types |
| `is_active` | BOOLEAN | YES | `true` | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Row Count:** 0

---

### 14. **approvals** (Individual Approval Records)

**Purpose:** Track individual approvals in a chain

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `chain_id` | UUID | NO | - | FK → `approval_chains(id)` |
| `authority_id` | UUID | YES | - | FK → `authority_profiles(id)` |
| `sequence` | INTEGER | YES | - | Order in approval chain |
| `certificate_id` | UUID | YES | - | FK → `certificates(id)` |
| `status` | TEXT | YES | `'pending'` | Status of approval |
| `remarks` | TEXT | YES | - | - |
| `approved_at` | TIMESTAMP WITH TIME ZONE | YES | - | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes  
**Row Count:** 0

---

### 15. **authority_profiles** (Authority Information)

**Purpose:** Store authority/approver profiles

| Column | Type | Nullable | Default | Constraints |
|--------|------|----------|---------|-------------|
| `id` | UUID | NO | `gen_random_uuid()` | PRIMARY KEY |
| `user_id` | UUID | NO | - | FK → `auth.users(id)` UNIQUE |
| `display_name` | TEXT | NO | - | - |
| `role_title` | TEXT | YES | - | (e.g., "HOD", "Principal") |
| `is_active` | BOOLEAN | YES | `true` | - |
| `created_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |
| `updated_at` | TIMESTAMP WITH TIME ZONE | NO | `now()` | - |

**RLS Enabled:** ✅ Yes

---

## ENUM Types

### 1. **app_role**

User role enumeration for authorization

```sql
CREATE TYPE public.app_role AS ENUM ('admin', 'student', 'hod', 'authority');
```

**Values:**
- `'admin'` - Administrator with full system access
- `'student'` - Student user with limited access to own certificates
- `'hod'` - Head of Department, can view/approve student certificates
- `'authority'` - Authority who can approve certificates in chain

---

### 2. **certificate_type**

Supported certificate types

```sql
CREATE TYPE public.certificate_type AS ENUM (
  'tc',
  'bonafide',
  'attendance',
  'conduct',
  'training',
  'course_completion',
  'internship',
  'custom'
);
```

**Values:**
| Type | Description |
|------|-------------|
| `'tc'` | Transfer Certificate |
| `'bonafide'` | Bonafide Certificate |
| `'attendance'` | Attendance Certificate |
| `'conduct'` | Conduct Certificate |
| `'training'` | Training Certificate |
| `'course_completion'` | Course Completion Certificate |
| `'internship'` | Internship Certificate |
| `'custom'` | Custom Certificate |

---

### 3. **certificate_status**

Certificate application status

```sql
CREATE TYPE public.certificate_status AS ENUM ('pending', 'approved', 'rejected');
```

**Values:**
- `'pending'` - Awaiting approval
- `'approved'` - Approved by authority
- `'rejected'` - Rejected by authority

---

## Functions

### Security-Critical Functions (SECURITY DEFINER)

#### 1. [`has_role()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:157)

**Purpose:** Check if a user has a specific role  
**Security Level:** SECURITY DEFINER  
**Volatility:** STABLE

```sql
CREATE OR REPLACE FUNCTION public.has_role(_user_id UUID, _role app_role)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;
```

**Parameters:**
- `_user_id` (UUID): User ID to check
- `_role` (app_role): Role to verify

**Returns:** BOOLEAN (true if user has role)

**Usage Example:**
```sql
SELECT public.has_role(auth.uid(), 'admin');
```

---

#### 2. [`is_admin()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:173)

**Purpose:** Check if current user is admin  
**Security Level:** SECURITY DEFINER  
**Volatility:** STABLE

```sql
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'admin')
$$;
```

**Usage Example:**
```sql
SELECT * FROM certificates WHERE public.is_admin() OR student_id = public.get_student_id();
```

---

#### 3. [`is_hod()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:184)

**Purpose:** Check if current user is HOD  
**Security Level:** SECURITY DEFINER  
**Volatility:** STABLE

```sql
CREATE OR REPLACE FUNCTION public.is_hod()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT public.has_role(auth.uid(), 'hod')
$$;
```

---

#### 4. [`get_student_id()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:195)

**Purpose:** Get student ID for current authenticated user  
**Security Level:** SECURITY DEFINER  
**Volatility:** STABLE

```sql
CREATE OR REPLACE FUNCTION public.get_student_id()
RETURNS UUID
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT id FROM public.students WHERE user_id = auth.uid()
$$;
```

**Returns:** Student UUID or NULL if not a student

---

#### 5. [`handle_new_user()`](supabase/migrations/20260208130841_25d08797-66b1-44c0-b531-156ed3f34f34.sql:3)

**Purpose:** Auto-create user roles and student profile on signup  
**Security Level:** SECURITY DEFINER  
**Type:** TRIGGER FUNCTION

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
-- Creates user_roles and students records on new signup
-- Extracts metadata from raw_user_meta_data
$$;
```

**Triggered By:**
- `on_auth_user_created` trigger on `auth.users` INSERT

**Operations:**
1. Generates unique `student_id`
2. Creates `user_roles` entry with role='student'
3. Creates `students` profile from auth metadata

---

#### 6. [`update_updated_at_column()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:334)

**Purpose:** Auto-update `updated_at` timestamp  
**Type:** TRIGGER FUNCTION

```sql
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;
```

**Applied To:**
- `students` table
- `personal_details` table
- `certificates` table
- `profiles` table
- `authority_profiles` table
- `certificate_templates` table
- `approval_chains` table

---

#### 7. [`generate_student_id()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:356)

**Purpose:** Auto-generate unique student IDs  
**Format:** YYYY + 0001 (year + 4-digit sequence)

```sql
CREATE OR REPLACE FUNCTION public.generate_student_id()
RETURNS TEXT
LANGUAGE plpgsql
SET search_path = public
AS $$
DECLARE
  current_year TEXT;
  seq_num INTEGER;
BEGIN
  current_year := EXTRACT(YEAR FROM now())::TEXT;
  SELECT COALESCE(MAX(CAST(SUBSTRING(student_id FROM 5) AS INTEGER)), 0) + 1
  INTO seq_num
  FROM public.students
  WHERE student_id LIKE current_year || '%';
  RETURN current_year || LPAD(seq_num::TEXT, 4, '0');
END;
$$;
```

**Example Output:** `20260001`, `20260002`, etc.

---

#### 8. [`manage_authority_rpc()`](supabase/migrations/20260225000002_manage_authority_rpc.sql:11)

**Purpose:** Manage authority users (create, update, delete)  
**Security Level:** SECURITY DEFINER  
**Type:** Complex RPC function

```sql
CREATE OR REPLACE FUNCTION public.manage_authority_rpc(
  p_action TEXT,
  p_email TEXT DEFAULT NULL,
  p_password TEXT DEFAULT NULL,
  p_display_name TEXT DEFAULT NULL,
  p_role_title TEXT DEFAULT NULL,
  p_authority_user_id UUID DEFAULT NULL,
  p_is_active BOOLEAN DEFAULT NULL
) RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, auth, extensions
```

**Supported Actions:**
- `'create'` - Create new authority user
- `'update'` - Update authority details
- `'delete'` - Delete authority user

**Example:**
```sql
SELECT public.manage_authority_rpc(
  'create',
  'hod@college.edu',
  'secure_password',
  'Dr. John DOE',
  'HOD - Computer Science'
);
```

**Security Check:** Only admins can execute

---

## Triggers

### Trigger Registry

| Trigger Name | Table | Event | Function | Purpose |
|---|---|---|---|---|
| `on_auth_user_created` | `auth.users` | AFTER INSERT | [`handle_new_user()`](supabase/migrations/20260130841_25d08797-66b1-44c0-b531-156ed3f34f34.sql:46) | Auto-create user profile on signup |
| `update_students_updated_at` | `students` | BEFORE UPDATE | [`update_updated_at_column()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:343) | Update timestamp |
| `update_personal_details_updated_at` | `personal_details` | BEFORE UPDATE | [`update_updated_at_column()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:347) | Update timestamp |
| `update_certificates_updated_at` | `certificates` | BEFORE UPDATE | [`update_updated_at_column()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:351) | Update timestamp |

---

## RLS Policies

### RLS Policy Summary

**Total Policies:** 40+  
**Status:** ✅ All tables have RLS enabled

### Policy Patterns

#### Pattern 1: Self-View + Admin Full Access
```sql
-- Users can view their own data
USING (user_id = auth.uid() OR public.is_admin())
```

#### Pattern 2: Admin-Only Management
```sql
-- Only admins can manage
USING (public.is_admin())
WITH CHECK (public.is_admin())
```

#### Pattern 3: Multi-Role Visibility (Student/HOD/Admin)
```sql
-- Multiple roles can view
USING (
  student_id = public.get_student_id() 
  OR public.is_admin() 
  OR public.is_hod()
)
```

---

### Detailed Policy Breakdown

#### **user_roles** (4 policies)

| Policy Name | Operation | Condition |
|---|---|---|
| "Users can view their own roles" | SELECT | `user_id = auth.uid() OR public.is_admin()` |
| "Only admins can insert roles" | INSERT | `public.is_admin()` |
| "Only admins can update roles" | UPDATE | `public.is_admin()` |
| "Only admins can delete roles" | DELETE | `public.is_admin()` |

---

#### **students** (4 policies)

| Policy Name | Operation | Condition |
|---|---|---|
| "Students can view their own profile" | SELECT | `user_id = auth.uid() OR public.is_admin() OR public.is_hod()` |
| "Students can create their own profile" | INSERT | `user_id = auth.uid() OR public.is_admin()` |
| "Students can update their own profile" | UPDATE | `user_id = auth.uid() OR public.is_admin()` |
| "Only admins can delete students" | DELETE | `public.is_admin()` |

---

#### **certificates** (4 policies)

| Policy Name | Operation | Condition |
|---|---|---|
| "Students can view their own certificates" | SELECT | `student_id = public.get_student_id() OR public.is_admin() OR public.is_hod()` |
| "Students can create their own certificates" | INSERT | `student_id = public.get_student_id() OR public.is_admin()` |
| "Admins and HODs can update certificates" | UPDATE | `public.is_admin() OR public.is_hod()` |
| "Only admins can delete certificates" | DELETE | `public.is_admin()` |

---

#### **certificate_files** (3 policies)

| Policy Name | Operation | Condition |
|---|---|---|
| "Users can view certificate files" | SELECT | File's certificate viewable by user |
| "Students can upload certificate files" | INSERT | File's certificate writable by user |
| "Admins can delete certificate files" | DELETE | `public.is_admin()` |

---

#### **Detail Tables** (tc_details, bonafide_details, etc.) (2 policies each)

| Policy Name | Operation | Condition |
|---|---|---|
| "View [Type] details" | SELECT | Certificate accessible to user |
| "Create [Type] details" | INSERT | Certificate accessible to user |

---

#### **profiles** (5 policies)

| Policy Name | Operation | Condition |
|---|---|---|
| "Users can view their own profile" | SELECT | `user_id = auth.uid()` |
| "Admins can view all profiles" | SELECT | `public.is_admin()` |
| "HODs can view all profiles" | SELECT | `public.is_hod()` |
| "Users can insert their own profile" | INSERT | `user_id = auth.uid()` |
| "Users can update their own profile" | UPDATE | `user_id = auth.uid()` |

---

#### **Storage Policies** (3 policies)

| Policy Name | Bucket | Operation | Condition |
|---|---|---|---|
| "Students can upload their own files" | `certificate-files` | INSERT | User folder match |
| "Students can view their own files" | `certificate-files` | SELECT | User folder match OR admin/HOD |
| "Admins can delete files" | `certificate-files` | DELETE | `public.is_admin()` |

---

## Row Counts & Statistics

### Data Summary (as of 2026-03-17T06:55:16Z)

| Table | Row Count | Status | Purpose |
|-------|-----------|--------|---------|
| `certificates` | **55** | ✅ Active | Main certificate applications |
| `users` (auth) | Unknown | ✅ Managed by Auth | User accounts |
| `students` | Unknown | ✅ Active | Student profiles |
| `user_roles` | Unknown | ✅ Active | Role assignments |
| `profiles` | Unknown | ✅ Active | User profiles |
| `personal_details` | Unknown | ✅ Active | Student details |
| `certificate_files` | Unknown | ✅ Active | Uploaded files |
| `tc_details` | Unknown | ✅ Active | TC-specific data |
| `bonafide_details` | Unknown | ✅ Active | Bonafide-specific data |
| `attendance_details` | Unknown | ✅ Active | Attendance-specific data |
| `conduct_details` | Unknown | ✅ Active | Conduct-specific data |
| `training_details` | Unknown | ✅ Active | Training-specific data |
| `certificate_templates` | 0 | ⚠️ Empty | Template definitions |
| `approval_chains` | 0 | ⚠️ Empty | Approval workflows |
| `approvals` | 0 | ⚠️ Empty | Approval records |
| `authority_profiles` | Unknown | ✅ Active | Authority users |

---

## Certificate Data Breakdown

### Certificate Status Distribution

**Total Certificates:** 55

| Status | Count | Percentage |
|--------|-------|-----------|
| ✅ **Approved** | 44 | 80% |
| ⏳ **Pending** | 7 | 13% |
| ❌ **Rejected** | 4 | 7% |

### Status Trend

```
Approved  ████████████████████████████████████████ 44 (80%)
Pending   ███               7 (13%)
Rejected  ██                4 (7%)
```

### Certificate Types Expected (from schema)

Based on the `certificate_type` ENUM, the system supports:
- Transfer Certificate (TC)
- Bonafide Certificate
- Attendance Certificate
- Conduct Certificate
- Training Certificate
- Course Completion Certificate
- Internship Certificate
- Custom Certificate

---

## User Roles Distribution

### Role Assignment (from schema)

Based on `app_role` ENUM:

| Role | Purpose | Permissions |
|------|---------|-------------|
| **student** | Certificate requester | Submit certificates, view own data |
| **admin** | System administrator | Manage all data, approve certificates, manage authorities |
| **hod** | Head of Department | View certificates, approve certificates |
| **authority** | Approval authority | Participate in approval chains |

### Role Hierarchy

```
┌─────────────────────────────────────┐
│         System Roles (Admin)        │
│  - Manage all users and data        │
│  - Create/approve/reject all certs  │
│  - Manage authorities and HODs      │
└─────────────────────────────────────┘
              │
              ├─────────────────────┬───────────────┐
              │                     │               │
      ┌───────▼────────┐   ┌───────▼────────┐   ┌─▼──────────────┐
      │  HOD Role      │   │  Authority     │   │  Student Role  │
      │- View students │   │- Approve certs │   │- Submit certs  │
      │- Approve certs │   │- In chain      │   │- View own data │
      └────────────────┘   └────────────────┘   └────────────────┘
```

---

## Template Configurations

### Current Templates

**Status:** ⚠️ No templates found (Row count: 0)

**Expected Templates** (from code):

1. **Attendance Certificate**
   - File: `attendance-certificate_default.docx`
   - Type: `attendance`
   - Status: Not seeded

2. **Bonafide Certificate**
   - File: `bonafide_certificate_default.docx`
   - Type: `bonafide`
   - Status: Not seeded

3. **Conduct Certificate**
   - File: `conduct_certificate_default.docx`
   - Type: `conduct`
   - Status: Not seeded

4. **Training Certificate**
   - File: `training_certificate_default.docx`
   - Type: `training`
   - Status: Not seeded

5. **Transfer Certificate (TC)**
   - File: `transfer_certificate_default.docx`
   - Type: `tc`
   - Status: Not seeded

6. **Course Completion Certificate**
   - Type: `course_completion`
   - Status: Not seeded

---

### Template Content Structure (JSONB)

Templates can store structured content in JSONB format:

```json
{
  "header": {
    "institution_name": "St. Peter's College of Engineering and Technology",
    "certificate_title": "BONAFIDE CERTIFICATE",
    "logo_url": "https://..."
  },
  "body": "This is to certify that <name> of Roll No <rollno> ...",
  "footer": {
    "signatory_name": "Principal",
    "signatory_designation": "St. Peter's College",
    "show_date": true
  }
}
```

### Recommended Actions

⚠️ **ACTION REQUIRED**: Seed certificate templates

```sql
INSERT INTO certificate_templates 
(name, type, template_url, is_active) 
VALUES 
('Bonafide', 'bonafide', 'storage://templates/bonafide.docx', true),
('TC', 'tc', 'storage://templates/tc.docx', true),
-- ... etc
```

---

## Approval Chain Configurations

### Current Approval Chains

**Status:** ⚠️ No chains configured (Row count: 0)

### Recommended Approval Chain Structure

#### Chain 1: Standard Certificate Approval

```
Certificate Application (Student)
            │
            ▼
    ┌───────────────┐
    │  HOD Review   │  (Verify student record & request)
    │  (Optional)   │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Admin Review │  (Final approval/rejection)
    │  (Required)   │
    └───────┬───────┘
            │
            ▼
    ┌───────────────┐
    │  Generate &   │
    │  Issue Cert   │
    └───────────────┘
```

#### Chain 2: HOD Authorization Required

```
Certificate Application (Student)
            │
            ▼
    ┌───────────────────┐
    │  HOD Assessment   │  (Must approve)
    │  & Sign-off       │
    └───────┬───────────┘
            │
            ▼
    ┌───────────────────┐
    │  Principal Review │  (Final authority)
    │  & Approval       │
    └───────┬───────────┘
            │
            ▼
    ┌───────────────────┐
    │  Issue & Store    │
    │  Certificate      │
    └───────────────────┘
```

### Database Schema for Chains

**approval_chains table:**
- Stores chain definitions
- `certificate_types`: Array of certificate types in this chain
- `is_active`: Enable/disable chains

**approvals table:**
- Stores individual approval steps
- `sequence`: Order in chain (1, 2, 3...)
- `authority_id`: Which authority/role approves
- `status`: Current state (pending, approved, rejected)

### Configuration Example

```sql
-- Create approval chain
INSERT INTO approval_chains (name, certificate_types, is_active)
VALUES 
(
  'Standard HOD + Admin',
  ARRAY['bonafide', 'tc', 'conduct'],
  true
);

-- Get the chain ID and add approval steps
INSERT INTO approvals (chain_id, authority_id, sequence, status)
VALUES 
(chain_id, hod_user_id, 1, 'pending'),
(chain_id, admin_user_id, 2, 'pending');
```

---

## Security Analysis

### ✅ Security Strengths

1. **Row Level Security (RLS)** - All tables protected
2. **SECURITY DEFINER Functions** - Privilege escalation properly controlled
3. **Role-Based Access Control (RBAC)** - Clear role hierarchy
4. **Cascading Deletes** - Data consistency maintained
5. **Auth Integration** - Leverages Supabase Auth system
6. **Storage Policies** - File access restricted

### ⚠️ Potential Improvements

1. **Audit Logging** - Consider adding audit tables for compliance
2. **Rate Limiting** - Implement rate limits on approval functions
3. **Encryption** - Consider encrypting sensitive fields (aadhar_no, phone)
4. **API Rate Limiting** - Configure at application layer
5. **Certificate Signing** - Implement digital signatures for issued certificates

---

## Recommendations

### 🎯 Priority 1: Critical (Do Immediately)

1. **Seed Certificate Templates**
   - Create template records in `certificate_templates`
   - Upload template documents to storage

2. **Configure Approval Chains**
   - Define at least one approval chain
   - Create approval steps for each chain

3. **Verify Auth Configuration**
   - Ensure email verification is working
   - Test user signup flow

### 🎯 Priority 2: Important (Do Soon)

1. **Populate Test Data**
   - Create test users with different roles
   - Create test certificates for each type

2. **Test All Functions**
   - Verify `manage_authority_rpc()` works
   - Test all RLS policies

3. **Enable Audit Logging**
   - Consider adding audit tables
   - Log all certificate approvals

### 🎯 Priority 3: Enhancement (Do Later)

1. **Add Certificate Signing**
   - Implement digital signatures
   - Add signature verification

2. **Optimize Queries**
   - Add indexes on frequently queried columns
   - Monitor performance

3. **API Documentation**
   - Document all RPC functions
   - Create Postman collection

---

## Maintenance Tasks

### Daily
- Monitor error logs
- Check approval queue

### Weekly
- Verify backups
- Review access logs

### Monthly
- Audit RLS policies
- Clean up old files

### Quarterly
- Performance analysis
- Security audit

---

## Conclusion

The Certi-Portal database is well-structured with comprehensive security measures through RLS and role-based access control. The schema supports multiple certificate types with detailed information capture. However, several configuration steps are needed:

1. ✅ **Schema:** Complete and properly designed
2. ⚠️ **Templates:** Not yet seeded
3. ⚠️ **Approval Chains:** Not yet configured
4. ✅ **Data:** 55 certificates in system
5. ✅ **Security:** Properly implemented

**Overall Status:** 📊 Ready with configuration pending

---

## Quick Reference

### Important Functions
- [`has_role()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:157) - Check user role
- [`is_admin()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:173) - Check if admin
- [`is_hod()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:184) - Check if HOD
- [`get_student_id()`](supabase/migrations/20260208115009_5ba397e2-c423-4e26-9463-f03433bfb9fb.sql:195) - Get current student ID
- [`manage_authority_rpc()`](supabase/migrations/20260225000002_manage_authority_rpc.sql:11) - Manage authority users

### Key Tables
- `certificates` - Main application table (55 records)
- `users` (auth) - User accounts
- `user_roles` - Role assignments
- `certificate_templates` - Template definitions
- `approval_chains` - Approval workflow configurations

### Enum Types
- `app_role` - {admin, student, hod, authority}
- `certificate_type` - {tc, bonafide, attendance, conduct, training, course_completion, internship, custom}
- `certificate_status` - {pending, approved, rejected}

---

**Report Generated:** 2026-03-17T06:55:16.652Z  
**Database:** boymejjlnrlbfizavzgn (Supabase)  
**Analysis Version:** 1.0
