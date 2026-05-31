
-- 1. Add department column to authority_profiles
ALTER TABLE public.authority_profiles ADD COLUMN department TEXT DEFAULT NULL;

-- 2. Add is_department_role column to template_approval_chain
ALTER TABLE public.template_approval_chain ADD COLUMN is_department_role BOOLEAN NOT NULL DEFAULT false;

-- 3. Update manage_authority_rpc to accept p_department
CREATE OR REPLACE FUNCTION public.manage_authority_rpc(
  p_action text,
  p_email text DEFAULT NULL,
  p_password text DEFAULT NULL,
  p_display_name text DEFAULT NULL,
  p_role_title text DEFAULT NULL,
  p_authority_user_id uuid DEFAULT NULL,
  p_is_active boolean DEFAULT NULL,
  p_department text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'auth', 'extensions'
AS $function$
DECLARE
  v_caller_role TEXT;
  v_new_user_id UUID;
  v_encrypted_pw TEXT;
BEGIN
  SELECT role INTO v_caller_role FROM public.user_roles WHERE user_id = auth.uid() AND role = 'admin';
  IF v_caller_role IS NULL THEN
    RAISE EXCEPTION 'Admin access required';
  END IF;

  IF p_action = 'create' THEN
    IF p_email IS NULL OR p_password IS NULL OR p_display_name IS NULL OR p_role_title IS NULL THEN
      RAISE EXCEPTION 'Missing required fields for create';
    END IF;
    IF EXISTS (SELECT 1 FROM auth.users WHERE email = p_email) THEN
      RETURN jsonb_build_object('error', 'A user with this email already exists.');
    END IF;
    v_new_user_id := gen_random_uuid();
    v_encrypted_pw := extensions.crypt(p_password, extensions.gen_salt('bf'));
    INSERT INTO auth.users (
      instance_id, id, aud, role, email, encrypted_password, email_confirmed_at,
      raw_app_meta_data, raw_user_meta_data, created_at, updated_at,
      confirmation_token, recovery_token, email_change_token_current,
      email_change_token_new, email_change, reauthentication_token,
      phone_change_token, phone_change
    ) VALUES (
      '00000000-0000-0000-0000-000000000000', v_new_user_id, 'authenticated', 'authenticated',
      p_email, v_encrypted_pw, now(),
      '{"provider":"email","providers":["email"]}',
      json_build_object('full_name', p_display_name), now(), now(),
      '', '', '', '', '', '', '', ''
    );
    INSERT INTO auth.identities (
      id, user_id, identity_data, provider, provider_id, last_sign_in_at, created_at, updated_at
    ) VALUES (
      gen_random_uuid(), v_new_user_id,
      json_build_object('sub', v_new_user_id, 'email', p_email),
      'email', p_email, now(), now(), now()
    );
    IF EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = v_new_user_id) THEN
      UPDATE public.user_roles SET role = 'authority' WHERE user_id = v_new_user_id;
    ELSE
      INSERT INTO public.user_roles (user_id, role) VALUES (v_new_user_id, 'authority');
    END IF;
    INSERT INTO public.authority_profiles (user_id, display_name, role_title, department)
    VALUES (v_new_user_id, p_display_name, p_role_title, p_department);
    RETURN jsonb_build_object('message', 'Authority created', 'user_id', v_new_user_id);

  ELSIF p_action = 'update' THEN
    IF p_authority_user_id IS NULL THEN
      RAISE EXCEPTION 'Missing authority_user_id for update';
    END IF;
    IF p_display_name IS NOT NULL THEN
      UPDATE public.authority_profiles SET display_name = p_display_name, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;
    IF p_role_title IS NOT NULL THEN
      UPDATE public.authority_profiles SET role_title = p_role_title, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;
    IF p_is_active IS NOT NULL THEN
      UPDATE public.authority_profiles SET is_active = p_is_active, updated_at = now() WHERE user_id = p_authority_user_id;
    END IF;
    -- Always update department (even if NULL, to allow clearing it)
    UPDATE public.authority_profiles SET department = p_department, updated_at = now() WHERE user_id = p_authority_user_id;
    RETURN jsonb_build_object('message', 'Authority updated');

  ELSIF p_action = 'delete' THEN
    IF p_authority_user_id IS NULL THEN
      RAISE EXCEPTION 'Missing authority_user_id for delete';
    END IF;
    DELETE FROM auth.users WHERE id = p_authority_user_id;
    RETURN jsonb_build_object('message', 'Authority deleted');

  ELSE
    RAISE EXCEPTION 'Unknown action';
  END IF;
END;
$function$;

-- 4. Update the trigger function to handle department-specific routing
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
  -- Get student's branch
  SELECT p.branch INTO v_student_branch
  FROM public.profiles p
  WHERE p.id = NEW.student_id;

  -- Loop through approval chain for this certificate type
  FOR v_chain_row IN
    SELECT tac.authority_user_id, tac.approval_order, tac.is_department_role, ap.role_title
    FROM public.template_approval_chain tac
    JOIN public.certificate_templates ct ON tac.template_id = ct.id
    LEFT JOIN public.authority_profiles ap ON ap.user_id = tac.authority_user_id
    WHERE ct.certificate_type = NEW.certificate_type
    ORDER BY tac.approval_order
  LOOP
    IF v_chain_row.is_department_role AND v_student_branch IS NOT NULL THEN
      -- Find authority with matching department and same role_title
      SELECT ap2.user_id INTO v_resolved_user_id
      FROM public.authority_profiles ap2
      WHERE ap2.department = v_student_branch
        AND ap2.role_title = v_chain_row.role_title
        AND ap2.is_active = true
      LIMIT 1;

      -- Fallback to the hardcoded authority if no department match found
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
