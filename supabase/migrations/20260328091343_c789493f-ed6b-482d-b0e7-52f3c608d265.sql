
-- Step 1: Add missing columns to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS academic_year text;
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS semester text;

-- Step 2: Drop the old manage_authority_rpc (7-param version without p_department)
DROP FUNCTION IF EXISTS public.manage_authority_rpc(text, text, text, text, text, uuid, boolean);

-- Step 3: Update trigger function for case-insensitive matching
CREATE OR REPLACE FUNCTION public.create_approval_steps_on_cert_submit()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  v_student_branch TEXT;
  v_resolved_user_id UUID;
  v_chain_row RECORD;
BEGIN
  SELECT p.branch INTO v_student_branch
  FROM public.profiles p
  WHERE p.id = NEW.student_id;

  FOR v_chain_row IN
    SELECT tac.authority_user_id, tac.approval_order, tac.is_department_role, ap.role_title
    FROM public.template_approval_chain tac
    JOIN public.certificate_templates ct ON tac.template_id = ct.id
    LEFT JOIN public.authority_profiles ap ON ap.user_id = tac.authority_user_id
    WHERE ct.certificate_type = NEW.certificate_type
    ORDER BY tac.approval_order
  LOOP
    IF v_chain_row.is_department_role AND v_student_branch IS NOT NULL THEN
      SELECT ap2.user_id INTO v_resolved_user_id
      FROM public.authority_profiles ap2
      WHERE LOWER(ap2.department) = LOWER(v_student_branch)
        AND LOWER(ap2.role_title) = LOWER(v_chain_row.role_title)
        AND ap2.is_active = true
      LIMIT 1;

      IF v_resolved_user_id IS NULL THEN
        v_resolved_user_id := v_chain_row.authority_user_id;
      END IF;
    ELSE
      v_resolved_user_id := v_chain_row.authority_user_id;
    END IF;

    INSERT INTO public.certificate_approvals (certificate_id, authority_user_id, approval_order)
    VALUES (NEW.id, v_resolved_user_id, v_chain_row.approval_order);
  END LOOP;

  RETURN NEW;
END;
$function$;
